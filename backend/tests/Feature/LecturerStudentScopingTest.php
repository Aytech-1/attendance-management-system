<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use App\Models\User;
use App\Models\Department;
use App\Models\Course;
use App\Models\StaffProfile;
use App\Models\StudentProfile;
use Spatie\Permission\Models\Role;

class LecturerStudentScopingTest extends TestCase
{
    use RefreshDatabase;

    protected $adminUser;
    protected $hodUser;
    protected $lecturerA;
    protected $lecturerB;
    protected $csDept;
    protected $accDept;
    protected $csc101;
    protected $csc201;
    protected $csc401;
    protected $acc101;
    protected $studentA;
    protected $studentB;
    protected $studentC;
    protected $studentD;
    protected $studentE;

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

        // Create Lecturer A (CS Dept)
        $this->lecturerA = User::create([
            'name' => 'Mr. John Doe (Lecturer A)',
            'email' => 'lecturerA@test.com',
            'password' => bcrypt('password123'),
            'status' => 'ACTIVE'
        ]);
        $this->lecturerA->assignRole('Lecturer');
        StaffProfile::create([
            'user_id' => $this->lecturerA->id,
            'department_id' => $this->csDept->id,
            'staff_id' => 'STF/LECT/001',
            'title' => 'MR',
            'phone' => '08022222222',
            'gender' => 'MALE'
        ]);

        // Create Lecturer B (CS Dept)
        $this->lecturerB = User::create([
            'name' => 'Dr. Jane Smith (Lecturer B)',
            'email' => 'lecturerB@test.com',
            'password' => bcrypt('password123'),
            'status' => 'ACTIVE'
        ]);
        $this->lecturerB->assignRole('Lecturer');
        StaffProfile::create([
            'user_id' => $this->lecturerB->id,
            'department_id' => $this->csDept->id,
            'staff_id' => 'STF/LECT/002',
            'title' => 'DR',
            'phone' => '08033333333',
            'gender' => 'FEMALE'
        ]);

        // Courses assigned to Lecturer A
        $this->csc101 = Course::create([
            'code' => 'CSC101',
            'name' => 'Intro to Computer Science',
            'department_id' => $this->csDept->id,
            'lecturer_id' => $this->lecturerA->id,
            'level' => 100,
            'credit_unit' => 3,
            'semester' => 'FIRST',
            'status' => 'ACTIVE'
        ]);

        $this->csc201 = Course::create([
            'code' => 'CSC201',
            'name' => 'Data Structures',
            'department_id' => $this->csDept->id,
            'lecturer_id' => $this->lecturerA->id,
            'level' => 200,
            'credit_unit' => 3,
            'semester' => 'FIRST',
            'status' => 'ACTIVE'
        ]);

        // Course assigned to Lecturer B
        $this->csc401 = Course::create([
            'code' => 'CSC401',
            'name' => 'Compiler Construction',
            'department_id' => $this->csDept->id,
            'lecturer_id' => $this->lecturerB->id,
            'level' => 400,
            'credit_unit' => 3,
            'semester' => 'FIRST',
            'status' => 'ACTIVE'
        ]);

        // Accounting Course
        $this->acc101 = Course::create([
            'code' => 'ACC101',
            'name' => 'Principles of Accounting',
            'department_id' => $this->accDept->id,
            'lecturer_id' => null,
            'level' => 100,
            'credit_unit' => 3,
            'semester' => 'FIRST',
            'status' => 'ACTIVE'
        ]);

        // Student A -> CS Dept, Level 100 (taking CSC101)
        $this->studentA = User::create([
            'name' => 'Student A',
            'email' => 'studentA@test.com',
            'password' => bcrypt('password123'),
            'status' => 'ACTIVE'
        ]);
        $this->studentA->assignRole('Student');
        StudentProfile::create([
            'user_id' => $this->studentA->id,
            'department_id' => $this->csDept->id,
            'matric_number' => 'CSC/2024/001',
            'level' => 100,
            'phone' => '08100000001',
            'gender' => 'MALE'
        ]);

