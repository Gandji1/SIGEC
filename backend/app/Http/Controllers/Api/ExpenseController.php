<?php

namespace App\Http\Controllers\Api;

use App\Models\AccountingEntry;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class ExpenseController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:sanctum');
        $this->middleware('tenant');
    }

    /**
     * Créer une charge
     */
    public function store(Request $request): JsonResponse
    {
        $tenant_id = auth()->guard('sanctum')->user()->tenant_id;

        $validated = $request->validate([
            'category' => 'required|string|in:personnel,transport,utilities,maintenance,other',
            'description' => 'required|string|max:255',
            'amount' => 'required|numeric|min:0',
            'date' => 'required|date',
            'payment_method' => 'nullable|in:cash,transfer,check',
        ]);

        // Créer l'écriture comptable de charge
        $entry = AccountingEntry::create([
            'tenant_id' => $tenant_id,
            'user_id' => auth()->id(),
            'date' => $validated['date'],
            'account_debit' => '60000', // Charges d'exploitation
            'account_credit' => '41000', // Caisse
            'amount' => $validated['amount'],
            'description' => "Expense: {$validated['category']} - {$validated['description']}",
            'reference' => 'EXP-' . now()->format('YmdHis'),
            'type' => 'expense',
            'metadata' => [
                'category' => $validated['category'],
                'payment_method' => $validated['payment_method'] ?? 'cash',
            ],
        ]);

        return response()->json([
            'message' => 'Expense recorded',
            'entry' => $entry,
        ], 201);
    }

    /**
     * Lister les charges
     */
    public function index(Request $request): JsonResponse
    {
        $tenant_id = auth()->guard('sanctum')->user()->tenant_id;
        $start_date = $request->query('start_date', now()->subMonth()->toDateString());
        $end_date = $request->query('end_date', now()->toDateString());
        $category = $request->query('category');

        $query = AccountingEntry::where('tenant_id', $tenant_id)
            ->where('type', 'expense')
            ->whereBetween('date', [$start_date, $end_date]);

        if ($category) {
            $query->whereJsonContains('metadata->category', $category);
        }

        $expenses = $query->orderBy('date', 'desc')->paginate(20);

        return response()->json([
            'data' => $expenses,
            'summary' => [
                'total' => $expenses->sum('amount'),
                'count' => $expenses->count(),
            ],
        ]);
    }
}
