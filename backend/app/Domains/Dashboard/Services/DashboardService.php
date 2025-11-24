<?php

namespace App\Domains\Dashboard\Services;

use App\Models\Sale;
use App\Models\Purchase;
use App\Models\Stock;
use App\Models\AccountingEntry;
use App\Models\User;
use App\Models\Warehouse;
use Carbon\Carbon;
use Illuminate\Support\Collection;

class DashboardService
{
    private int $tenant_id;
    private string $currency = 'XOF';

    public function __construct(int $tenant_id = null)
    {
        $this->tenant_id = $tenant_id ?? auth()->guard('sanctum')->user()->tenant_id;
    }

    /**
     * Récupérer tous les KPIs du jour
     */
    public function getTodayKPIs(): array
    {
        $today = Carbon::today();

        return [
            'date' => $today->toDateString(),
            'currency' => $this->currency,
            'sales' => $this->getTodaySales($today),
            'purchases' => $this->getTodayPurchases($today),
            'cash_flow' => $this->getTodayCashFlow($today),
            'stock_alerts' => $this->getStockAlerts(),
            'critical_stocks' => $this->getCriticalStocks(),
            'pending_operations' => $this->getPendingOperations(),
            'user_sessions' => $this->getActiveSessions(),
        ];
    }

    /**
     * Ventes du jour
     */
    private function getTodaySales(Carbon $date): array
    {
        $sales = Sale::where('tenant_id', $this->tenant_id)
            ->where('status', 'completed')
            ->whereDate('completed_at', $date)
            ->get();

        $total_revenue = $sales->sum('total');
        $total_tax = $sales->sum('tax_amount');
        $total_items = $sales->sum(fn($s) => $s->items()->sum('quantity'));

        return [
            'count' => $sales->count(),
            'total_revenue' => round($total_revenue, 2),
            'total_tax' => round($total_tax, 2),
            'items_sold' => $total_items,
            'average_transaction' => $sales->count() > 0 ? round($total_revenue / $sales->count(), 2) : 0,
            'by_method' => $this->groupByPaymentMethod($sales),
            'by_warehouse' => $this->groupByWarehouse($sales),
        ];
    }

    /**
     * Achats du jour
     */
    private function getTodayPurchases(Carbon $date): array
    {
        $purchases = Purchase::where('tenant_id', $this->tenant_id)
            ->where('status', 'received')
            ->whereDate('received_date', $date)
            ->get();

        $total_cost = $purchases->sum('total');
        $item_count = $purchases->sum(fn($p) => $p->items()->sum('quantity_received'));

        return [
            'count' => $purchases->count(),
            'total_cost' => round($total_cost, 2),
            'items_received' => $item_count,
            'suppliers' => $purchases->count(),
        ];
    }

    /**
     * Flux de trésorerie du jour
     */
    private function getTodayCashFlow(Carbon $date): array
    {
        $sales_revenue = Sale::where('tenant_id', $this->tenant_id)
            ->where('status', 'completed')
            ->whereDate('completed_at', $date)
            ->whereIn('payment_method', ['cash', 'mobile_money'])
            ->sum('amount_paid');

        $purchase_expense = Purchase::where('tenant_id', $this->tenant_id)
            ->where('status', 'received')
            ->whereDate('received_date', $date)
            ->where('payment_method', 'cash')
            ->sum('amount_paid');

        $net_cash = $sales_revenue - $purchase_expense;

        return [
            'cash_in' => round($sales_revenue, 2),
            'cash_out' => round($purchase_expense, 2),
            'net_cash' => round($net_cash, 2),
            'balance_sign' => $net_cash >= 0 ? 'positive' : 'negative',
        ];
    }

    /**
     * Alertes de stock
     */
    private function getStockAlerts(): array
    {
        // Produits avec stock bas
        $low_stock = Stock::where('tenant_id', $this->tenant_id)
            ->whereRaw('quantity <= (quantity * 0.2)') // En dessous de 20%
            ->with('product', 'warehouse')
            ->get();

        return [
            'low_stock_count' => $low_stock->count(),
            'items' => $low_stock->map(fn($s) => [
                'product_id' => $s->product_id,
                'product_name' => $s->product->name,
                'warehouse' => $s->warehouse?->name ?? 'Gros',
                'quantity' => $s->quantity,
                'warning_level' => round($s->quantity / 2, 0),
            ])->toArray(),
        ];
    }

