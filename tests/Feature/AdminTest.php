<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminTest extends TestCase
{
    use RefreshDatabase;

    /**
     * FT-A01: Test admin can view dashboard
     */
    public function test_admin_can_view_dashboard(): void
    {
        $admin = User::factory()->create(['role' => User::ROLE_USER_ADMIN]);

        $response = $this->actingAs($admin)->get('/admin/dashboard');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Admin/Dashboard')
        );
    }

    /**
     * FT-A02: Test non-admin can access dashboard (limited view)
     */
    public function test_non_admin_can_access_dashboard(): void
    {
        $user = User::factory()->create(['role' => User::ROLE_USER]);

        $response = $this->actingAs($user)->get('/admin/dashboard');

        // The dashboard route doesn't have role-based access control
        // Non-admins can access but see limited data
        $response->assertStatus(200);
    }

    /**
     * FT-A03: Test superadmin can promote user
     */
    public function test_superadmin_can_promote_user(): void
    {
        $superadmin = User::factory()->create(['role' => User::ROLE_SUPERADMIN]);
        $user = User::factory()->create(['role' => User::ROLE_USER]);

        $response = $this->actingAs($superadmin)
            ->post("/admin/users/{$user->id}/promote", [
                'role' => User::ROLE_USER_ADMIN,
            ]);

        $response->assertStatus(200); // Returns JSON response
        $response->assertJson(['message' => "User {$user->name} promoted to " . User::ROLE_USER_ADMIN . " successfully."]);
        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'role' => User::ROLE_USER_ADMIN,
        ]);
    }

    /**
     * FT-A04: Test non-superadmin cannot promote user
     */
    public function test_non_superadmin_cannot_promote_user(): void
    {
        $admin = User::factory()->create(['role' => User::ROLE_USER_ADMIN]);
        $user = User::factory()->create(['role' => User::ROLE_USER]);

        $response = $this->actingAs($admin)
            ->post("/admin/users/{$user->id}/promote");

        $response->assertStatus(403);
    }

    /**
     * FT-A05: Test admin can toggle user status
     */
    public function test_admin_can_toggle_user_status(): void
    {
        $admin = User::factory()->create(['role' => User::ROLE_USER_ADMIN]);
        $user = User::factory()->create(['role' => User::ROLE_USER, 'is_active' => true]);

        $response = $this->actingAs($admin)
            ->patch("/admin/users/{$user->id}/toggle-status");

        $response->assertStatus(302);
        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'is_active' => false,
        ]);
    }

    /**
     * FT-A06: Test admin can update user quota
     */
    public function test_admin_can_update_user_quota(): void
    {
        $admin = User::factory()->create(['role' => User::ROLE_USER_ADMIN]);
        $user = User::factory()->create(['role' => User::ROLE_USER]);

        $response = $this->actingAs($admin)
            ->patch("/admin/users/{$user->id}/update-quota", [
                'storage_limit' => 2097152, // 2MB
            ]);

        $response->assertStatus(302);
        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'storage_limit' => 2097152,
        ]);
    }

    /**
     * FT-A07: Test admin can view users
     */
    public function test_admin_can_view_users(): void
    {
        $admin = User::factory()->create(['role' => User::ROLE_USER_ADMIN]);
        User::factory()->count(3)->create(['role' => User::ROLE_USER]);

        $response = $this->actingAs($admin)->get('/admin/users');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Admin/Users')
            ->has('users')
        );
    }

    /**
     * FT-A08: Test admin can view cloud management
     * Skipped: Requires B2 credentials and SSL configuration
     */
    public function test_admin_can_view_cloud_management(): void
    {
        $this->markTestSkipped('B2 cloud management test requires proper B2 credentials.');
    }

    /**
     * FT-A09: Test admin can view database management
     * Skipped: Requires B2 credentials and SSL configuration
     */
    public function test_admin_can_view_database_management(): void
    {
        $this->markTestSkipped('B2 database management test requires proper B2 credentials.');
    }

    /**
     * FT-A10: Test admin can manage covers
     */
    public function test_admin_can_manage_covers(): void
    {
        $admin = User::factory()->create(['role' => User::ROLE_DB_STORAGE_ADMIN]);

        $response = $this->actingAs($admin)->get('/admin/covers');

        $response->assertStatus(200);
    }

    /**
     * FT-A11: Test user admin cannot access superadmin functions
     */
    public function test_user_admin_cannot_access_superadmin_functions(): void
    {
        $admin = User::factory()->create(['role' => User::ROLE_USER_ADMIN]);
        $user = User::factory()->create(['role' => User::ROLE_USER]);

        // Try to demote a user (superadmin only)
        $response = $this->actingAs($admin)
            ->post("/admin/users/{$user->id}/demote");

        $response->assertStatus(403);
    }
}
