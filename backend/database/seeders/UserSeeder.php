<?php

namespace Database\Seeders;

use App\Enums\Role;
use App\Models\Organization;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        $organization = Organization::firstWhere('name', 'Cyber Academy');

        // Super admin: platform-level, no organization.
        User::factory()->superAdmin()->create([
            'name' => 'Super Admin',
            'email' => 'superadmin@learntrack.test',
            'password' => Hash::make('password'),
        ]);

        // Org admin.
        User::factory()->orgAdmin()->create([
            'name' => 'Org Admin',
            'email' => 'orgadmin@learntrack.test',
            'organization_id' => $organization->id,
            'password' => Hash::make('password'),
        ]);

        // Teachers.
        for ($i = 1; $i <= 2; $i++) {
            User::factory()->teacher()->create([
                'name' => "Teacher {$i}",
                'email' => "teacher{$i}@learntrack.test",
                'organization_id' => $organization->id,
                'password' => Hash::make('password'),
            ]);
        }

        // Students.
        for ($i = 1; $i <= 10; $i++) {
            User::factory()->student()->create([
                'name' => "Student {$i}",
                'email' => "student{$i}@learntrack.test",
                'organization_id' => $organization->id,
                'password' => Hash::make('password'),
            ]);
        }
    }
}
