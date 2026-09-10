<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Department;
use App\Models\Course;
use App\Models\AcademicSession;
use App\Models\LectureSession;
use App\Models\Attendance;
use App\Models\StaffProfile;
use App\Models\StudentProfile;
use Spatie\Permission\Models\Role;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Foundation\Testing\RefreshDatabase;

class AcademicAttendanceWorkflowTest extends TestCase
{
    use RefreshDatabase;

    protected $adminUser;
    protected $lecturerUser;
    protected $studentUser;
    protected $otherStudentUser;
    protected $department;
    protected $otherDepartment;
    protected $course;
    protected $academicSession;

    protected function setUp(): void
    {
        parent::setUp();

        // Ensure roles exist
        Role::firstOrCreate(['name' => 'Administrator']);
        Role::firstOrCreate(['name' => 'Super Administrator']);
        Role::firstOrCreate(['name' => 'Head of Department']);
        Role::firstOrCreate(['name' => 'Lecturer']);
        Role::firstOrCreate(['name' => 'Student']);

        // 1. Departments
        $this->department = Department::firstOrCreate(
            ['code' => 'CSC_TEST'],
            ['name' => 'COMPUTER SCIENCE TEST', 'status' => 'ACTIVE']
        );

        $this->otherDepartment = Department::firstOrCreate(
            ['code' => 'ENG_TEST'],
            ['name' => 'ENGINEERING TEST', 'status' => 'ACTIVE']
        );

        // 2. Academic Session
        $this->academicSession = AcademicSession::firstOrCreate(
            ['name' => '2025/2026_TEST'],
            [
                'start_date' => '2025-09-01',
                'end_date' => '2026-07-31',
                'is_current' => true,
                'status' => 'ACTIVE',
            ]
        );

        // 3. Admin User
        $this->adminUser = User::firstOrCreate(
            ['email' => 'admin_test@instit.edu'],
            ['name' => 'Admin Test', 'password' => Hash::make('password'), 'status' => 'ACTIVE']
        );
        $this->adminUser->syncRoles(['Super Administrator', 'Administrator']);

        // 4. Lecturer User
        $this->lecturerUser = User::firstOrCreate(
            ['email' => 'lecturer_test@instit.edu'],
            ['name' => 'Lecturer Test', 'password' => Hash::make('password'), 'status' => 'ACTIVE']
        );
        $this->lecturerUser->syncRoles(['Lecturer']);
        StaffProfile::updateOrCreate(
            ['user_id' => $this->lecturerUser->id],
            ['department_id' => $this->department->id, 'staff_id' => 'STF_TEST_01']
        );

        // 5. Course
        $this->course = Course::firstOrCreate(
            ['code' => 'CSC999'],
            [
                'name' => 'ADVANCED TESTING',
                'department_id' => $this->department->id,
                'lecturer_id' => $this->lecturerUser->id,
                'level' => 400,
                'credit_unit' => 3,
                'semester' => 'FIRST',
                'status' => 'ACTIVE',
            ]
        );

        // 6. Student User (CSC Department)
        $this->studentUser = User::firstOrCreate(
            ['email' => 'student_test@instit.edu'],
            ['name' => 'Student Test', 'password' => Hash::make('password'), 'status' => 'ACTIVE']
        );
        $this->studentUser->syncRoles(['Student']);
        StudentProfile::updateOrCreate(
            ['user_id' => $this->studentUser->id],
            ['department_id' => $this->department->id, 'matric_number' => 'MAT_TEST_001', 'level' => 400]
        );

        // 7. Other Student User (ENG Department)
        $this->otherStudentUser = User::firstOrCreate(
            ['email' => 'other_student_test@instit.edu'],
            ['name' => 'Other Student Test', 'password' => Hash::make('password'), 'status' => 'ACTIVE']
        );
        $this->otherStudentUser->syncRoles(['Student']);
        StudentProfile::updateOrCreate(
            ['user_id' => $this->otherStudentUser->id],
            ['department_id' => $this->otherDepartment->id, 'matric_number' => 'MAT_TEST_002', 'level' => 400]
        );
    }

    /** Test 1: Admin can create and list academic sessions */
    public function test_admin_can_create_and_list_academic_sessions()
    {
        $response = $this->actingAs($this->adminUser)
            ->postJson('/api/v1/academic-sessions', [
                'name' => '2026/2027_AUTOMATED',
                'start_date' => '2026-09-01',
                'end_date' => '2027-07-31',
                'is_current' => false,
                'status' => 'ACTIVE',
            ]);

        $response->assertStatus(201)
            ->assertJsonFragment(['name' => '2026/2027_AUTOMATED']);

        $list = $this->actingAs($this->adminUser)->getJson('/api/v1/academic-sessions');
        $list->assertStatus(200);
    }

