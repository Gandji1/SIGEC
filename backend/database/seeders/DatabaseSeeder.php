<?php

namespace Database\Seeders;

use App\Models\Tenant;
use App\Models\User;
use App\Models\Product;
use App\Models\Stock;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Create test tenant
        $tenant = Tenant::create([
            'name' => 'Demo Business',
            'slug' => 'demo-business',
            'domain' => 'demo.localhost',
            'currency' => 'XOF',
            'country' => 'Senegal',
            'phone' => '+221 77 123 45 67',
            'email' => 'admin@demo.local',
            'address' => '123 Main Street, Dakar',
            'status' => 'active',
        ]);

        // Create admin user
        User::create([
            'tenant_id' => $tenant->id,
            'name' => 'Admin User',
            'email' => 'admin@demo.local',
            'password' => Hash::make('password'),
            'phone' => '+221 77 111 11 11',
            'role' => 'admin',
            'status' => 'active',
        ]);

        // Create manager user
        User::create([
            'tenant_id' => $tenant->id,
            'name' => 'Manager User',
            'email' => 'manager@demo.local',
            'password' => Hash::make('password'),
            'phone' => '+221 77 222 22 22',
            'role' => 'manager',
            'status' => 'active',
        ]);

        // Create staff user
        User::create([
            'tenant_id' => $tenant->id,
            'name' => 'Staff User',
            'email' => 'staff@demo.local',
            'password' => Hash::make('password'),
            'phone' => '+221 77 333 33 33',
            'role' => 'staff',
            'status' => 'active',
        ]);

        // Create sample products
        $products = [
            [
                'code' => 'PROD-001',
                'name' => 'Rice (5kg)',
                'category' => 'Grains',
                'purchase_price' => 5000,
                'selling_price' => 6500,
                'unit' => 'bag',
                'tax_percent' => 18,
            ],
            [
                'code' => 'PROD-002',
                'name' => 'Sugar (2kg)',
                'category' => 'Grains',
                'purchase_price' => 2500,
                'selling_price' => 3500,
                'unit' => 'bag',
                'tax_percent' => 18,
            ],
            [
                'code' => 'PROD-003',
                'name' => 'Cooking Oil (1L)',
                'category' => 'Oils',
                'purchase_price' => 1500,
                'selling_price' => 2200,
                'unit' => 'bottle',
                'tax_percent' => 18,
            ],
            [
                'code' => 'PROD-004',
                'name' => 'Tomato Paste (200g)',
                'category' => 'Canned',
                'purchase_price' => 800,
                'selling_price' => 1200,
                'unit' => 'can',
                'tax_percent' => 18,
            ],
            [
                'code' => 'PROD-005',
                'name' => 'Milk (1L)',
                'category' => 'Dairy',
                'purchase_price' => 1200,
                'selling_price' => 1800,
                'unit' => 'bottle',
                'tax_percent' => 18,
            ],
        ];

        foreach ($products as $productData) {
            $product = Product::create([
                'tenant_id' => $tenant->id,
                ...$productData,
                'status' => 'active',
            ]);

            // Calculate margin
            $product->calculateMargin();
            $product->save();

            // Create stock
            Stock::create([
                'tenant_id' => $tenant->id,
                'product_id' => $product->id,
                'warehouse' => 'main',
                'quantity' => 100,
                'available' => 100,
                'unit_cost' => $product->purchase_price,
            ]);
        }

        $this->command->info('Database seeded successfully with test data!');
    }
}
