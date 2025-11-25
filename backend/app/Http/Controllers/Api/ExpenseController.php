<?php

namespace App\Http\Controllers\Api;

use App\Models\Expense;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class ExpenseController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:sanctum');
    }

    public function store(Request $request): JsonResponse
    {
        $tenant_id = auth()->user()->tenant_id;

        $validated = $request->validate([
            'category' => 'required|string',
            'description' => 'required|string|max:255',
            'amount' => 'required|numeric|min:0',
            'date' => 'required|date',
        ]);

        $expense = Expense::create([
            'tenant_id' => $tenant_id,
            'user_id' => auth()->id(),
            ...$validated,
        ]);

        return response()->json($expense, 201);
    }

    public function index(Request $request): JsonResponse
    {
        $tenant_id = auth()->user()->tenant_id;
        
        $expenses = Expense::where('tenant_id', $tenant_id)
            ->orderBy('date', 'desc')
            ->paginate(20);

        return response()->json($expenses);
    }
}

