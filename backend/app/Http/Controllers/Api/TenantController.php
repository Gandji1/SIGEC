<?php

namespace App\Http\Controllers\Api;

use App\Models\Tenant;
use Illuminate\Http\Request;

class TenantController extends Controller
{
    public function index()
    {
        $tenants = Tenant::all();
        return response()->json(['success' => true, 'data' => $tenants]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string',
            'slug' => 'required|string|unique:tenants',
            'domain' => 'required|string|unique:tenants',
            'business_type' => 'required|string',
        ]);

        $tenant = Tenant::create($validated);
        return response()->json(['success' => true, 'data' => $tenant], 201);
    }

    public function show(Tenant $tenant)
    {
        return response()->json(['success' => true, 'data' => $tenant]);
    }

    public function update(Request $request, Tenant $tenant)
    {
        $validated = $request->validate([
            'name' => 'string',
            'business_type' => 'string',
        ]);

        $tenant->update($validated);
        return response()->json(['success' => true, 'data' => $tenant]);
    }

    public function destroy(Tenant $tenant)
    {
        $tenant->delete();
        return response()->json(['success' => true, 'message' => 'Tenant deleted']);
    }

    public function suspend(Tenant $tenant)
    {
        $tenant->update(['status' => 'suspended']);
        return response()->json(['success' => true, 'data' => $tenant]);
    }

    public function activate(Tenant $tenant)
    {
        $tenant->update(['status' => 'active']);
        return response()->json(['success' => true, 'data' => $tenant]);
    }
}
