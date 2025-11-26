<?php

namespace App\Http\Controllers\Api;

use App\Models\Tenant;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

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
            'phone' => 'nullable|string',
            'email' => 'nullable|email',
            'address' => 'nullable|string',
            'currency' => 'nullable|string',
            'tva_rate' => 'nullable|numeric|min:0',
            'default_markup' => 'nullable|numeric|min:0',
            'stock_policy' => 'nullable|in:fifo,lifo,cmp',
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

    /**
     * Upload tenant logo
     */
    public function uploadLogo(Request $request, Tenant $tenant)
    {
        $validated = $request->validate([
            'logo' => 'required|image|mimes:jpeg,png,jpg,gif,webp|max:2048',
        ]);

        // Supprimer ancien logo
        if ($tenant->logo && Storage::exists($tenant->logo)) {
            Storage::delete($tenant->logo);
        }

        // Sauvegarder nouveau logo
        $path = $request->file('logo')->store('tenants', 'public');
        $tenant->update(['logo' => $path]);

        return response()->json([
            'success' => true,
            'logo_url' => Storage::url($path),
            'tenant' => $tenant,
        ]);
    }

    /**
     * Delete tenant logo
     */
    public function deleteLogo(Tenant $tenant)
    {
        if ($tenant->logo && Storage::exists($tenant->logo)) {
            Storage::delete($tenant->logo);
        }

        $tenant->update(['logo' => null]);

        return response()->json([
            'success' => true,
            'message' => 'Logo deleted',
        ]);
    }
}
