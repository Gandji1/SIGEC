<?php

namespace App\Http\Controllers\Api;

use App\Models\Sale;
use App\Models\Purchase;
use App\Models\AccountingEntry;
use App\Models\Export;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;

class ReportController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:sanctum');
    }

    /**
     * Sales Journal (sync small export)
     */
    public function salesJournal(Request $request): JsonResponse
    {
        $tenant_id = auth()->guard('sanctum')->user()->tenant_id;
        $start_date = $request->query('start_date', now()->subMonth()->toDateString());
        $end_date = $request->query('end_date', now()->toDateString());

        $sales = Sale::where('tenant_id', $tenant_id)
            ->where('status', 'completed')
            ->whereBetween('completed_at', [$start_date, $end_date])
            ->with('items')
            ->get();

        $journal = $sales->map(fn($s) => [
            'date' => $s->completed_at->format('Y-m-d'),
            'reference' => $s->reference,
            'customer' => $s->customer_name ?? 'Walk-in',
            'total_ht' => $s->total - $s->tax_amount,
            'tax' => $s->tax_amount,
            'total_ttc' => $s->total,
            'items_count' => $s->items->count(),
        ]);

        return response()->json([
            'period' => ['start' => $start_date, 'end' => $end_date],
            'entries' => $journal,
            'summary' => [
                'total_sales' => $sales->sum('total'),
                'total_tax' => $sales->sum('tax_amount'),
                'transaction_count' => $sales->count(),
            ],
        ]);
    }

    /**
     * Purchases Journal
     */
    public function purchasesJournal(Request $request): JsonResponse
    {
        $tenant_id = auth()->guard('sanctum')->user()->tenant_id;
        $start_date = $request->query('start_date', now()->subMonth()->toDateString());
        $end_date = $request->query('end_date', now()->toDateString());

        $purchases = Purchase::where('tenant_id', $tenant_id)
            ->where('status', 'received')
            ->whereBetween('received_date', [$start_date, $end_date])
            ->with('items')
            ->get();

        $journal = $purchases->map(fn($p) => [
            'date' => $p->received_date->format('Y-m-d'),
            'reference' => $p->reference,
            'supplier' => $p->supplier_name,
            'total_ht' => $p->total - $p->tax_amount,
            'tax' => $p->tax_amount,
            'total_ttc' => $p->total,
            'items_count' => $p->items->count(),
        ]);

        return response()->json([
            'period' => ['start' => $start_date, 'end' => $end_date],
            'entries' => $journal,
            'summary' => [
                'total_purchases' => $purchases->sum('total'),
                'total_tax' => $purchases->sum('tax_amount'),
                'transaction_count' => $purchases->count(),
            ],
        ]);
    }

    /**
     * P&L Statement (Income Statement)
     */
    public function profitLoss(Request $request): JsonResponse
    {
        $tenant_id = auth()->guard('sanctum')->user()->tenant_id;
        $start_date = $request->query('start_date', now()->subMonth()->toDateString());
        $end_date = $request->query('end_date', now()->toDateString());

        $sales = Sale::where('tenant_id', $tenant_id)
            ->where('status', 'completed')
            ->whereBetween('completed_at', [$start_date, $end_date])
            ->sum('total');

        $purchases_cost = Purchase::where('tenant_id', $tenant_id)
            ->where('status', 'received')
            ->whereBetween('received_date', [$start_date, $end_date])
            ->sum('total');

        $expenses = AccountingEntry::where('tenant_id', $tenant_id)
            ->where('type', 'expense')
            ->whereBetween('date', [$start_date, $end_date])
            ->sum('amount');

        $gross_profit = $sales - $purchases_cost;
        $net_income = $gross_profit - $expenses;
        $margin_percent = $sales > 0 ? ($net_income / $sales) * 100 : 0;

        return response()->json([
            'period' => ['start' => $start_date, 'end' => $end_date],
            'revenue' => round($sales, 2),
            'cost_of_goods_sold' => round($purchases_cost, 2),
            'gross_profit' => round($gross_profit, 2),
            'expenses' => round($expenses, 2),
            'net_income' => round($net_income, 2),
            'margin_percent' => round($margin_percent, 2),
        ]);
    }

    /**
     * Trial Balance
     */
    public function trialBalance(Request $request): JsonResponse
    {
        $tenant_id = auth()->guard('sanctum')->user()->tenant_id;
        $date = $request->query('date', now()->toDateString());

        $entries = AccountingEntry::where('tenant_id', $tenant_id)
            ->where('date', '<=', $date)
            ->get();

        $balance = [];

        foreach ($entries as $entry) {
            // Debit side
            if (!isset($balance[$entry->account_debit])) {
                $balance[$entry->account_debit] = ['debit' => 0, 'credit' => 0];
            }
            $balance[$entry->account_debit]['debit'] += $entry->amount;

            // Credit side
            if (!isset($balance[$entry->account_credit])) {
                $balance[$entry->account_credit] = ['debit' => 0, 'credit' => 0];
            }
            $balance[$entry->account_credit]['credit'] += $entry->amount;
        }

        return response()->json([
            'date' => $date,
            'accounts' => $balance,
            'totals' => [
                'total_debit' => collect($balance)->sum('debit'),
                'total_credit' => collect($balance)->sum('credit'),
            ],
        ]);
    }

    /**
     * Export Sales Journal to XLSX (sync small)
     */
    public function exportSalesXlsx(Request $request)
    {
        $tenant_id = auth()->guard('sanctum')->user()->tenant_id;
        $start_date = $request->query('start_date', now()->subMonth()->toDateString());
        $end_date = $request->query('end_date', now()->toDateString());

        $sales = Sale::where('tenant_id', $tenant_id)
            ->where('status', 'completed')
            ->whereBetween('completed_at', [$start_date, $end_date])
            ->with('items')
            ->get();

        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('Sales Journal');

        // Headers
        $headers = ['Date', 'Reference', 'Customer', 'Total HT', 'Tax', 'Total TTC', 'Items'];
        foreach ($headers as $index => $header) {
            $sheet->setCellValueByColumnAndRow($index + 1, 1, $header);
        }

        // Data
        $row = 2;
        foreach ($sales as $sale) {
            $sheet->setCellValueByColumnAndRow(1, $row, $sale->completed_at->format('Y-m-d'));
            $sheet->setCellValueByColumnAndRow(2, $row, $sale->reference);
            $sheet->setCellValueByColumnAndRow(3, $row, $sale->customer_name ?? 'Walk-in');
            $sheet->setCellValueByColumnAndRow(4, $row, $sale->total - $sale->tax_amount);
            $sheet->setCellValueByColumnAndRow(5, $row, $sale->tax_amount);
            $sheet->setCellValueByColumnAndRow(6, $row, $sale->total);
            $sheet->setCellValueByColumnAndRow(7, $row, $sale->items->count());
            $row++;
        }

        // Auto-fit columns
        foreach (range('A', 'G') as $col) {
            $sheet->getColumnDimension($col)->setAutoSize(true);
        }

        $writer = new Xlsx($spreadsheet);
        $filename = 'sales_' . $start_date . '_' . $end_date . '.xlsx';

        header('Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        header('Content-Disposition: attachment;filename="' . $filename . '"');
        $writer->save('php://output');
        exit;
    }
}
