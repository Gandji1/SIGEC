<?php

namespace App\Domains\Purchases\Services;

use App\Models\Purchase;
use App\Models\PurchaseItem;
use App\Models\Product;
use App\Models\AuditLog;
use App\Domains\Stocks\Services\StockService;
use Illuminate\Database\Eloquent\Collection;
use Exception;

class PurchaseService
{
    private StockService $stockService;

    public function __construct()
    {
        $this->stockService = new StockService();
    }

    public function createPurchase(array $data): Purchase
    {
        $tenant_id = auth()->guard('sanctum')->user()->tenant_id;
        $user_id = auth()->guard('sanctum')->id();

        $purchase = Purchase::create([
            'tenant_id' => $tenant_id,
            'user_id' => $user_id,
            'reference' => $this->generateReference($tenant_id),
            'supplier_name' => $data['supplier_name'],
            'supplier_phone' => $data['supplier_phone'] ?? null,
            'supplier_email' => $data['supplier_email'] ?? null,
            'payment_method' => $data['payment_method'] ?? 'transfer',
            'expected_date' => $data['expected_date'] ?? null,
            'status' => 'draft',
        ]);

        AuditLog::log('create', 'purchase', $purchase->id, $data, 'Purchase created');

        return $purchase;
    }

    public function addItem(Purchase $purchase, int $product_id, int $quantity, float $unit_price = null): PurchaseItem
    {
        $product = Product::find($product_id);

        if (!$product) {
            throw new Exception("Product not found");
        }

        $unit_price = $unit_price ?? $product->purchase_price;

        $item = PurchaseItem::create([
            'tenant_id' => $purchase->tenant_id,
            'purchase_id' => $purchase->id,
            'product_id' => $product_id,
            'quantity_ordered' => $quantity,
            'unit_price' => $unit_price,
            'tax_percent' => $product->tax_percent,
            'unit' => $product->unit,
        ]);

        $item->calculateTotals();
        $item->save();

        $purchase->calculateTotals();
        $purchase->save();

        return $item;
    }

    public function confirmPurchase(Purchase $purchase): Purchase
    {
        $purchase->status = 'confirmed';
        $purchase->save();

        AuditLog::log('update', 'purchase', $purchase->id, ['status' => 'confirmed'], 'Purchase confirmed');

        return $purchase;
    }

    public function receivePurchase(Purchase $purchase, array $received_quantities): Purchase
    {
        foreach ($purchase->items as $item) {
            $quantity_received = $received_quantities[$item->id] ?? $item->quantity_ordered;

            $item->quantity_received = $quantity_received;
            $item->save();

            // Ajouter au stock
            $this->stockService->addStock(
                $item->product_id,
                $quantity_received,
                'main',
                $item->unit_price
            );
        }

        $purchase->receive();

        AuditLog::log('update', 'purchase', $purchase->id, 
            ['status' => 'received', 'quantities' => $received_quantities],
            'Purchase received'
        );

        return $purchase;
    }

    public function cancelPurchase(Purchase $purchase): Purchase
    {
        $purchase->status = 'cancelled';
        $purchase->save();

        AuditLog::log('update', 'purchase', $purchase->id, ['status' => 'cancelled'], 'Purchase cancelled');

        return $purchase;
    }

    public function getPurchasesReport(string $start_date, string $end_date): array
    {
        $purchases = Purchase::where('tenant_id', auth()->guard('sanctum')->user()->tenant_id)
            ->where('status', 'received')
            ->whereBetween('received_date', [$start_date, $end_date])
            ->get();

        $report = [];

        foreach ($purchases as $purchase) {
            if (!isset($report[$purchase->supplier_name])) {
                $report[$purchase->supplier_name] = [
                    'count' => 0,
                    'total' => 0,
                ];
            }

            $report[$purchase->supplier_name]['count']++;
            $report[$purchase->supplier_name]['total'] += $purchase->total;
        }

        return $report;
    }

    private function generateReference(int $tenant_id): string
    {
        $today = now()->format('Ymd');
        $count = Purchase::where('tenant_id', $tenant_id)
            ->whereDate('created_at', now()->toDateString())
            ->count();

        return "PUR-$today-" . str_pad($count + 1, 4, '0', STR_PAD_LEFT);
    }
}
