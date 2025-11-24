<?php

namespace App\Domains\Payments\Services;

use App\Models\Tenant;
use App\Models\Sale;
use App\Models\SalePayment;
use Exception;

abstract class PaymentGatewayAdapter
{
    protected Tenant $tenant;
    protected string $api_key;
    protected string $secret_key;
    protected string $environment; // 'sandbox' or 'production'

    public function __construct(Tenant $tenant)
    {
        $this->tenant = $tenant;
        $this->environment = config('payments.environment', 'sandbox');
        $this->loadCredentials();
    }

    /**
     * Load PSP credentials from tenant settings or environment
     */
    protected function loadCredentials(): void
    {
        // Get from tenant settings first, fallback to env
        $settings = $this->tenant->settings ?? [];
        
        $this->api_key = $settings['psp_api_key'] ?? config('payments.api_key');
        $this->secret_key = $settings['psp_secret_key'] ?? config('payments.secret_key');
    }

    /**
     * Initialize payment
     * Returns transaction reference for frontend to process
     */
    abstract public function initializePayment(Sale $sale, string $phone, float $amount): array;

    /**
     * Verify payment after user confirmation
     */
    abstract public function verifyPayment(string $reference): array;

    /**
     * Get transaction status
     */
    abstract public function getTransactionStatus(string $reference): array;

    /**
     * Record successful payment in database
     */
    public function recordPayment(Sale $sale, string $reference, float $amount, string $method): SalePayment
    {
        return SalePayment::create([
            'tenant_id' => $this->tenant->id,
            'sale_id' => $sale->id,
            'amount' => $amount,
            'method' => $method,
            'reference' => $reference,
            'status' => 'completed',
            'paid_at' => now(),
        ]);
    }

    /**
     * Format amount for PSP (in cents)
     */
    protected function formatAmount(float $amount): int
    {
        return (int) ($amount * 100);
    }

    /**
     * Parse amount from PSP (from cents)
     */
    protected function parseAmount(int $amount_cents): float
    {
        return $amount_cents / 100;
    }

    /**
     * Generate idempotency key
     */
    protected function generateIdempotencyKey(): string
    {
        return bin2hex(random_bytes(16));
    }
}
