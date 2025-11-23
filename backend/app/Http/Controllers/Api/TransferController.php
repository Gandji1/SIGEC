<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Transfer;
use App\Models\TransferItem;
use App\Domains\Stocks\Services\StockService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class TransferController extends Controller
{
    protected StockService $stockService;

    public function __construct(StockService $stockService)
    {
        $this->stockService = $stockService;
    }

    public function index(Request $request): JsonResponse
    {
        $tenantId = $request->header('X-Tenant-ID');
        $transfers = Transfer::where('tenant_id', $tenantId)
            ->with(['user', 'items', 'items.product'])
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        return response()->json($transfers);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'from_warehouse' => 'required|string|max:255',
            'to_warehouse' => 'required|string|max:255|different:from_warehouse',
            'reference' => 'nullable|string|max:255',
            'notes' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity' => 'required|numeric|min:1',
        ]);

        if ($validated['from_warehouse'] === $validated['to_warehouse']) {
            return response()->json(
                ['error' => 'Source and destination warehouses must be different'],
                422
            );
        }

        try {
            DB::beginTransaction();

            $transfer = Transfer::create([
                'tenant_id' => $request->header('X-Tenant-ID'),
                'user_id' => auth()->id(),
                'from_warehouse' => $validated['from_warehouse'],
                'to_warehouse' => $validated['to_warehouse'],
                'reference' => $validated['reference'] ?? 'TRF-' . time(),
                'notes' => $validated['notes'] ?? '',
                'status' => 'pending',
            ]);

            foreach ($validated['items'] as $item) {
                TransferItem::create([
                    'transfer_id' => $transfer->id,
                    'product_id' => $item['product_id'],
                    'quantity' => $item['quantity'],
                    'unit_cost' => 0,
                ]);
            }

            DB::commit();

            return response()->json(
                $transfer->load(['items', 'items.product']),
                201
            );
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => $e->getMessage()], 400);
        }
    }

    public function show(Request $request, Transfer $transfer): JsonResponse
    {
        $this->authorize('view', $transfer);

        return response()->json(
            $transfer->load(['items', 'items.product', 'user'])
        );
    }

    public function update(Request $request, Transfer $transfer): JsonResponse
    {
        $this->authorize('update', $transfer);

        if ($transfer->status !== 'pending') {
            return response()->json(
                ['error' => 'Cannot update transfer in ' . $transfer->status . ' status'],
                422
            );
        }

        $validated = $request->validate([
            'from_warehouse' => 'sometimes|string|max:255',
            'to_warehouse' => 'sometimes|string|max:255',
            'notes' => 'sometimes|string',
        ]);

        $transfer->update($validated);

        return response()->json($transfer);
    }

    public function destroy(Request $request, Transfer $transfer): JsonResponse
    {
        $this->authorize('delete', $transfer);

        if ($transfer->status !== 'pending') {
            return response()->json(
                ['error' => 'Cannot delete transfer in ' . $transfer->status . ' status'],
                422
            );
        }

        $transfer->delete();

        return response()->json(['message' => 'Transfer deleted'], 200);
    }

    public function confirm(Request $request, Transfer $transfer): JsonResponse
    {
        $this->authorize('update', $transfer);

        if ($transfer->status !== 'pending') {
            return response()->json(
                ['error' => 'Can only confirm pending transfers'],
                422
            );
        }

        try {
            DB::beginTransaction();

            foreach ($transfer->items as $item) {
                // Remove from source warehouse
                $this->stockService->removeStock(
                    $request->header('X-Tenant-ID'),
                    $item->product_id,
                    $item->quantity,
                    $transfer->from_warehouse,
                    'transfer_out',
                    $transfer->reference
                );

                // Add to destination warehouse
                $this->stockService->addStock(
                    $request->header('X-Tenant-ID'),
                    $item->product_id,
                    $item->quantity,
                    $item->unit_cost,
                    $transfer->to_warehouse,
                    'transfer_in',
                    $transfer->reference
                );
            }

            $transfer->update(['status' => 'completed']);

            DB::commit();

            return response()->json(
                $transfer->fresh()->load(['items', 'items.product']),
                200
            );
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => $e->getMessage()], 400);
        }
    }

    public function cancel(Request $request, Transfer $transfer): JsonResponse
    {
        $this->authorize('update', $transfer);

        if (!in_array($transfer->status, ['pending', 'completed'])) {
            return response()->json(
                ['error' => 'Cannot cancel transfer in ' . $transfer->status . ' status'],
                422
            );
        }

        $transfer->update(['status' => 'cancelled']);

        return response()->json(
            $transfer->fresh()->load(['items', 'items.product']),
            200
        );
    }
}
