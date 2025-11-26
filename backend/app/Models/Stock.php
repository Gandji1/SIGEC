<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Stock extends Model
{
    use HasFactory, SoftDeletes;
    protected $fillable = [
        'tenant_id',
        'product_id',
        'warehouse_id',
        'warehouse', // Legacy
        'quantity',
        'reserved',
        'available',
        'cost_average', // CMP - Coût Moyen Pondéré
        'unit_cost',
        'last_counted_at',
        'location',
        'metadata',
    ];

    protected $casts = [
        'unit_cost' => 'decimal:2',
        'cost_average' => 'decimal:2',
        'last_counted_at' => 'datetime',
        'metadata' => 'array',
    ];

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function warehouse(): BelongsTo
    {
        return $this->belongsTo(Warehouse::class);
    }

    public function movements(): HasMany
    {
        return $this->hasMany(StockMovement::class, 'product_id', 'product_id');
    }

    public function updateAvailableQuantity(): void
    {
        $this->available = $this->quantity - $this->reserved;
        $this->save();
    }

    public function reserve(int $quantity): bool
    {
        if ($this->available >= $quantity) {
            $this->reserved += $quantity;
            $this->updateAvailableQuantity();
            return true;
        }
        return false;
    }

    public function release(int $quantity): void
    {
        $this->reserved = max(0, $this->reserved - $quantity);
        $this->updateAvailableQuantity();
    }
}