        // Student B -> CS Dept, Level 200 (taking CSC201)
        $this->studentB = User::create([
            'name' => 'Student B',
            'email' => 'studentB@test.com',
            'password' => bcrypt('password123'),
            'status' => 'ACTIVE'
        ]);
        $this->studentB->assignRole('Student');
        StudentProfile::create([
            'user_id' => $this->studentB->id,
            'department_id' => $this->csDept->id,
            'matric_number' => 'CSC/2024/014',
            'level' => 200,
            'phone' => '08100000002',
            'gender' => 'FEMALE'
        ]);

        // Student C -> CS Dept, Level 400 (taking CSC401)
        $this->studentC = User::create([
            'name' => 'Student C',
            'email' => 'studentC@test.com',
            'password' => bcrypt('password123'),
            'status' => 'ACTIVE'
        ]);
        $this->studentC->assignRole('Student');
        StudentProfile::create([
            'user_id' => $this->studentC->id,
            'department_id' => $this->csDept->id,
            'matric_number' => 'CSC/2024/040',
            'level' => 400,
            'phone' => '08100000003',
            'gender' => 'MALE'
        ]);

        // Student D -> Accounting Dept, Level 100
        $this->studentD = User::create([
            'name' => 'Student D',
            'email' => 'studentD@test.com',
            'password' => bcrypt('password123'),
            'status' => 'ACTIVE'
        ]);
        $this->studentD->assignRole('Student');
        StudentProfile::create([
            'user_id' => $this->studentD->id,
            'department_id' => $this->accDept->id,
            'matric_number' => 'ACC/2024/001',
            'level' => 100,
            'phone' => '08100000004',
            'gender' => 'FEMALE'
        ]);

