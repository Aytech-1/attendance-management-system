<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use App\Models\User;
use App\Models\Department;
use App\Models\Course;
use App\Models\StaffProfile;
use Spatie\Permission\Models\Role;

class HodRbacDepartmentScopingTest extends TestCase
{
    use RefreshDatabase;

    protected $adminUser;
    protected $hodUser;
    protected $csDept;
    protected $accDept;
    protected $csLecturer;
    protected $accLecturer;
    protected $csCourse;
    protected $accCourse;

    protected function setUp(): void
    {
        parent::setUp();

        // Seed roles
        Role::firstOrCreate(['name' => 'Super Administrator', 'guard_name' => 'web']);
        Role::firstOrCreate(['name' => 'Administrator', 'guard_name' => 'web']);
        Role::firstOrCreate(['name' => 'Head of Department', 'guard_name' => 'web']);
        Role::firstOrCreate(['name' => 'Lecturer', 'guard_name' => 'web']);
        Role::firstOrCreate(['name' => 'Student', 'guard_name' => 'web']);

        // Create Departments
        $this->csDept = Department::create(['name' => 'COMPUTER SCIENCE', 'code' => 'CSC', 'status' => 'ACTIVE']);
        $this->accDept = Department::create(['name' => 'ACCOUNTING', 'code' => 'ACC', 'status' => 'ACTIVE']);

        // Create Super Admin
        $this->adminUser = User::create([
            'name' => 'Super Admin',
            'email' => 'admin@test.com',
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

        // Create CS HOD
        $this->hodUser = User::create([
            'name' => 'Dr. CS HOD',
            'email' => 'cshod@test.com',
            'password' => bcrypt('password123'),
            'status' => 'ACTIVE'
        ]);
        $this->hodUser->assignRole('Head of Department');
        StaffProfile::create([
            'user_id' => $this->hodUser->id,
            'department_id' => $this->csDept->id,
            'staff_id' => 'STF/HOD/001',
            'title' => 'DR',
            'phone' => '08011111111',
            'gender' => 'MALE'
        ]);

        // Create CS Lecturer
        $this->csLecturer = User::create([
            'name' => 'Mr. CS Lecturer',
            'email' => 'cslecturer@test.com',
            'password' => bcrypt('password123'),
            'status' => 'ACTIVE'
        ]);
        $this->csLecturer->assignRole('Lecturer');
        StaffProfile::create([
            'user_id' => $this->csLecturer->id,
            'department_id' => $this->csDept->id,
            'staff_id' => 'STF/LECT/001',
            'title' => 'MR',
            'phone' => '08022222222',
            'gender' => 'MALE'
        ]);

        // Create Accounting Lecturer
        $this->accLecturer = User::create([
            'name' => 'Mrs. ACC Lecturer',
            'email' => 'acclecturer@test.com',
            'password' => bcrypt('password123'),
            'status' => 'ACTIVE'
        ]);
        $this->accLecturer->assignRole('Lecturer');
        StaffProfile::create([
            'user_id' => $this->accLecturer->id,
            'department_id' => $this->accDept->id,
            'staff_id' => 'STF/LECT/002',
            'title' => 'MRS',
            'phone' => '08033333333',
            'gender' => 'FEMALE'
        ]);

        // Create CS Course
        $this->csCourse = Course::create([
            'code' => 'CSC101',
            'name' => 'Intro to Computer Science',
            'department_id' => $this->csDept->id,
            'lecturer_id' => $this->csLecturer->id,
            'level' => 100,
            'credit_unit' => 3,
            'semester' => 'FIRST',
            'status' => 'ACTIVE'
        ]);

        // Create Accounting Course
        $this->accCourse = Course::create([
            'code' => 'ACC101',
            'name' => 'Principles of Accounting',
            'department_id' => $this->accDept->id,
            'lecturer_id' => $this->accLecturer->id,
            'level' => 100,
            'credit_unit' => 3,
            'semester' => 'FIRST',
            'status' => 'ACTIVE'
        ]);
    }

    /** @test */
    public function test_1_hod_staff_list_is_department_scoped()
    {
        $response = $this->actingAs($this->hodUser, 'sanctum')
            ->getJson('/api/v1/staff');

        $response->assertStatus(200);
        $staffIds = collect($response->json('data'))->pluck('id')->toArray();

        // HOD should see self and CS lecturer
        $this->assertContains($this->hodUser->id, $staffIds);
        $this->assertContains($this->csLecturer->id, $staffIds);

        // HOD must NOT see Accounting lecturer
        $this->assertNotContains($this->accLecturer->id, $staffIds);
    }

    /** @test */
    public function test_2_hod_cannot_override_department_filter_param()
    {
        // CS HOD attempts to filter staff by Accounting department ID
        $response = $this->actingAs($this->hodUser, 'sanctum')
            ->getJson("/api/v1/staff?department_id={$this->accDept->id}");

        $response->assertStatus(200);
        $staffIds = collect($response->json('data'))->pluck('id')->toArray();

        // Accounting staff must NOT be returned
        $this->assertNotContains($this->accLecturer->id, $staffIds);
    }

    /** @test */
    public function test_3_hod_dashboard_staff_count_is_department_scoped()
    {
        $response = $this->actingAs($this->hodUser, 'sanctum')
            ->getJson('/api/v1/dashboard/stats');

        $response->assertStatus(200);
        
        // CS department has 2 staff (Dr. CS HOD + Mr. CS Lecturer)
        $this->assertEquals(2, $response->json('counters.total_staff'));
        $this->assertEquals(1, $response->json('counters.total_courses'));
    }

    /** @test */
    public function test_4_hod_cannot_create_staff()
    {
        $response = $this->actingAs($this->hodUser, 'sanctum')
            ->postJson('/api/v1/staff', [
                'name' => 'Illegal Staff',
                'email' => 'illegal@test.com',
                'password' => 'password123',
                'role' => 'Lecturer',
                'staff_id' => 'STF/2026/9999',
                'department_id' => $this->csDept->id
            ]);

        $response->assertStatus(403);
    }

    /** @test */
    public function test_5_hod_cannot_update_staff()
    {
        $response = $this->actingAs($this->hodUser, 'sanctum')
            ->putJson("/api/v1/staff/{$this->csLecturer->id}", [
                'name' => 'HOD Modified Name'
            ]);

        $response->assertStatus(403);
    }

    /** @test */
    public function test_6_hod_cannot_delete_staff()
    {
        $response = $this->actingAs($this->hodUser, 'sanctum')
            ->deleteJson("/api/v1/staff/{$this->csLecturer->id}");

        $response->assertStatus(403);
    }

    /** @test */
    public function test_7_hod_cannot_access_other_department_staff_details()
    {
        $response = $this->actingAs($this->hodUser, 'sanctum')
            ->getJson("/api/v1/staff/{$this->accLecturer->id}");

        $response->assertStatus(403);
    }

    /** @test */
    public function test_8_hod_department_list_is_scoped()
    {
        $response = $this->actingAs($this->hodUser, 'sanctum')
            ->getJson('/api/v1/departments');

        $response->assertStatus(200);
        $deptIds = collect($response->json('data'))->pluck('id')->toArray();

        $this->assertContains($this->csDept->id, $deptIds);
        $this->assertNotContains($this->accDept->id, $deptIds);
    }

    /** @test */
    public function test_9_hod_course_list_is_scoped()
    {
        $response = $this->actingAs($this->hodUser, 'sanctum')
            ->getJson('/api/v1/courses');

        $response->assertStatus(200);
        $courseIds = collect($response->json('data'))->pluck('id')->toArray();

        $this->assertContains($this->csCourse->id, $courseIds);
        $this->assertNotContains($this->accCourse->id, $courseIds);
    }

    /** @test */
    public function test_10_hod_cannot_access_other_department_course_details()
    {
        $response = $this->actingAs($this->hodUser, 'sanctum')
            ->getJson("/api/v1/courses/{$this->accCourse->id}");

        $response->assertStatus(403);
    }

    /** @test */
    public function test_11_hod_cross_department_course_assignment_rejected()
    {
        // HOD attempts to assign Accounting lecturer to CS course
        $response = $this->actingAs($this->hodUser, 'sanctum')
            ->putJson("/api/v1/courses/{$this->csCourse->id}", [
                'lecturer_id' => $this->accLecturer->id
            ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['lecturer_id']);
    }

    /** @test */
    public function test_12_super_admin_retains_global_access()
    {
        // Super Admin gets all staff
        $staffResponse = $this->actingAs($this->adminUser, 'sanctum')->getJson('/api/v1/staff');
        $staffResponse->assertStatus(200);
        $this->assertEquals(4, count($staffResponse->json('data')));

        // Super Admin can create staff
        $createResponse = $this->actingAs($this->adminUser, 'sanctum')->postJson('/api/v1/staff', [
            'name' => 'New Global Staff',
            'email' => 'globalstaff@test.com',
            'password' => 'password123',
            'role' => 'Lecturer',
            'staff_id' => 'STF/2026/8888',
            'department_id' => $this->accDept->id
        ]);
        $createResponse->assertStatus(201);
    }
}
