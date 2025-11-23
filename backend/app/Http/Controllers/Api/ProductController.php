<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\AuditLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:sanctum');
    }

    public function index(Request $request): JsonResponse
    {
        $tenant_id = auth()->guard('sanctum')->user()->tenant_id;

        $query = Product::where('tenant_id', $tenant_id);

        if ($request->has('category')) {
            $query->where('category', $request->category);
        }

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%$search%")
                  ->orWhere('code', 'like', "%$search%")
                  ->orWhere('barcode', 'like', "%$search%");
            });
        }

        $products = $query->with('stocks')->paginate(20);

        return response()->json($products);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'code' => 'required|unique:products|string',
            'name' => 'required|string',
            'description' => 'nullable|string',
            'category' => 'nullable|string',
            'purchase_price' => 'required|numeric|min:0',
            'selling_price' => 'required|numeric|min:0',
            'unit' => 'required|string',
            'min_stock' => 'nullable|integer|min:0',
            'max_stock' => 'nullable|integer|min:0',
            'barcode' => 'nullable|unique:products|string',
            'tax_percent' => 'nullable|numeric|min:0',
            'track_stock' => 'nullable|boolean',
        ]);

        $product = Product::create([
            'tenant_id' => auth()->guard('sanctum')->user()->tenant_id,
            ...$validated,
            'status' => 'active',
        ]);

        $product->calculateMargin();
        $product->save();

        AuditLog::log('create', 'product', $product->id, $validated, 'Product created');

        return response()->json($product, 201);
    }

    public function show(Product $product): JsonResponse
    {
        if ($product->tenant_id !== auth()->guard('sanctum')->user()->tenant_id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        return response()->json($product->load('stocks'));
    }

    public function update(Request $request, Product $product): JsonResponse
    {
        if ($product->tenant_id !== auth()->guard('sanctum')->user()->tenant_id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'name' => 'nullable|string',
            'description' => 'nullable|string',
            'category' => 'nullable|string',
            'purchase_price' => 'nullable|numeric|min:0',
            'selling_price' => 'nullable|numeric|min:0',
            'unit' => 'nullable|string',
            'min_stock' => 'nullable|integer|min:0',
            'max_stock' => 'nullable|integer|min:0',
            'tax_percent' => 'nullable|numeric|min:0',
            'status' => 'nullable|in:active,inactive,discontinued',
        ]);

        $product->update($validated);

        if (isset($validated['purchase_price']) || isset($validated['selling_price'])) {
            $product->calculateMargin();
            $product->save();
        }

        AuditLog::log('update', 'product', $product->id, $validated, 'Product updated');

        return response()->json($product);
    }

    public function destroy(Product $product): JsonResponse
    {
        if ($product->tenant_id !== auth()->guard('sanctum')->user()->tenant_id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $product->delete();
        AuditLog::log('delete', 'product', $product->id, [], 'Product deleted');

        return response()->json(null, 204);
    }

    public function lowStock(): JsonResponse
    {
        $tenant_id = auth()->guard('sanctum')->user()->tenant_id;

        $products = Product::where('tenant_id', $tenant_id)
            ->where('track_stock', true)
            ->whereHas('stocks', function ($q) {
                $q->whereRaw('available <= min_stock');
            })
            ->with('stocks')
            ->get();

        return response()->json($products);
    }

    public function byBarcode(string $barcode): JsonResponse
    {
        $tenant_id = auth()->guard('sanctum')->user()->tenant_id;

        $product = Product::where('tenant_id', $tenant_id)
            ->where('barcode', $barcode)
            ->first();

        if (!$product) {
            return response()->json(['message' => 'Product not found'], 404);
        }

        return response()->json($product->load('stocks'));
    }
}
