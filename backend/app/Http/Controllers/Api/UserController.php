<?php

namespace App\Http\Controllers\Api;

use App\Models\User;
use App\Models\Role;
use Illuminate\Http\Request;

class UserController extends Controller
{
    public function index(Request $request)
    {
        $tenantId = $request->header('X-Tenant-ID');
        $users = User::where('tenant_id', $tenantId)->with('roles')->get();
        return response()->json(['success' => true, 'data' => $users]);
    }

    public function store(Request $request)
    {
        $tenantId = $request->header('X-Tenant-ID');
        
        $validated = $request->validate([
            'name' => 'required|string',
            'email' => 'required|email|unique:users',
            'password' => 'required|min:6',
            'phone' => 'string|nullable',
            'role' => 'string|nullable',
        ]);

        $validated['tenant_id'] = $tenantId;
        $validated['password'] = bcrypt($validated['password']);

        $user = User::create($validated);
        return response()->json(['success' => true, 'data' => $user], 201);
    }

    public function show(User $user)
    {
        return response()->json(['success' => true, 'data' => $user->load('roles')]);
    }

    public function update(Request $request, User $user)
    {
        $validated = $request->validate([
            'name' => 'string',
            'email' => 'email',
            'phone' => 'string|nullable',
        ]);

        $user->update($validated);
        return response()->json(['success' => true, 'data' => $user]);
    }

    public function destroy(User $user)
    {
        $user->delete();
        return response()->json(['success' => true, 'message' => 'User deleted']);
    }

    public function assignRole(Request $request, User $user)
    {
        $validated = $request->validate([
            'role_slug' => 'required|string',
        ]);

        $tenantId = $request->header('X-Tenant-ID');
        $role = Role::where('slug', $validated['role_slug'])->first();

        if (!$role) {
            return response()->json(['success' => false, 'message' => 'Role not found'], 404);
        }

        $user->roles()->sync([$role->id], false);
        // Also add to user_roles table with tenant_id
        $user->roles()->detach();
        \DB::table('user_roles')->insert([
            'user_id' => $user->id,
            'role_id' => $role->id,
            'tenant_id' => $tenantId,
        ]);

        return response()->json(['success' => true, 'data' => $user->load('roles')]);
    }
}
