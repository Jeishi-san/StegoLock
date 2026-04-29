<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {

        // Seed Admin Users
        $this->call(AdminUserSeeder::class);

        // Seed Covers
        $this->call(CoverSeeder::class);

        // Seed Wiki Feeds
        $this->call(WikiFeedsSeeder::class);
    }
}