    /** Test 2: Activation sets single active session */
    public function test_academic_session_activation()
    {
        $newSession = AcademicSession::create([
            'name' => '2027/2028_ACTIVE_TEST',
            'is_current' => false,
            'status' => 'ACTIVE',
        ]);

        $response = $this->actingAs($this->adminUser)
            ->postJson("/api/v1/academic-sessions/{$newSession->id}/activate");

        $response->assertStatus(200);
        $this->assertTrue(AcademicSession::find($newSession->id)->is_current);
    }

    /** Test 3: Create lecture session linked to active academic session */
    public function test_lecture_session_creation_with_academic_session()
    {
        $response = $this->actingAs($this->lecturerUser)
            ->postJson('/api/v1/sessions', [
                'course_id' => $this->course->id,
                'department_id' => $this->department->id,
                'academic_session_id' => $this->academicSession->id,
                'lecturer_id' => $this->lecturerUser->id,
                'date' => date('Y-m-d'),
                'start_time' => '00:00:00',
                'end_time' => '23:59:59',
                'location' => 'Main Auditorium',
            ]);

        $response->assertStatus(201)
            ->assertJsonFragment(['location' => 'Main Auditorium']);
    }

    /** Test 4: QR token generation produces valid encrypted payload */
    public function test_qr_token_generation()
    {
        $session = LectureSession::create([
            'course_id' => $this->course->id,
            'department_id' => $this->department->id,
            'academic_session_id' => $this->academicSession->id,
            'lecturer_id' => $this->lecturerUser->id,
            'date' => date('Y-m-d'),
            'start_time' => '00:00:00',
            'end_time' => '23:59:59',
            'location' => 'Hall 1',
            'status' => 'ACTIVE',
        ]);

        $response = $this->actingAs($this->lecturerUser)
            ->postJson("/api/v1/sessions/{$session->id}/qr-token");

        $response->assertStatus(200)
            ->assertJsonStructure(['session_id', 'token', 'qr_code_url']);

        $token = $response->json('token');
        $decrypted = json_decode(Crypt::decryptString($token), true);
        $this->assertEquals($session->id, $decrypted['session_id']);
    }

    /** Test 5: Student can successfully mark attendance */
    public function test_student_attendance_scan_success()
    {
        $session = LectureSession::create([
            'course_id' => $this->course->id,
            'department_id' => $this->department->id,
            'academic_session_id' => $this->academicSession->id,
            'lecturer_id' => $this->lecturerUser->id,
            'date' => date('Y-m-d'),
            'start_time' => '00:00:00',
            'end_time' => '23:59:59',
            'location' => 'Room 101',
            'status' => 'ACTIVE',
        ]);

        $token = Crypt::encryptString(json_encode([
            'session_id' => $session->id,
            'course_code' => $this->course->code,
            'academic_session_id' => $this->academicSession->id,
            'timestamp' => time(),
        ]));

        $response = $this->actingAs($this->studentUser)
            ->postJson('/api/v1/attendance/scan', ['token' => $token]);

        $response->assertStatus(200)
            ->assertJsonFragment(['success' => true]);

        $this->assertDatabaseHas('attendances', [
            'student_id' => $this->studentUser->id,
            'lecture_session_id' => $session->id,
        ]);
    }

    /** Test 6: Duplicate attendance scan is rejected with 409 Conflict */
    public function test_duplicate_attendance_scan_rejected()
    {
        $session = LectureSession::create([
            'course_id' => $this->course->id,
            'department_id' => $this->department->id,
            'academic_session_id' => $this->academicSession->id,
            'lecturer_id' => $this->lecturerUser->id,
            'date' => date('Y-m-d'),
            'start_time' => '00:00:00',
            'end_time' => '23:59:59',
            'location' => 'Room 102',
            'status' => 'ACTIVE',
        ]);

        $token = Crypt::encryptString(json_encode([
            'session_id' => $session->id,
            'timestamp' => time(),
        ]));

        // First scan
        $this->actingAs($this->studentUser)
            ->postJson('/api/v1/attendance/scan', ['token' => $token])
            ->assertStatus(200);

        // Second duplicate scan
        $secondResponse = $this->actingAs($this->studentUser)
            ->postJson('/api/v1/attendance/scan', ['token' => $token]);

        $secondResponse->assertStatus(409);
    }

