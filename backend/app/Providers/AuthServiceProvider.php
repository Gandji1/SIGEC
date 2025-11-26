<?php

namespace App\Providers;

// use Illuminate\Support\Facades\Gate;
use App\Models\Expense;
use App\Policies\ExpensePolicy;
use App\Policies\PurchasePolicy;
use App\Policies\SalePolicy;
use App\Models\Purchase;
use App\Models\Sale;
use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;

class AuthServiceProvider extends ServiceProvider
{
    /**
     * The model to policy mappings for the application.
     *
     * @var array<class-string, class-string>
     */
    protected $policies = [
        Expense::class => ExpensePolicy::class,
        Purchase::class => PurchasePolicy::class,
        Sale::class => SalePolicy::class,
    ];

    /**
     * Register any authentication / authorization services.
     */
    public function boot(): void
    {
        //
    }
}
