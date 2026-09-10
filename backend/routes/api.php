<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\AcademicSessionController;
use App\Http\Controllers\Api\DepartmentController;
use App\Http\Controllers\Api\CourseController;
use App\Http\Controllers\Api\StaffController;
use App\Http\Controllers\Api\StudentController;
use App\Http\Controllers\Api\LectureSessionController;
use App\Http\Controllers\Api\AttendanceController;
use App\Http\Controllers\Api\DashboardController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// Health check endpoint (Public)
Route::prefix('v1')->group(function () {
    Route::get('/health', function () {
        return response()->json([
            'status' => 'ok',
            'timestamp' => now()->toIso8601String(),
            'service' => 'attendance-api'
        ]);
    });
});

// Public Routes (Rate limited to 60 requests/min, with 5 attempts/min on login to prevent brute force)
Route::prefix('v1')->middleware('throttle:60,1')->group(function () {
    Route::post('/auth/login', [AuthController::class, 'login'])->middleware('throttle:5,1');
    Route::post('/auth/forgot-password', [AuthController::class, 'forgotPassword'])->middleware('throttle:5,1');
    Route::post('/auth/reset-password', [AuthController::class, 'resetPassword']);
    Route::post('/auth/student-register', [StudentController::class, 'publicRegister']);
});

// Protected Routes
Route::prefix('v1')->middleware('auth:sanctum')->group(function () {
    // Authentication
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/profile', [AuthController::class, 'profile']);
    Route::post('/auth/change-password', [AuthController::class, 'changePassword']);

    // Dashboard Statistics
    Route::get('/dashboard/stats', [DashboardController::class, 'stats']);

    // Academic Sessions CRUD & Activation
    Route::get('/academic-sessions', [AcademicSessionController::class, 'index']);
    Route::get('/academic-sessions/current', [AcademicSessionController::class, 'current']);
    Route::post('/academic-sessions', [AcademicSessionController::class, 'store']);
    Route::get('/academic-sessions/{id}', [AcademicSessionController::class, 'show']);
    Route::put('/academic-sessions/{id}', [AcademicSessionController::class, 'update']);
    Route::post('/academic-sessions/{id}/activate', [AcademicSessionController::class, 'activate']);
    Route::delete('/academic-sessions/{id}', [AcademicSessionController::class, 'destroy']);

    // Departments CRUD
    Route::get('/departments', [DepartmentController::class, 'index']);
    Route::post('/departments', [DepartmentController::class, 'store']);
    Route::get('/departments/{id}', [DepartmentController::class, 'show']);
    Route::put('/departments/{id}', [DepartmentController::class, 'update']);
    Route::delete('/departments/{id}', [DepartmentController::class, 'destroy']);
    Route::post('/departments/{id}/archive', [DepartmentController::class, 'archive']);
    Route::post('/departments/{id}/restore', [DepartmentController::class, 'restore']);

    // Courses CRUD
    Route::get('/courses', [CourseController::class, 'index']);
    Route::post('/courses', [CourseController::class, 'store']);
    Route::get('/courses/{id}', [CourseController::class, 'show']);
    Route::put('/courses/{id}', [CourseController::class, 'update']);
    Route::delete('/courses/{id}', [CourseController::class, 'destroy']);

    // Staff CRUD
    Route::get('/staff', [StaffController::class, 'index']);
    Route::post('/staff', [StaffController::class, 'store']);
    Route::get('/staff/{id}', [StaffController::class, 'show']);
    Route::put('/staff/{id}', [StaffController::class, 'update']);
    Route::delete('/staff/{id}', [StaffController::class, 'destroy']);

    // Students CRUD
    Route::get('/students', [StudentController::class, 'index']);
    Route::post('/students', [StudentController::class, 'store']);
    Route::get('/students/{id}', [StudentController::class, 'show']);
    Route::put('/students/{id}', [StudentController::class, 'update']);
    Route::delete('/students/{id}', [StudentController::class, 'destroy']);

    // Lecture Sessions CRUD
    Route::get('/sessions', [LectureSessionController::class, 'index']);
    Route::post('/sessions', [LectureSessionController::class, 'store']);
    Route::get('/sessions/{id}', [LectureSessionController::class, 'show']);
    Route::post('/sessions/{id}/qr-token', [LectureSessionController::class, 'generateQrToken']);
    Route::post('/sessions/{id}/end', [LectureSessionController::class, 'endSession']);

    // Attendance Operations (Scanning throttled to 10 attempts/min per student)
    Route::post('/attendance/scan', [AttendanceController::class, 'scan'])->middleware('throttle:10,1');
    Route::get('/attendance/history', [AttendanceController::class, 'history']);
    Route::get('/attendance/live/{session_id}', [AttendanceController::class, 'live']);
    Route::get('/attendance/export', [AttendanceController::class, 'export']);
});
