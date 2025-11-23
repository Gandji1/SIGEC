<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Stock;
use App\Domains\Stocks\Services\StockService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StockController extends Controller
{
    protected StockService $stockService;

    public function __construct(StockService $stockService)
    {
        $this->stockService = $stockService;
    }

    public function index(Request $request): JsonResponse
    {
        $tenantId = $request->header('X-Tenant-ID');
        
        $query = Stock::where('tenant_id', $tenantId)
            ->with(['product', 'product.tenant']);

        if ($request->has('warehouse')) {
            $query->where('warehouse', $request->query('warehouse'));
        }

        if ($request->has('low_stock')) {
            $query->whereRaw('available <= (SELECT min_stock FROM products WHERE products.id = stocks.product_id)');
        }

        $stocks = $query->orderBy('created_at', 'desc')->paginate(20);

        return response()->json($stocks);
    }

    public function show(Request $request, Stock $stock): JsonResponse
    {
        $this->authorize('view', $stock);

        return response()->json($stock->load('product'));
    }

    public function adjust(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'product_id' => 'required|exists:products,id',
            'warehouse' => 'required|string|max:255',
            'quantity_change' => 'required|integer',
            'reason' => 'required|string|in:inventory_count,damage,loss,correction,return,other',
            'notes' => 'nullable|string',
        ]);

        try {
            if ($validated['quantity_change'] > 0) {
                $this->stockService->addStock(
                    $request->header('X-Tenant-ID'),
                    $validated['product_id'],
                    $validated['quantity_change'],
                    0,
                    $validated['warehouse'],
                    'adjustment_' . $validated['reason'],
                    $validated['notes'] ?? ''
                );
            } else {
                $this->stockService->removeStock(
                    $request->header('X-Tenant-ID'),
                    $validated['product_id'],
                    abs($validated['quantity_change']),
                    $validated['warehouse'],
                    'adjustment_' . $validated['reason'],
                    $validated['notes'] ?? ''
                );
            }

            $stock = Stock::where('tenant_id', $request->header('X-Tenant-ID'))
                ->where('product_id', $validated['product_id'])
                ->where('warehouse', $validated['warehouse'])
                ->first();

            return response()->json(
                $stock->load('product'),
                200
            );
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 400);
        }
    }

    public function reserve(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'product_id' => 'required|exists:products,id',
            'warehouse' => 'required|string|max:255',
            'quantity' => 'required|numeric|min:1',
            'reference' => 'required|string|max:255',
        ]);

        try {
            $this->stockService->reserveStock(
                $request->header('X-Tenant-ID'),
                $validated['product_id'],
                $validated['quantity'],
                $validated['warehouse'],
                $validated['reference']
            );

            $stock = Stock::where('tenant_id', $request->header('X-Tenant-ID'))
                ->where('product_id', $validated['product_id'])
                ->where('warehouse', $validated['warehouse'])
                ->first();

            return response()->json($stock->load('product'), 200);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 400);
        }
    }

    public function release(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'product_id' => 'required|exists:products,id',
            'warehouse' => 'required|string|max:255',
            'quantity' => 'required|numeric|min:1',
            'reference' => 'required|string|max:255',
        ]);

        try {
            $this->stockService->releaseStock(
                $request->header('X-Tenant-ID'),
                $validated['product_id'],
                $validated['quantity'],
                $validated['warehouse'],
                $validated['reference']
            );

            $stock = Stock::where('tenant_id', $request->header('X-Tenant-ID'))
                ->where('product_id', $validated['product_id'])
                ->where('warehouse', $validated['warehouse'])
                ->first();

            return response()->json($stock->load('product'), 200);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 400);
        }
    }

    public function transfer(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'product_id' => 'required|exists:products,id',
            'from_warehouse' => 'required|string|max:255',
            'to_warehouse' => 'required|string|max:255|different:from_warehouse',
            'quantity' => 'required|numeric|min:1',
        ]);

        try {
            $this->stockService->transferStock(
                $request->header('X-Tenant-ID'),
                $validated['product_id'],
                $validated['quantity'],
                $validated['from_warehouse'],
                $validated['to_warehouse']
            );

            $stock = Stock::where('tenant_id', $request->header('X-Tenant-ID'))
                ->where('product_id', $validated['product_id'])
                ->where('warehouse', $validated['to_warehouse'])
                ->first();

            return response()->json($stock->load('product'), 200);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 400);
        }
    }

    public function lowStock(Request $request): JsonResponse
    {
        $tenantId = $request->header('X-Tenant-ID');
        
        $lowStockProducts = Stock::where('tenant_id', $tenantId)
            ->whereRaw('available <= (SELECT min_stock FROM products WHERE products.id = stocks.product_id)')
            ->with('product')
            ->get();

        return response()->json([
            'count' => $lowStockProducts->count(),
            'products' => $lowStockProducts
        ]);
    }

    public function summary(Request $request): JsonResponse
    {
        $tenantId = $request->header('X-Tenant-ID');
        
        $summary = [
            'total_items' => Stock::where('tenant_id', $tenantId)->count(),
            'total_quantity' => Stock::where('tenant_id', $tenantId)->sum('quantity'),
            'total_available' => Stock::where('tenant_id', $tenantId)->sum('available'),
            'total_reserved' => Stock::where('tenant_id', $tenantId)->sum('reserved'),
            'total_value' => Stock::where('tenant_id', $tenantId)
                ->selectRaw('SUM(available * unit_cost) as value')
                ->value('value') ?? 0,
            'low_stock_count' => Stock::where('tenant_id', $tenantId)
                ->whereRaw('available <= (SELECT min_stock FROM products WHERE products.id = stocks.product_id)')
                ->count(),
        ];

        return response()->json($summary);
    }
}
