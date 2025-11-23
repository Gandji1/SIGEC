<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Domains\Sales\Services\SaleService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Database\Eloquent\Collection;

class SaleController extends Controller
{
    private SaleService $saleService;

    public function __construct()
    {
        $this->saleService = new SaleService();
        $this->middleware('auth:sanctum');
    }

    public function index(): JsonResponse
    {
        $tenant_id = auth()->guard('sanctum')->user()->tenant_id;

        $sales = Sale::where('tenant_id', $tenant_id)
            ->with('items.product', 'user')
            ->orderBy('created_at', 'desc')
            ->paginate(15);

        return response()->json($sales);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'customer_name' => 'nullable|string',
            'customer_phone' => 'nullable|string',
            'customer_email' => 'nullable|email',
            'mode' => 'required|in:manual,facturette',
            'payment_method' => 'required|string',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|integer|exists:products,id',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.unit_price' => 'nullable|numeric',
        ]);

        $sale = $this->saleService->createSale($validated);

        foreach ($validated['items'] as $item) {
            $this->saleService->addItem(
                $sale,
                $item['product_id'],
                $item['quantity'],
                $item['unit_price'] ?? null
            );
        }

        return response()->json($sale->load('items.product'), 201);
    }

    public function show(Sale $sale): JsonResponse
    {
        if ($sale->tenant_id !== auth()->guard('sanctum')->user()->tenant_id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        return response()->json($sale->load('items.product', 'user'));
    }

    public function complete(Request $request, Sale $sale): JsonResponse
    {
        if ($sale->tenant_id !== auth()->guard('sanctum')->user()->tenant_id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'amount_paid' => 'required|numeric|min:0',
            'payment_method' => 'required|string',
        ]);

        $completedSale = $this->saleService->completeSale($sale, $validated['amount_paid'], $validated['payment_method']);

        return response()->json($completedSale);
    }

    public function cancel(Sale $sale): JsonResponse
    {
        if ($sale->tenant_id !== auth()->guard('sanctum')->user()->tenant_id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $cancelledSale = $this->saleService->cancelSale($sale);

        return response()->json($cancelledSale);
    }

    public function report(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'start_date' => 'required|date',
            'end_date' => 'required|date|after:start_date',
            'group_by' => 'nullable|in:daily,weekly,monthly',
        ]);

        $report = $this->saleService->getSalesReport(
            $validated['start_date'],
            $validated['end_date'],
            $validated['group_by'] ?? 'daily'
        );

        return response()->json($report);
    }
}
