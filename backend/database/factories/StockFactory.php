<?php

namespace Database\Factories;

use App\Models\Stock;
use App\Models\Product;
use App\Models\Tenant;
use Illuminate\Database\Eloquent\Factories\Factory;

class StockFactory extends Factory
{
    protected $model = Stock::class;

    public function definition(): array
    {
        return [
            'tenant_id' => Tenant::factory(),
            'product_id' => Product::factory(),
            'warehouse' => 'main',
            'quantity' => $this->faker->numberBetween(10, 500),
            'reserved' => 0,
            'available' => $this->faker->numberBetween(10, 500),
            'unit_cost' => $this->faker->numberBetween(1000, 50000),
        ];
    }
}
