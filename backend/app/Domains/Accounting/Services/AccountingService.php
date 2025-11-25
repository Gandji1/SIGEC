<?php

namespace App\Domains\Accounting\Services;

use App\Models\AccountingEntry;
use App\Models\ChartOfAccounts;
use Illuminate\Database\Eloquent\Collection;

class AccountingService
{
    /**
     * Créer une entrée comptable
     */
    public function createEntry(array $data): AccountingEntry
    {
        return AccountingEntry::create($data);
    }

    /**
     * Enregistrer un mouvement de stock automatiquement
     */
    public function recordStockMovement(array $data): AccountingEntry
    {
        return $this->createEntry([
            'tenant_id' => $data['tenant_id'],
            'account_id' => $data['account_id'],
            'journal' => $data['journal'] ?? 'ST', // Stock Journal
            'reference' => $data['reference'],
            'description' => $data['description'] ?? 'Mouvement de stock',
            'debit' => $data['debit'] ?? 0,
            'credit' => $data['credit'] ?? 0,
            'date' => $data['date'] ?? now(),
        ]);
    }

    /**
     * Enregistrer une vente automatiquement
     */
    public function recordSale(array $data): AccountingEntry
    {
        return $this->createEntry([
            'tenant_id' => $data['tenant_id'],
            'account_id' => $data['account_id'],
            'journal' => 'VT', // Ventes Journal
            'reference' => $data['reference'],
            'description' => $data['description'] ?? 'Vente',
            'debit' => $data['debit'] ?? 0,
            'credit' => $data['credit'] ?? 0,
            'date' => $data['date'] ?? now(),
        ]);
    }

    /**
     * Enregistrer un achat automatiquement
     */
    public function recordPurchase(array $data): AccountingEntry
    {
        return $this->createEntry([
            'tenant_id' => $data['tenant_id'],
            'account_id' => $data['account_id'],
            'journal' => 'AC', // Achats Journal
            'reference' => $data['reference'],
            'description' => $data['description'] ?? 'Achat',
            'debit' => $data['debit'] ?? 0,
            'credit' => $data['credit'] ?? 0,
            'date' => $data['date'] ?? now(),
        ]);
    }

    /**
     * Récupérer le solde d'un compte
     */
    public function getAccountBalance(int $accountId, int $tenantId): float
    {
        $entries = AccountingEntry::where('tenant_id', $tenantId)
            ->where('account_id', $accountId)
            ->get();

        $total = 0;
        foreach ($entries as $entry) {
            $total += $entry->debit - $entry->credit;
        }

        return $total;
    }

    /**
     * Récupérer les entrées par journal
     */
    public function getJournalEntries(string $journal, int $tenantId): Collection
    {
        return AccountingEntry::where('tenant_id', $tenantId)
            ->where('journal', $journal)
            ->orderBy('date', 'desc')
            ->get();
    }

    /**
     * Générer une balance comptable
     */
    public function generateBalance(int $tenantId, $fromDate = null, $toDate = null): array
    {
        $query = AccountingEntry::where('tenant_id', $tenantId);

        if ($fromDate) {
            $query->where('date', '>=', $fromDate);
        }
        if ($toDate) {
            $query->where('date', '<=', $toDate);
        }

        $entries = $query->get();
        $balance = [];

        foreach ($entries as $entry) {
            $accountId = $entry->account_id;
            if (!isset($balance[$accountId])) {
                $balance[$accountId] = ['debit' => 0, 'credit' => 0];
            }
            $balance[$accountId]['debit'] += $entry->debit;
            $balance[$accountId]['credit'] += $entry->credit;
        }

        return $balance;
    }
}
