<?php

namespace Database\Seeders;

use App\Models\Organization;
use App\Models\SubscriptionPlan;
use Illuminate\Database\Seeder;

class OrganizationSeeder extends Seeder
{
    public function run(): void
    {
        $plan = SubscriptionPlan::first();

        Organization::create([
            'name' => 'Cyber Academy',
            'logo' => null,
            'domain' => 'cyberacademy.test',
            'subscription_plan_id' => $plan->id,
            'status' => 'active',
        ]);
    }
}
