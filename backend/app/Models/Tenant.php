<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Tenant extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'name',
        'slug',
        'domain',
        'logo',
        'currency',
        'country',
        'phone',
        'email',
        'address',
        'tax_id',
        'registration_number',
        'business_type',
        'accounting_setup_complete',
        'settings',
        'status',
        'subscription_expires_at',
        'mode_pos',
        'accounting_enabled',
    ];

    protected $casts = [
        'settings' => 'array',
        'subscription_expires_at' => 'datetime',
    ];

    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    public function warehouses(): HasMany
    {
        return $this->hasMany(Warehouse::class);
    }

    public function products(): HasMany
    {
        return $this->hasMany(Product::class);
    }

    public function sales(): HasMany
    {
        return $this->hasMany(Sale::class);
    }

    public function purchases(): HasMany
    {
        return $this->hasMany(Purchase::class);
    }

    public function transfers(): HasMany
    {
        return $this->hasMany(Transfer::class);
    }

    public function auditLogs(): HasMany
    {
        return $this->hasMany(AuditLog::class);
    }

    public function chartOfAccounts(): HasMany
    {
        return $this->hasMany(ChartOfAccount::class);
    }

    public function isActive(): bool
    {
        return $this->status === 'active' && 
               (!$this->subscription_expires_at || $this->subscription_expires_at->isFuture());
    }
}
