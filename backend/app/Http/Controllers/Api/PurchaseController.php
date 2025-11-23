<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Purchase;
use App\Models\PurchaseItem;
use App\Domains\Purchases\Services\PurchaseService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PurchaseController extends Controller
{
    protected PurchaseService $purchaseService;

    public function __construct(PurchaseService $purchaseService)
    {
        $this->purchaseService = $purchaseService;
    }

    public function index(Request $request): JsonResponse
    {
        $tenantId = $request->header('X-Tenant-ID');
        $purchases = Purchase::where('tenant_id', $tenantId)
            ->with(['user', 'items', 'items.product'])
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        return response()->json($purchases);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'supplier_name' => 'required|string|max:255',
            'supplier_email' => 'nullable|email',
            'supplier_phone' => 'nullable|string',
            'expected_date' => 'nullable|date',
            'notes' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity' => 'required|numeric|min:1',
            'items.*.unit_price' => 'required|numeric|min:0.01',
        ]);

        try {
            DB::beginTransaction();

            $purchase = $this->purchaseService->createPurchase($validated);

            foreach ($validated['items'] as $item) {
                $this->purchaseService->addItem(
                    $purchase->id,
                    $item['product_id'],
                    $item['quantity'],
                    $item['unit_price']
                );
            }

            DB::commit();

            return response()->json(
                $purchase->fresh()->load(['items', 'items.product']),
                201
            );
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => $e->getMessage()], 400);
        }
    }

    public function show(Request $request, Purchase $purchase): JsonResponse
    {
        $this->authorize('view', $purchase);

        return response()->json(
            $purchase->load(['items', 'items.product', 'user'])
        );
    }

    public function update(Request $request, Purchase $purchase): JsonResponse
    {
        $this->authorize('update', $purchase);

        if (!in_array($purchase->status, ['pending', 'confirmed'])) {
            return response()->json(
                ['error' => 'Cannot update purchase in ' . $purchase->status . ' status'],
                422
            );
        }

        $validated = $request->validate([
            'supplier_name' => 'sometimes|string|max:255',
            'supplier_email' => 'sometimes|email',
            'supplier_phone' => 'sometimes|string',
            'expected_delivery' => 'sometimes|date',
            'notes' => 'sometimes|string',
        ]);

        $purchase->update($validated);

        return response()->json($purchase);
    }

    public function destroy(Request $request, Purchase $purchase): JsonResponse
    {
        $this->authorize('delete', $purchase);

        if ($purchase->status !== 'pending') {
            return response()->json(
                ['error' => 'Cannot delete purchase in ' . $purchase->status . ' status'],
                422
            );
        }

        $purchase->delete();

        return response()->json(['message' => 'Purchase deleted'], 200);
    }

    public function addItem(Request $request, Purchase $purchase): JsonResponse
    {
        $this->authorize('update', $purchase);

        if ($purchase->status !== 'pending') {
            return response()->json(
                ['error' => 'Cannot add items to purchase in ' . $purchase->status . ' status'],
                422
            );
        }

        $validated = $request->validate([
            'product_id' => 'required|exists:products,id',
            'quantity' => 'required|numeric|min:1',
            'unit_price' => 'required|numeric|min:0.01',
        ]);

        try {
            $item = $this->purchaseService->addItem(
                $purchase->id,
                $validated['product_id'],
                $validated['quantity'],
                $validated['unit_price']
            );

            return response()->json($item->load('product'), 201);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 400);
        }
    }

    public function removeItem(Request $request, Purchase $purchase, PurchaseItem $item): JsonResponse
    {
        $this->authorize('update', $purchase);

        if ($purchase->status !== 'pending') {
            return response()->json(
                ['error' => 'Cannot remove items from purchase in ' . $purchase->status . ' status'],
                422
            );
        }

        $item->delete();

        return response()->json(['message' => 'Item removed'], 200);
    }

    public function confirm(Request $request, Purchase $purchase): JsonResponse
    {
        $this->authorize('update', $purchase);

        if ($purchase->status !== 'pending') {
            return response()->json(
                ['error' => 'Can only confirm pending purchases'],
                422
            );
        }

        $this->purchaseService->confirmPurchase($purchase->id);

        return response()->json(
            $purchase->fresh()->load(['items', 'items.product']),
            200
        );
    }

    public function receive(Request $request, Purchase $purchase): JsonResponse
    {
        $this->authorize('update', $purchase);

        if ($purchase->status !== 'confirmed') {
            return response()->json(
                ['error' => 'Can only receive confirmed purchases'],
                422
            );
        }

        $validated = $request->validate([
            'items' => 'required|array',
            'items.*.purchase_item_id' => 'required|exists:purchase_items,id',
            'items.*.received_quantity' => 'required|numeric|min:1',
        ]);

        try {
            DB::beginTransaction();

            foreach ($validated['items'] as $itemData) {
                $purchaseItem = PurchaseItem::findOrFail($itemData['purchase_item_id']);
                
                if ($itemData['received_quantity'] > $purchaseItem->quantity_ordered) {
                    throw new \Exception('Received quantity exceeds ordered quantity');
                }

                $this->purchaseService->receiveItem(
                    $purchase->id,
                    $purchaseItem->id,
                    $itemData['received_quantity']
                );
            }

            $this->purchaseService->receivePurchase($purchase->id);

            DB::commit();

            return response()->json(
                $purchase->fresh()->load(['items', 'items.product']),
                200
            );
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => $e->getMessage()], 400);
        }
    }

    public function cancel(Request $request, Purchase $purchase): JsonResponse
    {
        $this->authorize('update', $purchase);

        try {
            $this->purchaseService->cancelPurchase($purchase->id);
            return response()->json(
                $purchase->fresh()->load(['items', 'items.product']),
                200
            );
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 422);
        }
    }

    public function report(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'start_date' => 'required|date',
            'end_date' => 'required|date',
        ]);

        $report = $this->purchaseService->getPurchasesReport(
            $validated['start_date'],
            $validated['end_date']
        );

        return response()->json($report);
    }
}
