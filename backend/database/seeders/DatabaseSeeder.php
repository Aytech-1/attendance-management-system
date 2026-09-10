<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Department;
use App\Models\Course;
use App\Models\AcademicSession;
use App\Models\LectureSession;
use App\Models\StaffProfile;
use App\Models\StudentProfile;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Crypt;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Reset cached roles and permissions
        app(\Spatie\Permission\PermissionRegistrar::class)->forgetCachedPermissions();

        // Create or get Spatie Roles
        $superAdminRole = Role::firstOrCreate(['name' => 'Super Administrator']);
        $adminRole = Role::firstOrCreate(['name' => 'Administrator']);
        $hodRole = Role::firstOrCreate(['name' => 'Head of Department']);
        $lecturerRole = Role::firstOrCreate(['name' => 'Lecturer']);
        $studentRole = Role::firstOrCreate(['name' => 'Student']);

        // Create Default Academic Sessions
        $academicSessionCurrent = AcademicSession::firstOrCreate(
            ['name' => '2025/2026'],
            [
                'start_date' => '2025-09-01',
                'end_date' => '2026-07-31',
                'is_current' => true,
                'status' => 'ACTIVE',
                'description' => 'Current Active Academic Session',
            ]
        );

        AcademicSession::firstOrCreate(
            ['name' => '2024/2025'],
            [
                'start_date' => '2024-09-01',
                'end_date' => '2025-07-31',
                'is_current' => false,
                'status' => 'CONCLUDED',
                'description' => 'Previous Academic Session',
            ]
        );

        // Initial Administrator User (environment-driven in production, default in local/testing)
        $adminEmail = config('app.admin_email', app()->environment('local', 'testing') ? 'admin@gmail.com' : null);
        $adminPassword = config('app.admin_password', app()->environment('local', 'testing') ? 'password' : null);

        if ($adminEmail && $adminPassword) {
            $superAdmin = User::updateOrCreate(
                ['email' => $adminEmail],
                [
                    'name' => 'System Administrator',
                    'password' => Hash::make($adminPassword),
                    'status' => 'ACTIVE',
                ]
            );
            $superAdmin->syncRoles([$superAdminRole, $adminRole]);

            StaffProfile::updateOrCreate(
                ['user_id' => $superAdmin->id],
                [
                    'staff_id' => 'STAFF000',
                    'title' => 'ENGR',
                    'phone' => '08012345678',
                    'gender' => 'MALE',
                ]
            );
        }

        // Demo / Development Seeding (only executed in local or testing environments)
        if (app()->environment('local', 'testing')) {
            $cscDept = Department::firstOrCreate(
                ['code' => 'CSC'],
                ['name' => 'COMPUTER SCIENCE', 'status' => 'ACTIVE']
            );

            $mthDept = Department::firstOrCreate(
                ['code' => 'MTH'],
                ['name' => 'MATHEMATICS', 'status' => 'ACTIVE']
            );

            $hodUser = User::updateOrCreate(
                ['email' => 'hod@instit.edu'],
                [
                    'name' => 'Dr. Sarah Connor',
                    'password' => Hash::make('password'),
                    'status' => 'ACTIVE',
                ]
            );
            $hodUser->syncRoles([$hodRole]);

            StaffProfile::updateOrCreate(
                ['user_id' => $hodUser->id],
                [
                    'department_id' => $cscDept->id,
                    'staff_id' => 'STAFF002',
                    'title' => 'DR',
                    'phone' => '08022223333',
                    'gender' => 'FEMALE',
                ]
            );

            $lecturerUser = User::updateOrCreate(
                ['email' => 'lecturer@instit.edu'],
                [
                    'name' => 'Mr. John Doe',
                    'password' => Hash::make('password'),
                    'status' => 'ACTIVE',
                ]
            );
            $lecturerUser->syncRoles([$lecturerRole]);

            StaffProfile::updateOrCreate(
                ['user_id' => $lecturerUser->id],
                [
                    'department_id' => $cscDept->id,
                    'staff_id' => 'STAFF003',
                    'title' => 'MR',
                    'phone' => '08033334444',
                    'gender' => 'MALE',
                ]
            );

            $cscCourse = Course::firstOrCreate(
                ['code' => 'CSC101'],
                [
                    'name' => 'INTRO TO COMPUTER',
                    'department_id' => $cscDept->id,
                    'lecturer_id' => $lecturerUser->id,
                    'level' => 100,
                    'credit_unit' => 3,
                    'semester' => 'FIRST',
                    'status' => 'ACTIVE',
                ]
            );

            $mthCourse = Course::firstOrCreate(
                ['code' => 'MTH102'],
                [
                    'name' => 'CALCULUS I',
                    'department_id' => $cscDept->id,
                    'lecturer_id' => $hodUser->id,
                    'level' => 100,
                    'credit_unit' => 2,
                    'semester' => 'SECOND',
                    'status' => 'ACTIVE',
                ]
            );

            $studentUser = User::updateOrCreate(
                ['email' => 'student@instit.edu'],
                [
                    'name' => 'Ogunleye Opeyemi',
                    'password' => Hash::make('password'),
                    'status' => 'ACTIVE',
                ]
            );
            $studentUser->syncRoles([$studentRole]);

            StudentProfile::updateOrCreate(
                ['user_id' => $studentUser->id],
                [
                    'department_id' => $cscDept->id,
                    'matric_number' => '4543432345',
                    'level' => 100,
                    'phone' => '09055556666',
                    'gender' => 'MALE',
                ]
            );

            $tokenPayload = json_encode([
                'session_id' => 1,
                'course_code' => $cscCourse->code,
                'academic_session_id' => $academicSessionCurrent->id,
                'timestamp' => time(),
                'static' => true,
            ]);

            LectureSession::firstOrCreate(
                ['course_id' => $cscCourse->id, 'date' => date('Y-m-d')],
                [
                    'department_id' => $cscDept->id,
                    'academic_session_id' => $academicSessionCurrent->id,
                    'lecturer_id' => $lecturerUser->id,
                    'start_time' => '08:00:00',
                    'end_time' => '23:59:00',
                    'location' => 'Lecture Theater 1',
                    'token' => Crypt::encryptString($tokenPayload),
                    'status' => 'ACTIVE',
                ]
            );
        }
    }
}
