<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Tenant;
use App\Models\Sale;
use App\Domains\Payments\Services\FedapayAdapter;
use App\Domains\Payments\Services\KakiapayAdapter;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class PaymentController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:sanctum');
    }

    /**
     * Initialize payment
     * POST /api/payments/initialize
     */
    public function initialize(Request $request): JsonResponse
    {
        $request->validate([
            'sale_id' => 'required|exists:sales,id',
            'phone' => 'required|string',
            'gateway' => 'required|in:fedapay,kakiapay',
        ]);

        $tenant = auth()->user()->tenant;
        $sale = Sale::where('tenant_id', $tenant->id)
            ->find($request->sale_id);

        if (!$sale) {
            return response()->json(['error' => 'Sale not found'], 404);
        }

        // Instantiate appropriate adapter
        $adapter = match ($request->gateway) {
            'fedapay' => new FedapayAdapter($tenant),
            'kakiapay' => new KakiapayAdapter($tenant),
        };

        $result = $adapter->initializePayment(
            $sale,
            $request->phone,
            $sale->total
        );

        if (!$result['success']) {
            return response()->json(['error' => $result['error']], 400);
        }

        return response()->json($result);
    }

    /**
     * Verify payment (webhook or polling)
     * POST /api/payments/verify
     */
    public function verify(Request $request): JsonResponse
    {
        $request->validate([
            'reference' => 'required|string',
            'gateway' => 'required|in:fedapay,kakiapay',
        ]);

        $tenant = auth()->user()->tenant;

        $adapter = match ($request->gateway) {
            'fedapay' => new FedapayAdapter($tenant),
            'kakiapay' => new KakiapayAdapter($tenant),
        };

        $result = $adapter->verifyPayment($request->reference);

        if (!$result['success']) {
            return response()->json(['error' => 'Payment verification failed'], 400);
        }

        // Update sale payment record
        $sale = Sale::where('tenant_id', $tenant->id)
            ->where('id', $result['metadata']['sale_id'] ?? null)
            ->first();

        if ($sale) {
            $adapter->recordPayment(
                $sale,
                $request->reference,
                $result['amount'],
                $request->gateway
            );

            $sale->update(['payment_status' => 'paid']);
        }

        return response()->json($result);
    }

    /**
     * Fedapay webhook callback
     * POST /payments/fedapay/callback
     */
    public function fedapayCallback(Request $request): JsonResponse
    {
        $data = $request->all();
        $metadata = $data['metadata'] ?? [];

        $tenant = Tenant::find($metadata['tenant_id']);
        if (!$tenant) {
            return response()->json(['error' => 'Tenant not found'], 404);
        }

        $adapter = new FedapayAdapter($tenant);
        $result = $adapter->verifyPayment($data['token'] ?? $data['id']);

        if ($result['success']) {
            $sale = Sale::where('tenant_id', $tenant->id)
                ->find($metadata['sale_id']);

            if ($sale) {
                $adapter->recordPayment(
                    $sale,
                    $data['token'] ?? $data['id'],
                    $result['amount'],
                    'fedapay'
                );

                $sale->update(['payment_status' => 'paid']);
            }
        }

        return response()->json(['success' => true]);
    }

    /**
     * Kakiapay webhook callback
     * POST /payments/kakiapay/callback
     */
    public function kakiapayCallback(Request $request): JsonResponse
    {
        $data = $request->all();
        $metadata = $data['metadata'] ?? [];

        $tenant = Tenant::find($metadata['tenant_id']);
        if (!$tenant) {
            return response()->json(['error' => 'Tenant not found'], 404);
        }

        $adapter = new KakiapayAdapter($tenant);
        $result = $adapter->verifyPayment($data['reference']);

        if ($result['success']) {
            $sale = Sale::where('tenant_id', $tenant->id)
                ->find($metadata['sale_id']);

            if ($sale) {
                $adapter->recordPayment(
                    $sale,
                    $data['reference'],
                    $result['amount'],
                    'kakiapay'
                );

                $sale->update(['payment_status' => 'paid']);
            }
        }

        return response()->json(['success' => true]);
    }

    /**
     * Get payment status
     * GET /api/payments/{reference}/status
     */
    public function status(string $reference, Request $request): JsonResponse
    {
        $request->validate([
            'gateway' => 'required|in:fedapay,kakiapay',
        ]);

        $tenant = auth()->user()->tenant;

        $adapter = match ($request->gateway) {
            'fedapay' => new FedapayAdapter($tenant),
            'kakiapay' => new KakiapayAdapter($tenant),
        };

        $result = $adapter->getTransactionStatus($reference);

        return response()->json($result);
    }
}
