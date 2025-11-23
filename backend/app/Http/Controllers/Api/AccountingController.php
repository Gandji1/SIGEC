<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AccountingEntry;
use App\Models\Sale;
use App\Models\Purchase;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AccountingController extends Controller
{
    public function ledger(Request $request): JsonResponse
    {
        $tenantId = $request->header('X-Tenant-ID');
        
        $query = AccountingEntry::where('tenant_id', $tenantId);

        if ($request->has('account_code')) {
            $query->where('account_code', $request->query('account_code'));
        }

        if ($request->has('start_date')) {
            $query->whereDate('posting_date', '>=', $request->query('start_date'));
        }

        if ($request->has('end_date')) {
            $query->whereDate('posting_date', '<=', $request->query('end_date'));
        }

        if ($request->has('posted')) {
            $posted = $request->query('posted') === 'true';
            $query->where('posted', $posted);
        }

        $entries = $query->orderBy('posting_date', 'desc')
            ->orderBy('created_at', 'desc')
            ->paginate(50);

        return response()->json($entries);
    }

    public function trialBalance(Request $request): JsonResponse
    {
        $tenantId = $request->header('X-Tenant-ID');
        
        $startDate = $request->query('start_date') ?? now()->startOfMonth();
        $endDate = $request->query('end_date') ?? now();

        $entries = AccountingEntry::where('tenant_id', $tenantId)
            ->where('posted', true)
            ->whereDate('posting_date', '>=', $startDate)
            ->whereDate('posting_date', '<=', $endDate)
            ->get();

        $balance = [];
        foreach ($entries as $entry) {
            $code = $entry->account_code;
            if (!isset($balance[$code])) {
                $balance[$code] = [
                    'account_code' => $code,
                    'account_name' => $entry->account_name,
                    'account_type' => $entry->account_type,
                    'debit' => 0,
                    'credit' => 0,
                ];
            }
            $balance[$code]['debit'] += $entry->debit;
            $balance[$code]['credit'] += $entry->credit;
            $balance[$code]['balance'] = $balance[$code]['debit'] - $balance[$code]['credit'];
        }

        return response()->json([
            'start_date' => $startDate,
            'end_date' => $endDate,
            'accounts' => array_values($balance),
            'total_debit' => array_sum(array_column($balance, 'debit')),
            'total_credit' => array_sum(array_column($balance, 'credit')),
        ]);
    }

    public function incomeStatement(Request $request): JsonResponse
    {
        $tenantId = $request->header('X-Tenant-ID');
        
        $startDate = $request->query('start_date') ?? now()->startOfMonth();
        $endDate = $request->query('end_date') ?? now();

        // Revenue accounts
        $revenue = AccountingEntry::where('tenant_id', $tenantId)
            ->where('posted', true)
            ->where('account_type', 'revenue')
            ->whereDate('posting_date', '>=', $startDate)
            ->whereDate('posting_date', '<=', $endDate)
            ->selectRaw('SUM(credit - debit) as total')
            ->value('total') ?? 0;

        // Expense accounts
        $expenses = AccountingEntry::where('tenant_id', $tenantId)
            ->where('posted', true)
            ->where('account_type', 'expense')
            ->whereDate('posting_date', '>=', $startDate)
            ->whereDate('posting_date', '<=', $endDate)
            ->selectRaw('SUM(debit - credit) as total')
            ->value('total') ?? 0;

        $netIncome = $revenue - $expenses;

        return response()->json([
            'period' => [
                'start_date' => $startDate,
                'end_date' => $endDate,
            ],
            'revenue' => $revenue,
            'expenses' => $expenses,
            'net_income' => $netIncome,
            'profit_margin' => $revenue > 0 ? ($netIncome / $revenue) * 100 : 0,
        ]);
    }

    public function balanceSheet(Request $request): JsonResponse
    {
        $tenantId = $request->header('X-Tenant-ID');
        
        $asOfDate = $request->query('as_of_date') ?? now();

        $entries = AccountingEntry::where('tenant_id', $tenantId)
            ->where('posted', true)
            ->whereDate('posting_date', '<=', $asOfDate)
            ->get();

        // Group by account type
        $assets = [];
        $liabilities = [];
        $equity = [];

        foreach ($entries as $entry) {
            $balance = $entry->debit - $entry->credit;
            $type = $entry->account_type;

            if ($type === 'asset') {
                $assets[$entry->account_code] = ($assets[$entry->account_code] ?? 0) + $balance;
            } elseif ($type === 'liability') {
                $liabilities[$entry->account_code] = ($liabilities[$entry->account_code] ?? 0) + $balance;
            } elseif ($type === 'equity') {
                $equity[$entry->account_code] = ($equity[$entry->account_code] ?? 0) + $balance;
            }
        }

        $totalAssets = array_sum($assets);
        $totalLiabilities = array_sum($liabilities);
        $totalEquity = array_sum($equity);

        return response()->json([
            'as_of_date' => $asOfDate,
            'assets' => $assets,
            'total_assets' => $totalAssets,
            'liabilities' => $liabilities,
            'total_liabilities' => $totalLiabilities,
            'equity' => $equity,
            'total_equity' => $totalEquity,
            'total_liabilities_and_equity' => $totalLiabilities + $totalEquity,
            'is_balanced' => abs($totalAssets - ($totalLiabilities + $totalEquity)) < 0.01,
        ]);
    }

    public function postEntry(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'entry_ids' => 'required|array|min:1',
            'entry_ids.*' => 'exists:accounting_entries,id',
        ]);

        try {
            DB::beginTransaction();

            foreach ($validated['entry_ids'] as $entryId) {
                $entry = AccountingEntry::find($entryId);
                
                if ($entry->tenant_id !== $request->header('X-Tenant-ID')) {
                    throw new \Exception('Unauthorized entry');
                }

                if ($entry->posted) {
                    throw new \Exception('Entry already posted');
                }

                $entry->update([
                    'posted' => true,
                    'posted_at' => now(),
                    'posted_by' => auth()->id(),
                ]);
            }

            DB::commit();

            return response()->json(['message' => 'Entries posted successfully']);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => $e->getMessage()], 400);
        }
    }

    public function summary(Request $request): JsonResponse
    {
        $tenantId = $request->header('X-Tenant-ID');
        
        $periodStart = $request->query('period_start') ?? now()->startOfMonth();
        $periodEnd = $request->query('period_end') ?? now();

        $totalSales = Sale::where('tenant_id', $tenantId)
            ->where('status', 'completed')
            ->whereDate('completed_at', '>=', $periodStart)
            ->whereDate('completed_at', '<=', $periodEnd)
            ->sum('total');

        $totalPurchases = Purchase::where('tenant_id', $tenantId)
            ->where('status', 'received')
            ->whereDate('received_at', '>=', $periodStart)
            ->whereDate('received_at', '<=', $periodEnd)
            ->sum('total');

        $totalTax = Sale::where('tenant_id', $tenantId)
            ->where('status', 'completed')
            ->whereDate('completed_at', '>=', $periodStart)
            ->whereDate('completed_at', '<=', $periodEnd)
            ->sum('tax_amount');

        return response()->json([
            'period' => [
                'start' => $periodStart,
                'end' => $periodEnd,
            ],
            'total_sales' => $totalSales,
            'total_purchases' => $totalPurchases,
            'total_tax' => $totalTax,
            'gross_profit' => $totalSales - $totalPurchases,
            'unposted_entries' => AccountingEntry::where('tenant_id', $tenantId)
                ->where('posted', false)
                ->count(),
        ]);
    }
}
