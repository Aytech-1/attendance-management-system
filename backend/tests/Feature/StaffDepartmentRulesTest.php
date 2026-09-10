<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use App\Models\User;
use App\Models\Department;
use App\Models\StaffProfile;
use Spatie\Permission\Models\Role;

class StaffDepartmentRulesTest extends TestCase
{
    use RefreshDatabase;

    protected $adminUser;
    protected $department;

    protected function setUp(): void
    {
        parent::setUp();

        // Seed roles
        Role::firstOrCreate(['name' => 'Super Administrator', 'guard_name' => 'web']);
        Role::firstOrCreate(['name' => 'Administrator', 'guard_name' => 'web']);
        Role::firstOrCreate(['name' => 'Head of Department', 'guard_name' => 'web']);
        Role::firstOrCreate(['name' => 'Lecturer', 'guard_name' => 'web']);
        Role::firstOrCreate(['name' => 'Student', 'guard_name' => 'web']);

        $this->department = Department::create([
            'name' => 'Computer Science',
            'code' => 'CSC',
            'status' => 'ACTIVE'
        ]);

        $this->adminUser = User::create([
            'name' => 'System Admin',
            'email' => 'sysadmin@test.com',
            'password' => bcrypt('password123'),
            'status' => 'ACTIVE'
        ]);
        $this->adminUser->assignRole('Super Administrator');

        StaffProfile::create([
            'user_id' => $this->adminUser->id,
            'department_id' => null,
            'staff_id' => 'STF/ADMIN/001',
            'title' => 'MR',
            'phone' => '08000000000',
            'gender' => 'MALE'
        ]);
    }

    /** @test */
    public function test_1_create_system_administrator_without_department()
    {
        $response = $this->actingAs($this->adminUser, 'sanctum')
            ->postJson('/api/v1/staff', [
                'name' => 'New Admin',
                'email' => 'newadmin@test.com',
                'password' => 'password123',
                'role' => 'Administrator',
                'staff_id' => 'STF/2026/0099',
                'department_id' => null,
                'title' => 'MR',
                'gender' => 'MALE'
            ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('users', ['email' => 'newadmin@test.com']);
        
        $user = User::where('email', 'newadmin@test.com')->first();
        $this->assertNull($user->staffProfile->department_id);
    }

    /** @test */
    public function test_2_edit_system_administrator_name()
    {
        $response = $this->actingAs($this->adminUser, 'sanctum')
            ->putJson("/api/v1/staff/{$this->adminUser->id}", [
                'name' => 'Updated System Admin Name'
            ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('users', [
            'id' => $this->adminUser->id,
            'name' => 'Updated System Admin Name'
        ]);
    }

    /** @test */
    public function test_3_edit_system_administrator_role()
    {
        $staff = User::create([
            'name' => 'Staff User',
            'email' => 'staffuser@test.com',
            'password' => bcrypt('password123'),
            'status' => 'ACTIVE'
        ]);
        $staff->assignRole('Lecturer');
        StaffProfile::create([
            'user_id' => $staff->id,
            'department_id' => $this->department->id,
            'staff_id' => 'STF/LECT/001',
            'title' => 'MR',
            'phone' => '08011111111',
            'gender' => 'MALE'
        ]);

        $response = $this->actingAs($this->adminUser, 'sanctum')
            ->putJson("/api/v1/staff/{$staff->id}", [
                'role' => 'Administrator',
                'department_id' => null
            ]);

        $response->assertStatus(200);
        $this->assertTrue($staff->fresh()->hasRole('Administrator'));
    }

    /** @test */
    public function test_4_edit_system_administrator_without_selecting_department()
    {
        $response = $this->actingAs($this->adminUser, 'sanctum')
            ->putJson("/api/v1/staff/{$this->adminUser->id}", [
                'phone' => '09099998888',
                'department_id' => null
            ]);

        $response->assertStatus(200);
        $this->assertNull($this->adminUser->fresh()->staffProfile->department_id);
    }

    /** @test */
    public function test_5_change_lecturer_to_system_administrator_clears_department()
    {
        $lecturer = User::create([
            'name' => 'Lecturer User',
            'email' => 'lecturer@test.com',
            'password' => bcrypt('password123'),
            'status' => 'ACTIVE'
        ]);
        $lecturer->assignRole('Lecturer');
        StaffProfile::create([
            'user_id' => $lecturer->id,
            'department_id' => $this->department->id,
            'staff_id' => 'STF/LECT/002',
            'title' => 'DR',
            'phone' => '08022222222',
            'gender' => 'MALE'
        ]);

        $response = $this->actingAs($this->adminUser, 'sanctum')
            ->putJson("/api/v1/staff/{$lecturer->id}", [
                'role' => 'Administrator'
            ]);

        $response->assertStatus(200);
        $this->assertNull($lecturer->fresh()->staffProfile->department_id);
    }

    /** @test */
    public function test_6_change_system_administrator_to_lecturer_requires_department()
    {
        $admin = User::create([
            'name' => 'Admin User',
            'email' => 'adminuser@test.com',
            'password' => bcrypt('password123'),
            'status' => 'ACTIVE'
        ]);
        $admin->assignRole('Administrator');
        StaffProfile::create([
            'user_id' => $admin->id,
            'department_id' => null,
            'staff_id' => 'STF/ADMIN/002',
            'title' => 'MR',
            'phone' => '08033333333',
            'gender' => 'MALE'
        ]);

        // Attempting to change to Lecturer without department should fail validation
        $failResponse = $this->actingAs($this->adminUser, 'sanctum')
            ->putJson("/api/v1/staff/{$admin->id}", [
                'role' => 'Lecturer',
                'department_id' => null
            ]);

        $failResponse->assertStatus(422);

        // Providing a valid department should succeed
        $successResponse = $this->actingAs($this->adminUser, 'sanctum')
            ->putJson("/api/v1/staff/{$admin->id}", [
                'role' => 'Lecturer',
                'department_id' => $this->department->id
            ]);

        $successResponse->assertStatus(200);
        $this->assertEquals($this->department->id, $admin->fresh()->staffProfile->department_id);
    }

    /** @test */
    public function test_7_change_system_administrator_to_hod_requires_department()
    {
        $admin = User::create([
            'name' => 'Admin User HOD',
            'email' => 'adminhod@test.com',
            'password' => bcrypt('password123'),
            'status' => 'ACTIVE'
        ]);
        $admin->assignRole('Administrator');
        StaffProfile::create([
            'user_id' => $admin->id,
            'department_id' => null,
            'staff_id' => 'STF/ADMIN/003',
            'title' => 'MR',
            'phone' => '08044444444',
            'gender' => 'MALE'
        ]);

        $failResponse = $this->actingAs($this->adminUser, 'sanctum')
            ->putJson("/api/v1/staff/{$admin->id}", [
                'role' => 'Head of Department',
                'department_id' => null
            ]);

        $failResponse->assertStatus(422);

        $successResponse = $this->actingAs($this->adminUser, 'sanctum')
            ->putJson("/api/v1/staff/{$admin->id}", [
                'role' => 'Head of Department',
                'department_id' => $this->department->id
            ]);

        $successResponse->assertStatus(200);
        $this->assertEquals($this->department->id, $admin->fresh()->staffProfile->department_id);
    }
}
