<?php

namespace Database\Seeders;

use App\Models\SubscriptionPlan;
use Illuminate\Database\Seeder;

class SubscriptionPlanSeeder extends Seeder
{
    public function run(): void
    {
        SubscriptionPlan::create([
            'name' => 'Pro',
            'price' => 99.00,
            'max_users' => 200,
            'max_courses' => 50,
            'features' => [
                'analytics' => true,
                'certificates' => true,
                'priority_support' => true,
            ],
        ]);
    }
}
