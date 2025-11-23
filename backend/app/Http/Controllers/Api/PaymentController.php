<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Sale;
use App\Domains\Billing\Services\StripePaymentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PaymentController extends Controller
{
    private StripePaymentService $stripeService;

    public function __construct()
    {
        $this->stripeService = new StripePaymentService();
        $this->middleware('auth:sanctum');
    }

    public function createPaymentIntent(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'sale_id' => 'required|integer|exists:sales,id',
            'amount' => 'required|numeric|min:0',
            'currency' => 'required|string|size:3',
        ]);

        $sale = Sale::find($validated['sale_id']);

        if ($sale->tenant_id !== auth()->guard('sanctum')->user()->tenant_id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $result = $this->stripeService->createPaymentIntent(
            $validated['amount'],
            $validated['currency'],
            ['sale_id' => $sale->id, 'reference' => $sale->reference]
        );

        return response()->json($result);
    }

    public function confirmPayment(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'sale_id' => 'required|integer|exists:sales,id',
            'intent_id' => 'required|string',
        ]);

        $sale = Sale::find($validated['sale_id']);

        if ($sale->tenant_id !== auth()->guard('sanctum')->user()->tenant_id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $result = $this->stripeService->confirmPayment($validated['intent_id']);

        if ($result['success']) {
            $sale->update([
                'amount_paid' => $sale->total,
                'payment_method' => 'card',
                'status' => 'completed',
                'completed_at' => now(),
            ]);
        }

        return response()->json($result);
    }

    public function refund(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'sale_id' => 'required|integer|exists:sales,id',
            'amount' => 'nullable|numeric',
        ]);

        $sale = Sale::find($validated['sale_id']);

        if ($sale->tenant_id !== auth()->guard('sanctum')->user()->tenant_id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        if ($sale->status !== 'completed') {
            return response()->json(['message' => 'Only completed sales can be refunded'], 422);
        }

        $result = $this->stripeService->refundPayment(
            $sale->metadata['transaction_id'] ?? null,
            $validated['amount'] ?? $sale->total
        );

        if ($result['success']) {
            $sale->update(['status' => 'returned']);
        }

        return response()->json($result);
    }
}
