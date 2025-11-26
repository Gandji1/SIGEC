<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Purchase extends Model
{
    use HasFactory, SoftDeletes;
    use SoftDeletes;

    protected $fillable = [
        'tenant_id',
        'user_id',
        'warehouse_id',
        'supplier_id',
        'reference',
        'supplier_name',
        'supplier_phone',
        'supplier_email',
        'subtotal',
        'tax_amount',
        'shipping_cost',
        'total',
        'amount_paid',
        'payment_method',
        'status',
        'expected_date',
        'received_date',
        'notes',
        'metadata',
    ];

    protected $casts = [
        'subtotal' => 'decimal:2',
        'tax_amount' => 'decimal:2',
        'shipping_cost' => 'decimal:2',
        'total' => 'decimal:2',
        'amount_paid' => 'decimal:2',
        'expected_date' => 'date',
        'received_date' => 'date',
        'metadata' => 'array',
    ];

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function warehouse(): BelongsTo
    {
        return $this->belongsTo(Warehouse::class)->nullable();
    }

    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class)->nullable();
    }

    public function items(): HasMany
    {
        return $this->hasMany(PurchaseItem::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(SupplierPayment::class);
    }

    public function receive(): void
    {
        $this->status = 'received';
        $this->received_date = now();
        $this->save();

        // Update supplier totals if linked
        if ($this->supplier_id) {
            $this->supplier->updateTotals();
        }
    }

    public function calculateTotals(): void
    {
        $this->subtotal = $this->items()->sum('line_subtotal');
        $this->tax_amount = $this->items()->sum('tax_amount');
        $this->total = $this->subtotal + $this->tax_amount + $this->shipping_cost;
    }
}
