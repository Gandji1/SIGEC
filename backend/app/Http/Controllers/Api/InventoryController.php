<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Inventory;
use App\Models\InventoryItem;
use App\Domains\Stocks\Services\InventoryService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;

class InventoryController extends Controller
{
    use AuthorizesRequests;

    private InventoryService $inventoryService;

    public function __construct(InventoryService $inventoryService)
    {
        $this->inventoryService = $inventoryService;
        $this->middleware('auth:sanctum');
    }

    /**
     * Créer un nouvel inventaire
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'warehouse_id' => 'required|integer|exists:warehouses,id',
        ]);

        try {
            $inventory = $this->inventoryService->createInventory(
                $validated['warehouse_id']
            );

            return response()->json([
                'success' => true,
                'message' => 'Inventaire créé avec succès',
                'data' => $inventory,
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Obtenir les détails d'un inventaire
     */
    public function show(Inventory $inventory): JsonResponse
    {
        try {
            $this->authorize('view', $inventory);

            return response()->json([
                'success' => true,
                'data' => $inventory->load('items', 'warehouse', 'user'),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 403);
        }
    }

    /**
     * Démarrer un inventaire
     */
    public function start(Inventory $inventory): JsonResponse
    {
        try {
            $this->authorize('update', $inventory);

            if ($inventory->status !== 'draft') {
                return response()->json([
                    'success' => false,
                    'message' => 'Seul les inventaires en brouillon peuvent être démarrés',
                ], 422);
            }

            $inventory = $this->inventoryService->startInventory($inventory);

            return response()->json([
                'success' => true,
                'message' => 'Inventaire démarré',
                'data' => $inventory,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Ajouter un article à l'inventaire
     */
    public function addItem(Request $request, Inventory $inventory): JsonResponse
    {
        try {
            $this->authorize('update', $inventory);

            $validated = $request->validate([
                'product_id' => 'required|integer|exists:products,id',
                'counted_qty' => 'required|integer|min:0',
                'notes' => 'nullable|string',
            ]);

            if ($inventory->status === 'draft') {
                $inventory = $this->inventoryService->startInventory($inventory);
            }

            $item = $this->inventoryService->addItem(
                $inventory,
                $validated['product_id'],
                $validated['counted_qty']
            );

            if (isset($validated['notes'])) {
                $item->notes = $validated['notes'];
                $item->save();
            }

            return response()->json([
                'success' => true,
                'message' => 'Article ajouté',
                'data' => $item->load('product'),
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Finaliser l'inventaire (créer les ajustements)
     */
    public function complete(Inventory $inventory): JsonResponse
    {
        try {
            $this->authorize('update', $inventory);

            if ($inventory->status !== 'in_progress') {
                return response()->json([
                    'success' => false,
                    'message' => 'Seul les inventaires en cours peuvent être finalisés',
                ], 422);
            }

            $inventory = $this->inventoryService->completeInventory($inventory);

            return response()->json([
                'success' => true,
                'message' => 'Inventaire finalisé',
                'data' => $inventory->load('items'),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Valider l'inventaire (avant transmission au comptable)
     */
    public function validate(Inventory $inventory): JsonResponse
    {
        try {
            $this->authorize('update', $inventory);

            if ($inventory->status !== 'completed') {
                return response()->json([
                    'success' => false,
                    'message' => 'Seul les inventaires complétés peuvent être validés',
                ], 422);
            }

            $inventory = $this->inventoryService->validateInventory($inventory);

            return response()->json([
                'success' => true,
                'message' => 'Inventaire validé',
                'data' => $inventory,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Obtenir le résumé d'un inventaire avec écarts
     */
    public function summary(Inventory $inventory): JsonResponse
    {
        try {
            $this->authorize('view', $inventory);

            $summary = $this->inventoryService->getInventorySummary($inventory);

            return response()->json([
                'success' => true,
                'data' => $summary,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Importer des items d'inventaire depuis CSV
     * Format: SKU,Quantité Comptée
     */
    public function importCSV(Request $request, Inventory $inventory): JsonResponse
    {
        try {
            $this->authorize('update', $inventory);

            $validated = $request->validate([
                'csv' => 'required|string',
            ]);

            $results = $this->inventoryService->importFromCSV(
                $inventory,
                $validated['csv']
            );

            return response()->json([
                'success' => true,
                'message' => "{$results['added']} articles importés",
                'data' => [
                    'added' => $results['added'],
                    'errors' => $results['errors'],
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Exporter l'inventaire en CSV
     */
    public function exportCSV(Inventory $inventory)
    {
        try {
            $this->authorize('view', $inventory);

            $csv = $this->inventoryService->exportAsCSV($inventory);

            return response($csv, 200)
                ->header('Content-Type', 'text/csv; charset=UTF-8')
                ->header('Content-Disposition', "attachment; filename=inventory_{$inventory->reference}.csv");
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Lister les inventaires (avec filtres)
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $tenantId = auth()->guard('sanctum')->user()->tenant_id;

            $query = Inventory::where('tenant_id', $tenantId);

            // Filtres
            if ($request->has('warehouse_id')) {
                $query->where('warehouse_id', $request->warehouse_id);
            }

            if ($request->has('status')) {
                $query->where('status', $request->status);
            }

            if ($request->has('from_date')) {
                $query->whereDate('created_at', '>=', $request->from_date);
            }

            if ($request->has('to_date')) {
                $query->whereDate('created_at', '<=', $request->to_date);
            }

            $inventories = $query->with('warehouse', 'user')
                ->latest()
                ->paginate(20);

            return response()->json([
                'success' => true,
                'data' => $inventories,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Supprimer un inventaire (si brouillon)
     */
    public function destroy(Inventory $inventory): JsonResponse
    {
        try {
            $this->authorize('delete', $inventory);

            if ($inventory->status !== 'draft') {
                return response()->json([
                    'success' => false,
                    'message' => 'Seul les brouillons peuvent être supprimés',
                ], 422);
            }

            $inventory->delete();

            return response()->json([
                'success' => true,
                'message' => 'Inventaire supprimé',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }
}
