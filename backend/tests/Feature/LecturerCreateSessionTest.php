<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use App\Models\User;
use App\Models\Department;
use App\Models\Course;
use App\Models\AcademicSession;
use App\Models\StaffProfile;
use Spatie\Permission\Models\Role;

class LecturerCreateSessionTest extends TestCase
{
    use RefreshDatabase;

    protected $adminUser;
    protected $lecturerA;
    protected $lecturerB;
    protected $csDept;
    protected $accDept;
    protected $csc101;
    protected $csc201;
    protected $acc101;
    protected $currentAcademic;

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

        // Create Academic Session
        $this->currentAcademic = AcademicSession::create([
            'name' => '2025/2026',
            'code' => '2025/2026',
            'start_date' => '2025-09-01',
            'end_date' => '2026-07-31',
            'is_current' => true,
            'status' => 'ACTIVE'
        ]);

        // Create Super Admin
        $this->adminUser = User::create([
            'name' => 'Super Admin',
            'email' => 'admin@test.com',
            'password' => bcrypt('password123'),
            'status' => 'ACTIVE'
        ]);
        $this->adminUser->assignRole('Super Administrator');

        // Create Lecturer A (CS Dept)
        $this->lecturerA = User::create([
            'name' => 'Dr. Lecturer A',
            'email' => 'lecturerA@test.com',
            'password' => bcrypt('password123'),
            'status' => 'ACTIVE'
        ]);
        $this->lecturerA->assignRole('Lecturer');
        StaffProfile::create([
            'user_id' => $this->lecturerA->id,
            'department_id' => $this->csDept->id,
            'staff_id' => 'STF/LECT/001',
            'title' => 'DR',
            'phone' => '08022222222',
            'gender' => 'MALE'
        ]);

        // Create Lecturer B (CS Dept)
        $this->lecturerB = User::create([
            'name' => 'Prof. Lecturer B',
            'email' => 'lecturerB@test.com',
            'password' => bcrypt('password123'),
            'status' => 'ACTIVE'
        ]);
        $this->lecturerB->assignRole('Lecturer');
        StaffProfile::create([
            'user_id' => $this->lecturerB->id,
            'department_id' => $this->csDept->id,
            'staff_id' => 'STF/LECT/002',
            'title' => 'PROF',
            'phone' => '08033333333',
            'gender' => 'FEMALE'
        ]);

        // Courses
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
            'lecturer_id' => $this->lecturerB->id,
            'level' => 200,
            'credit_unit' => 3,
            'semester' => 'FIRST',
            'status' => 'ACTIVE'
        ]);

        $this->acc101 = Course::create([
            'code' => 'ACC101',
            'name' => 'Financial Accounting',
            'department_id' => $this->accDept->id,
            'lecturer_id' => null,
            'level' => 100,
            'credit_unit' => 3,
            'semester' => 'FIRST',
            'status' => 'ACTIVE'
        ]);
    }

    /** @test */
    public function test_1_lecturer_create_session_automatically_associates_identity_and_department()
    {
        // Lecturer A creates session without sending department_id or lecturer_id
        $response = $this->actingAs($this->lecturerA, 'sanctum')
            ->postJson('/api/v1/sessions', [
                'course_id' => $this->csc101->id,
                'date' => '2026-08-20',
                'start_time' => '09:00',
                'end_time' => '11:00',
                'location' => 'Lecture Hall A',
            ]);

        $response->assertStatus(201);
        $this->assertEquals($this->lecturerA->id, $response->json('lecturer_id'));
        $this->assertEquals($this->csDept->id, $response->json('department_id'));
    }

    /** @test */
    public function test_2_lecturer_cannot_tamper_lecturer_id()
    {
        // Lecturer A sends payload with Lecturer B's ID
        $response = $this->actingAs($this->lecturerA, 'sanctum')
            ->postJson('/api/v1/sessions', [
                'course_id' => $this->csc101->id,
                'lecturer_id' => $this->lecturerB->id, // Tampered ID
                'date' => '2026-08-20',
                'start_time' => '09:00',
                'end_time' => '11:00',
                'location' => 'Lecture Hall A',
            ]);

        $response->assertStatus(201);

        // Backend must override and enforce Lecturer A's identity
        $this->assertEquals($this->lecturerA->id, $response->json('lecturer_id'));
        $this->assertNotEquals($this->lecturerB->id, $response->json('lecturer_id'));
    }

    /** @test */
    public function test_3_lecturer_cannot_tamper_department_id()
    {
        // Lecturer A sends payload with Accounting Dept ID
        $response = $this->actingAs($this->lecturerA, 'sanctum')
            ->postJson('/api/v1/sessions', [
                'course_id' => $this->csc101->id,
                'department_id' => $this->accDept->id, // Tampered Dept ID
                'date' => '2026-08-20',
                'start_time' => '09:00',
                'end_time' => '11:00',
                'location' => 'Lecture Hall A',
            ]);

        $response->assertStatus(201);

        // Backend must override and enforce Lecturer A's CS department ID
        $this->assertEquals($this->csDept->id, $response->json('department_id'));
        $this->assertNotEquals($this->accDept->id, $response->json('department_id'));
    }

    /** @test */
    public function test_4_lecturer_cannot_create_session_for_unassigned_course()
    {
        // Lecturer A attempts to create session for CSC201 (assigned to Lecturer B)
        $response = $this->actingAs($this->lecturerA, 'sanctum')
            ->postJson('/api/v1/sessions', [
                'course_id' => $this->csc201->id,
                'date' => '2026-08-20',
                'start_time' => '09:00',
                'end_time' => '11:00',
                'location' => 'Lecture Hall B',
            ]);

        $response->assertStatus(403);
    }

    /** @test */
    public function test_5_admin_can_create_session_with_full_assignments()
    {
        // Admin creates session specifying department, course, and lecturer
        $response = $this->actingAs($this->adminUser, 'sanctum')
            ->postJson('/api/v1/sessions', [
                'department_id' => $this->csDept->id,
                'course_id' => $this->csc201->id,
                'lecturer_id' => $this->lecturerB->id,
                'date' => '2026-08-21',
                'start_time' => '14:00',
                'end_time' => '16:00',
                'location' => 'Auditorium 1',
            ]);

        $response->assertStatus(201);
        $this->assertEquals($this->lecturerB->id, $response->json('lecturer_id'));
        $this->assertEquals($this->csDept->id, $response->json('department_id'));
    }
}