        // Student E -> CS Dept, Level 500
        $this->studentE = User::create([
            'name' => 'Student E',
            'email' => 'studentE@test.com',
            'password' => bcrypt('password123'),
            'status' => 'ACTIVE'
        ]);
        $this->studentE->assignRole('Student');
        StudentProfile::create([
            'user_id' => $this->studentE->id,
            'department_id' => $this->csDept->id,
            'matric_number' => 'CSC/2024/050',
            'level' => 500,
            'phone' => '08100000005',
            'gender' => 'MALE'
        ]);
    }

    /** @test */
    public function test_1_lecturer_student_list_returns_only_assigned_course_students()
    {
        $response = $this->actingAs($this->lecturerA, 'sanctum')
            ->getJson('/api/v1/students');

        $response->assertStatus(200);
        $studentIds = collect($response->json('data'))->pluck('id')->toArray();

        // Lecturer A should see Student A (100L) and Student B (200L)
        $this->assertContains($this->studentA->id, $studentIds);
        $this->assertContains($this->studentB->id, $studentIds);

        // Lecturer A must NOT see Student C (400L), Student D (Accounting), or Student E (500L)
        $this->assertNotContains($this->studentC->id, $studentIds);
        $this->assertNotContains($this->studentD->id, $studentIds);
        $this->assertNotContains($this->studentE->id, $studentIds);
    }

    /** @test */
    public function test_2_lecturer_dashboard_stats_are_scoped_to_assigned_students()
    {
        $response = $this->actingAs($this->lecturerA, 'sanctum')
            ->getJson('/api/v1/dashboard/stats');

        $response->assertStatus(200);

        // Lecturer A has 2 courses and 2 assigned students
        $this->assertEquals(2, $response->json('counters.total_courses'));
        $this->assertEquals(2, $response->json('counters.total_students'));
    }

    /** @test */
    public function test_3_lecturer_cannot_create_students()
    {
        $response = $this->actingAs($this->lecturerA, 'sanctum')
            ->postJson('/api/v1/students', [
                'name' => 'Illegal Student',
                'email' => 'illegalstudent@test.com',
                'password' => 'password123',
                'matric_number' => 'CSC/2026/999',
                'department_id' => $this->csDept->id,
                'level' => 100
            ]);

        $response->assertStatus(403);
    }

    /** @test */
    public function test_4_lecturer_cannot_update_students()
    {
        $response = $this->actingAs($this->lecturerA, 'sanctum')
            ->putJson("/api/v1/students/{$this->studentA->id}", [
                'name' => 'Lecturer Modified Name'
            ]);

        $response->assertStatus(403);
    }

    /** @test */
    public function test_5_lecturer_cannot_delete_students()
    {
        $response = $this->actingAs($this->lecturerA, 'sanctum')
            ->deleteJson("/api/v1/students/{$this->studentA->id}");

        $response->assertStatus(403);
    }

    /** @test */
    public function test_6_lecturer_cannot_access_unassigned_same_department_student()
    {
        // Lecturer A attempts to access Student C (CS Dept 400L)
        $response = $this->actingAs($this->lecturerA, 'sanctum')
            ->getJson("/api/v1/students/{$this->studentC->id}");

        $response->assertStatus(403);
    }

    /** @test */
    public function test_7_lecturer_cannot_access_other_department_student()
    {
        // Lecturer A attempts to access Student D (Accounting Dept)
        $response = $this->actingAs($this->lecturerA, 'sanctum')
            ->getJson("/api/v1/students/{$this->studentD->id}");

        $response->assertStatus(403);
    }

    /** @test */
    public function test_8_lecturer_parameter_tampering_ignored()
    {
        // Lecturer A passes query param for Accounting department
        $response = $this->actingAs($this->lecturerA, 'sanctum')
            ->getJson("/api/v1/students?department_id={$this->accDept->id}");

        $response->assertStatus(200);
        $studentIds = collect($response->json('data'))->pluck('id')->toArray();

        // Accounting students must NOT be returned
        $this->assertNotContains($this->studentD->id, $studentIds);
    }

    /** @test */
    public function test_9_lecturer_specific_course_filtering()
    {
        // Lecturer A filters by CSC101 (100 Level)
        $response = $this->actingAs($this->lecturerA, 'sanctum')
            ->getJson("/api/v1/students?course_id={$this->csc101->id}");

        $response->assertStatus(200);
        $studentIds = collect($response->json('data'))->pluck('id')->toArray();

        // Student A (100L) should be present; Student B (200L) should NOT be present
        $this->assertContains($this->studentA->id, $studentIds);
        $this->assertNotContains($this->studentB->id, $studentIds);
    }

    /** @test */
    public function test_10_super_admin_retains_global_student_access()
    {
        $response = $this->actingAs($this->adminUser, 'sanctum')
            ->getJson('/api/v1/students');

        $response->assertStatus(200);
        $this->assertEquals(5, count($response->json('data')));

        $createResponse = $this->actingAs($this->adminUser, 'sanctum')
            ->postJson('/api/v1/students', [
                'name' => 'New Global Student',
                'email' => 'globalstudent@test.com',
                'password' => 'password123',
                'matric_number' => 'CSC/2026/777',
                'department_id' => $this->csDept->id,
                'level' => 100
            ]);

        $createResponse->assertStatus(201);
    }

    /** @test */
    public function test_11_hod_retains_department_scoped_student_view()
    {
        $response = $this->actingAs($this->hodUser, 'sanctum')
            ->getJson('/api/v1/students');

        $response->assertStatus(200);
        $studentIds = collect($response->json('data'))->pluck('id')->toArray();

        // HOD sees all CS students (A, B, C, E)
        $this->assertContains($this->studentA->id, $studentIds);
        $this->assertContains($this->studentB->id, $studentIds);
        $this->assertContains($this->studentC->id, $studentIds);
        $this->assertContains($this->studentE->id, $studentIds);

        // HOD does NOT see Accounting student (D)
        $this->assertNotContains($this->studentD->id, $studentIds);
    }
}
