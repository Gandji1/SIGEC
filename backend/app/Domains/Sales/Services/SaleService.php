<?php

namespace App\Domains\Sales\Services;

use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\Product;
use App\Models\Stock;
use App\Models\AuditLog;
use App\Domains\Stocks\Services\StockService;
use Illuminate\Database\Eloquent\Collection;
use Exception;

class SaleService
{
    private StockService $stockService;

    public function __construct()
    {
        $this->stockService = new StockService();
    }

    public function createSale(array $data): Sale
    {
        $tenant_id = auth()->guard('sanctum')->user()->tenant_id;
        $user_id = auth()->guard('sanctum')->id();

        $sale = Sale::create([
            'tenant_id' => $tenant_id,
            'user_id' => $user_id,
            'reference' => $this->generateReference($tenant_id),
            'mode' => $data['mode'] ?? 'manual',
            'customer_name' => $data['customer_name'] ?? null,
            'customer_phone' => $data['customer_phone'] ?? null,
            'customer_email' => $data['customer_email'] ?? null,
            'payment_method' => $data['payment_method'] ?? 'cash',
            'status' => 'draft',
        ]);

        AuditLog::log('create', 'sale', $sale->id, $data, 'Sale created');

        return $sale;
    }

    public function addItem(Sale $sale, int $product_id, int $quantity, float $unit_price = null): SaleItem
    {
        $product = Product::find($product_id);

        if (!$product) {
            throw new Exception("Product not found");
        }

        $unit_price = $unit_price ?? $product->selling_price;

        $item = SaleItem::create([
            'tenant_id' => $sale->tenant_id,
            'sale_id' => $sale->id,
            'product_id' => $product_id,
            'quantity' => $quantity,
            'unit_price' => $unit_price,
            'tax_percent' => $product->tax_percent,
            'unit' => $product->unit,
        ]);

        $item->calculateTotals();
        $item->save();

        $sale->calculateTotals();
        $sale->save();

        return $item;
    }

    public function completeSale(Sale $sale, float $amount_paid, string $payment_method = 'cash'): Sale
    {
        // Valider le stock
        foreach ($sale->items as $item) {
            if (!$this->stockService->reserveStock($item->product_id, $item->quantity)) {
                throw new Exception("Insufficient stock for product {$item->product_id}");
            }
        }

        // Déduire le stock
        foreach ($sale->items as $item) {
            $this->stockService->removeStock($item->product_id, $item->quantity);
        }

        $sale->amount_paid = $amount_paid;
        $sale->payment_method = $payment_method;
        $sale->complete();

        AuditLog::log('update', 'sale', $sale->id, 
            ['status' => 'completed', 'amount_paid' => $amount_paid],
            "Sale completed with $payment_method payment"
        );

        return $sale;
    }

    public function cancelSale(Sale $sale): Sale
    {
        $sale->status = 'cancelled';
        $sale->save();

        // Libérer les stocks réservés
        foreach ($sale->items as $item) {
            $this->stockService->releaseStock($item->product_id, $item->quantity);
        }

        AuditLog::log('update', 'sale', $sale->id, ['status' => 'cancelled'], 'Sale cancelled');

        return $sale;
    }

    public function getSalesReport(string $start_date, string $end_date, $group_by = 'daily'): array
    {
        $sales = Sale::where('tenant_id', auth()->guard('sanctum')->user()->tenant_id)
            ->where('status', 'completed')
            ->whereBetween('completed_at', [$start_date, $end_date])
            ->get();

        $report = [];

        foreach ($sales as $sale) {
            $key = match ($group_by) {
                'daily' => $sale->completed_at->format('Y-m-d'),
                'weekly' => $sale->completed_at->format('Y-W'),
                'monthly' => $sale->completed_at->format('Y-m'),
                default => 'total',
            };

            if (!isset($report[$key])) {
                $report[$key] = [
                    'count' => 0,
                    'total' => 0,
                    'tax' => 0,
                ];
            }

            $report[$key]['count']++;
            $report[$key]['total'] += $sale->total;
            $report[$key]['tax'] += $sale->tax_amount;
        }

        return $report;
    }

    public function getDailySales(string $date): float
    {
        return Sale::where('tenant_id', auth()->guard('sanctum')->user()->tenant_id)
            ->whereDate('completed_at', $date)
            ->sum('total');
    }

    private function generateReference(int $tenant_id): string
    {
        $today = now()->format('Ymd');
        $count = Sale::where('tenant_id', $tenant_id)
            ->whereDate('created_at', now()->toDateString())
            ->count();

        return "SALE-$today-" . str_pad($count + 1, 4, '0', STR_PAD_LEFT);
    }
}