    /** Test 7: Scan rejected when academic session is inactive */
    public function test_inactive_academic_session_scan_rejected()
    {
        $inactiveAcademic = AcademicSession::create([
            'name' => '2020/2021_OLD',
            'is_current' => false,
            'status' => 'CONCLUDED',
        ]);

        $session = LectureSession::create([
            'course_id' => $this->course->id,
            'department_id' => $this->department->id,
            'academic_session_id' => $inactiveAcademic->id,
            'lecturer_id' => $this->lecturerUser->id,
            'date' => date('Y-m-d'),
            'start_time' => '00:00:00',
            'end_time' => '23:59:59',
            'location' => 'Room 103',
            'status' => 'ACTIVE',
        ]);

        $token = Crypt::encryptString(json_encode([
            'session_id' => $session->id,
            'timestamp' => time(),
        ]));

        $response = $this->actingAs($this->studentUser)
            ->postJson('/api/v1/attendance/scan', ['token' => $token]);

        $response->assertStatus(400);
    }

    /** Test 8: Scan rejected when student is from different department */
    public function test_student_from_different_department_rejected()
    {
        $session = LectureSession::create([
            'course_id' => $this->course->id,
            'department_id' => $this->department->id,
            'academic_session_id' => $this->academicSession->id,
            'lecturer_id' => $this->lecturerUser->id,
            'date' => date('Y-m-d'),
            'start_time' => '00:00:00',
            'end_time' => '23:59:59',
            'location' => 'Room 104',
            'status' => 'ACTIVE',
        ]);

        $token = Crypt::encryptString(json_encode([
            'session_id' => $session->id,
            'timestamp' => time(),
        ]));

        $response = $this->actingAs($this->otherStudentUser)
            ->postJson('/api/v1/attendance/scan', ['token' => $token]);

        $response->assertStatus(403);
    }

    /** Test 9: Lecturer cannot end or generate QR for another lecturer session (IDOR Protection) */
    public function test_lecturer_cannot_modify_other_lecturer_session()
    {
        $otherLecturer = User::create([
            'name' => 'Other Lecturer',
            'email' => 'other_lecturer@instit.edu',
            'password' => Hash::make('password'),
            'status' => 'ACTIVE',
        ]);
        $otherLecturer->assignRole('Lecturer');

        $session = LectureSession::create([
            'course_id' => $this->course->id,
            'department_id' => $this->department->id,
            'academic_session_id' => $this->academicSession->id,
            'lecturer_id' => $otherLecturer->id,
            'date' => date('Y-m-d'),
            'start_time' => '00:00:00',
            'end_time' => '23:59:59',
            'location' => 'Room 105',
            'status' => 'ACTIVE',
        ]);

        $response = $this->actingAs($this->lecturerUser)
            ->postJson("/api/v1/sessions/{$session->id}/end");

        $response->assertStatus(403);
    }

    /** Test 10: Deletion protection on academic session with dependent records */
    public function test_cannot_delete_academic_session_with_dependent_records()
    {
        $session = LectureSession::create([
            'course_id' => $this->course->id,
            'department_id' => $this->department->id,
            'academic_session_id' => $this->academicSession->id,
            'lecturer_id' => $this->lecturerUser->id,
            'date' => date('Y-m-d'),
            'start_time' => '00:00:00',
            'end_time' => '23:59:59',
            'location' => 'Room 106',
            'status' => 'ACTIVE',
        ]);

        $response = $this->actingAs($this->adminUser)
            ->deleteJson("/api/v1/academic-sessions/{$this->academicSession->id}");

        $response->assertStatus(422);
    }

    /** Test 11: Scan rejected when session is scheduled for future time */
    public function test_future_session_scan_rejected()
    {
        $session = LectureSession::create([
            'course_id' => $this->course->id,
            'department_id' => $this->department->id,
            'academic_session_id' => $this->academicSession->id,
            'lecturer_id' => $this->lecturerUser->id,
            'date' => date('Y-m-d'),
            'start_time' => '23:50:00',
            'end_time' => '23:59:59',
            'location' => 'Room 107',
            'status' => 'ACTIVE',
        ]);

        $token = Crypt::encryptString(json_encode([
            'session_id' => $session->id,
            'timestamp' => time(),
        ]));

        $response = $this->actingAs($this->studentUser)
            ->postJson('/api/v1/attendance/scan', ['token' => $token]);

        $response->assertStatus(400)
            ->assertJsonFragment(['message' => "Attendance session has not started. Please wait until 23:50:00."]);
    }
}