    /**
     * Stock critique
     */
    private function getCriticalStocks(): array
    {
        // Stock <= 0 ou très critique
        $critical = Stock::where('tenant_id', $this->tenant_id)
            ->where('quantity', '<=', 0)
            ->with('product', 'warehouse')
            ->get();

        return [
            'critical_count' => $critical->count(),
            'items' => $critical->map(fn($s) => [
                'product_id' => $s->product_id,
                'product_name' => $s->product->name,
                'warehouse' => $s->warehouse?->name ?? 'Gros',
                'quantity' => $s->quantity,
            ])->toArray(),
        ];
    }

    /**
     * Opérations en attente
     */
    private function getPendingOperations(): array
    {
        $pending_purchases = Purchase::where('tenant_id', $this->tenant_id)
            ->where('status', 'pending')
            ->count();

        $pending_sales = Sale::where('tenant_id', $this->tenant_id)
            ->where('status', 'draft')
            ->count();

        return [
            'pending_purchases' => $pending_purchases,
            'pending_sales' => $pending_sales,
            'total_pending' => $pending_purchases + $pending_sales,
        ];
    }

    /**
     * Sessions utilisateurs actives
     */
    private function getActiveSessions(): array
    {
        $users = User::where('tenant_id', $this->tenant_id)
            ->where('last_login_at', '>=', now()->subHours(8))
            ->count();

        return [
            'active_users' => $users,
            'total_users' => User::where('tenant_id', $this->tenant_id)->count(),
        ];
    }

    /**
     * Grouper par mode de paiement
     */
    private function groupByPaymentMethod($sales): array
    {
        return $sales->groupBy('payment_method')
            ->map(fn($group) => [
                'count' => $group->count(),
                'total' => round($group->sum('total'), 2),
            ])
            ->toArray();
    }

    /**
     * Grouper par entrepôt
     */
    private function groupByWarehouse($sales): array
    {
        // Join via warehouse_id from items or infer
        $grouped = [];
        foreach ($sales as $sale) {
            $warehouse = $sale->warehouse_id ?? 'default';
            if (!isset($grouped[$warehouse])) {
                $grouped[$warehouse] = [
                    'count' => 0,
                    'total' => 0,
                ];
            }
            $grouped[$warehouse]['count']++;
            $grouped[$warehouse]['total'] += $sale->total;
        }
        
        return $grouped;
    }

    /**
     * Rapport mensuel complet
     */
    public function getMonthlyReport(int $month, int $year): array
    {
        $start = Carbon::createFromDate($year, $month, 1)->startOfDay();
        $end = $start->clone()->endOfMonth()->endOfDay();

        $sales = Sale::where('tenant_id', $this->tenant_id)
            ->where('status', 'completed')
            ->whereBetween('completed_at', [$start, $end])
            ->get();

        $purchases = Purchase::where('tenant_id', $this->tenant_id)
            ->where('status', 'received')
            ->whereBetween('received_date', [$start, $end])
            ->get();

        $total_revenue = $sales->sum('total');
        $total_cost = $purchases->sum('total');
        $gross_profit = $total_revenue - $total_cost;
        $margin_percent = $total_revenue > 0 ? ($gross_profit / $total_revenue) * 100 : 0;

        return [
            'period' => "$year-" . str_pad($month, 2, '0', STR_PAD_LEFT),
            'sales' => [
                'count' => $sales->count(),
                'total_revenue' => round($total_revenue, 2),
                'average_transaction' => round($total_revenue / max(1, $sales->count()), 2),
            ],
            'purchases' => [
                'count' => $purchases->count(),
                'total_cost' => round($total_cost, 2),
            ],
            'profitability' => [
                'gross_profit' => round($gross_profit, 2),
                'margin_percent' => round($margin_percent, 2),
            ],
        ];
    }
}
