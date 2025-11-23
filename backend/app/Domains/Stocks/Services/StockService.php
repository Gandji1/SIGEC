<?php

namespace App\Domains\Stocks\Services;

use App\Models\Stock;
use App\Models\Product;
use App\Models\AuditLog;
use Illuminate\Database\Eloquent\Collection;
use Exception;

class StockService
{
    public function addStock(int $product_id, int $quantity, string $warehouse = 'main', float $unit_cost = 0): Stock
    {
        $stock = Stock::updateOrCreate(
            [
                'tenant_id' => auth()->guard('sanctum')->user()->tenant_id,
                'product_id' => $product_id,
                'warehouse' => $warehouse,
            ],
            [
                'quantity' => Stock::where('product_id', $product_id)
                    ->where('warehouse', $warehouse)
                    ->value('quantity') + $quantity,
                'unit_cost' => $unit_cost ?: Stock::where('product_id', $product_id)
                    ->value('unit_cost'),
            ]
        );

        $stock->updateAvailableQuantity();
        AuditLog::log('create', 'stock', $stock->id, ['quantity' => $quantity], "Added $quantity units to stock");

        return $stock;
    }

    public function removeStock(int $product_id, int $quantity, string $warehouse = 'main'): bool
    {
        $stock = Stock::where('tenant_id', auth()->guard('sanctum')->user()->tenant_id)
            ->where('product_id', $product_id)
            ->where('warehouse', $warehouse)
            ->first();

        if (!$stock || $stock->available < $quantity) {
            throw new Exception("Insufficient stock for product $product_id");
        }

        $stock->quantity -= $quantity;
        $stock->updateAvailableQuantity();
        AuditLog::log('delete', 'stock', $stock->id, ['quantity' => -$quantity], "Removed $quantity units from stock");

        return true;
    }

    public function reserveStock(int $product_id, int $quantity, string $warehouse = 'main'): bool
    {
        $stock = Stock::where('tenant_id', auth()->guard('sanctum')->user()->tenant_id)
            ->where('product_id', $product_id)
            ->where('warehouse', $warehouse)
            ->first();

        if (!$stock) {
            throw new Exception("Stock not found for product $product_id");
        }

        return $stock->reserve($quantity);
    }

    public function releaseStock(int $product_id, int $quantity, string $warehouse = 'main'): void
    {
        $stock = Stock::where('tenant_id', auth()->guard('sanctum')->user()->tenant_id)
            ->where('product_id', $product_id)
            ->where('warehouse', $warehouse)
            ->first();

        if ($stock) {
            $stock->release($quantity);
        }
    }

    public function getLowStockProducts(): Collection
    {
        return Product::where('tenant_id', auth()->guard('sanctum')->user()->tenant_id)
            ->where('track_stock', true)
            ->get()
            ->filter(fn ($p) => $p->isLowStock());
    }

    public function transferStock(int $product_id, int $quantity, string $from_warehouse, string $to_warehouse): bool
    {
        if (!$this->removeStock($product_id, $quantity, $from_warehouse)) {
            return false;
        }

        $this->addStock($product_id, $quantity, $to_warehouse);
        AuditLog::log('update', 'stock_transfer', $product_id, 
            ['from' => $from_warehouse, 'to' => $to_warehouse, 'quantity' => $quantity],
            "Transferred $quantity units from $from_warehouse to $to_warehouse"
        );

        return true;
    }

    public function getStockValue(): float
    {
        return Stock::where('tenant_id', auth()->guard('sanctum')->user()->tenant_id)
            ->sum('quantity' * 'unit_cost');
    }

    public function adjustStock(int $product_id, int $new_quantity, string $warehouse = 'main', string $reason = ''): Stock
    {
        $stock = Stock::where('tenant_id', auth()->guard('sanctum')->user()->tenant_id)
            ->where('product_id', $product_id)
            ->where('warehouse', $warehouse)
            ->first();

        if (!$stock) {
            throw new Exception("Stock not found");
        }

        $difference = $new_quantity - $stock->quantity;
        $stock->quantity = $new_quantity;
        $stock->last_counted_at = now();
        $stock->save();
        $stock->updateAvailableQuantity();

        AuditLog::log('update', 'stock', $stock->id, 
            ['old_quantity' => $stock->quantity - $difference, 'new_quantity' => $new_quantity],
            "Adjusted stock by $difference units. Reason: $reason"
        );

        return $stock;
    }
}
