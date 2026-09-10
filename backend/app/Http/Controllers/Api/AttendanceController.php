<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\LectureSession;
use App\Models\Attendance;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Symfony\Component\HttpFoundation\StreamedResponse;

class AttendanceController extends Controller
{
    /**
     * Scan secure QR code and mark attendance.
     */
    public function scan(Request $request)
    {
        $input = $request->all();
        $input['latitude'] = ($request->has('latitude') && $request->latitude !== '' && $request->latitude !== null) ? $request->latitude : null;
        $input['longitude'] = ($request->has('longitude') && $request->longitude !== '' && $request->longitude !== null) ? $request->longitude : null;

        $validator = Validator::make($input, [
            'token' => 'required|string',
            'latitude' => 'nullable|numeric|between:-90,90',
            'longitude' => 'nullable|numeric|between:-180,180',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $user = $request->user();
        if (!$user || !$user->hasRole('Student')) {
            return response()->json(['message' => 'Only students are authorized to scan and mark attendance.'], 403);
        }

        $profile = $user->studentProfile;
        if (!$profile) {
            return response()->json(['message' => 'Student profile not found. Please contact administration.'], 404);
        }

        if ($user->status !== 'ACTIVE') {
            return response()->json(['message' => 'Your student account is suspended or inactive.'], 403);
        }

        // 1. Decrypt secure token payload
        try {
            $decryptedPayload = Crypt::decryptString($request->token);
            $data = json_decode($decryptedPayload, true);
        } catch (\Exception $e) {
            AuditLog::create([
                'user_id' => $user->id,
                'action' => 'ATTENDANCE_SCAN_FAILED',
                'description' => "Student {$user->email} submitted an invalid or tampered QR token.",
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
            ]);
            return response()->json(['message' => 'Invalid QR Code. Please scan a valid classroom QR Code.'], 400);
        }

        $sessionId = $data['session_id'] ?? null;
        if (!$sessionId) {
            return response()->json(['message' => 'Invalid QR Code token structure.'], 400);
        }

        // Validate token freshness for dynamic rotating QR codes
        $isStaticToken = isset($data['static']) && $data['static'] === true;
        if (!$isStaticToken && isset($data['timestamp'])) {
            $tokenAge = time() - (int)$data['timestamp'];
            if ($tokenAge > 60 || $tokenAge < -10) {
                AuditLog::create([
                    'user_id' => $user->id,
                    'action' => 'ATTENDANCE_SCAN_FAILED',
                    'description' => "Student {$user->email} submitted an expired dynamic QR token (age: {$tokenAge}s).",
                    'ip_address' => $request->ip(),
                    'user_agent' => $request->userAgent(),
                ]);
                return response()->json(['message' => 'QR Code has expired. Please scan the current live QR Code projected in class.'], 400);
            }
        }

        // 2. Fetch and Validate Lecture Session
        $session = LectureSession::with(['course', 'department', 'academicSession'])->find($sessionId);
        if (!$session) {
            return response()->json(['message' => 'Lecture session not found.'], 404);
        }

        if ($session->status !== 'ACTIVE') {
            return response()->json(['message' => 'This lecture session is closed or inactive.'], 400);
        }

        // 3. Validate Academic Session Status
        if ($session->academicSession && $session->academicSession->status !== 'ACTIVE') {
            return response()->json([
                'message' => "This lecture session belongs to an inactive academic session ({$session->academicSession->name})."
            ], 400);
        }

        // 4. Time Window Validation
        $currentTimestamp = time();
        $sessionDateStr = $session->date ? $session->date->format('Y-m-d') : date('Y-m-d');
        
        $sessionStartTime = strtotime("{$sessionDateStr} {$session->start_time}");
        $sessionEndTime = strtotime("{$sessionDateStr} {$session->end_time}");

        // If today is not session date and session date is strictly enforced
        if ($session->date && date('Y-m-d') !== $sessionDateStr) {
            return response()->json([
                'message' => "This lecture session was scheduled for {$sessionDateStr} and is not active today."
            ], 400);
        }

        // Check if session has not started (allow 5-min early buffer)
        if ($sessionStartTime && ($currentTimestamp < ($sessionStartTime - 300))) {
            return response()->json([
                'message' => "Attendance session has not started. Please wait until {$session->start_time}."
            ], 400);
        }

        // Check if session has closed (allow 5-min grace period)
        if ($sessionEndTime && ($currentTimestamp > ($sessionEndTime + 300))) {
            return response()->json([
                'message' => "Attendance session has closed for this lecture."
            ], 400);
        }

        // 5. Student Eligibility & Department Match
        if ($profile->department_id && $session->department_id && $profile->department_id !== $session->department_id) {
            return response()->json([
                'message' => 'You are not enrolled in the department hosting this lecture session.'
            ], 403);
        }

        // 6. Duplicate Attendance Prevention
        $alreadyMarked = Attendance::where('student_id', $user->id)
                                    ->where('lecture_session_id', $session->id)
                                    ->exists();

        if ($alreadyMarked) {
            return response()->json([
                'message' => 'Attendance has already been recorded for this session.'
            ], 409);
        }

        // 7. Optional Geofence Validation
        if ($request->latitude !== null && $request->longitude !== null && $session->latitude !== null && $session->longitude !== null) {
            $distance = $this->calculateDistance(
                $session->latitude,
                $session->longitude,
                $request->latitude,
                $request->longitude
            );

            if ($distance > $session->geofence_radius) {
                AuditLog::create([
                    'user_id' => $user->id,
                    'action' => 'ATTENDANCE_SCAN_FAILED',
                    'description' => "Student {$user->email} failed geofence check (distance: {$distance}m, allowed: {$session->geofence_radius}m).",
                    'ip_address' => $request->ip(),
                    'user_agent' => $request->userAgent(),
                ]);
                return response()->json(['message' => "You are too far from the classroom location to mark attendance."], 400);
            }
        }

        // 8. Determine Status: PRESENT vs LATE (Late threshold: 15 mins after start time)
        $attendanceStatus = 'PRESENT';
        if ($sessionStartTime && ($currentTimestamp > ($sessionStartTime + (15 * 60)))) {
            $attendanceStatus = 'LATE';
        }

        // 9. Persist Attendance Record
        try {
            $attendance = Attendance::create([
                'lecture_session_id' => $session->id,
                'student_id' => $user->id,
                'status' => $attendanceStatus,
                'scanned_at' => now(),
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
                'latitude' => $request->latitude,
                'longitude' => $request->longitude,
                'method' => 'QR_CODE'
            ]);

            AuditLog::create([
                'user_id' => $user->id,
                'action' => 'ATTENDANCE_MARKED',
                'description' => "Student {$user->name} ({$profile->matric_number}) marked {$attendanceStatus} for course {$session->course->code}.",
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
            ]);

            $courseCode = $session->course->code ?? 'Course';
            $statusLabel = $attendanceStatus === 'LATE' ? 'LATE' : 'PRESENT';

            return response()->json([
                'success' => true,
                'message' => "Attendance marked {$statusLabel} successfully for {$courseCode}!",
                'attendance' => $attendance->load('lectureSession.course'),
            ], 200);

        } catch (\Illuminate\Database\QueryException $e) {
            // Catch database unique constraint violation gracefully
            if ($e->getCode() == 23000 || str_contains($e->getMessage(), 'Duplicate entry')) {
                return response()->json([
                    'message' => 'Attendance has already been recorded for this session.'
                ], 409);
            }
            return response()->json(['message' => 'Failed to record attendance. Please try again.'], 500);
        }
    }

    /**
     * Get attendance history for logged in user or admin/HOD/lecturer logs.
     */
    public function history(Request $request)
    {
        $user = $request->user();

        if ($user->hasRole('Student')) {
            $attendances = Attendance::where('student_id', $user->id)
                ->with(['lectureSession.course.department', 'lectureSession.lecturer', 'lectureSession.academicSession'])
                ->orderBy('scanned_at', 'desc')
                ->get();

            return response()->json([
                'total' => $attendances->count(),
                'data' => $attendances,
            ]);
        }

        $query = Attendance::with([
            'student.studentProfile.department',
            'lectureSession.course.department',
            'lectureSession.lecturer',
            'lectureSession.academicSession'
        ])->orderBy('scanned_at', 'desc');

        // Scoping for Head of Department (HOD)
        if ($user && ($user->hasRole('Head of Department') || $user->role === 'Head of Department')) {
            $hodDeptId = $user->staffProfile->department_id ?? null;
            if ($hodDeptId) {
                $query->whereHas('student.studentProfile', function ($q) use ($hodDeptId) {
                    $q->where('department_id', $hodDeptId);
                });
            }
        }

        // Scoping for Lecturer
        if ($user && ($user->hasRole('Lecturer') || $user->role === 'Lecturer')) {
            $query->whereHas('lectureSession', function ($q) use ($user) {
                $q->where('lecturer_id', $user->id);
            });
        }

        if ($request->has('academic_session_id') && !empty($request->academic_session_id)) {
            $acadId = $request->academic_session_id;
            $query->whereHas('lectureSession', function ($q) use ($acadId) {
                $q->where('academic_session_id', $acadId);
            });
        }

        if ($request->has('session_id') && !empty($request->session_id)) {
            $query->where('lecture_session_id', $request->session_id);
        }

        if ($request->has('department_id') && !empty($request->department_id)) {
            $deptId = $request->department_id;
            $query->whereHas('student.studentProfile', function ($q) use ($deptId) {
                $q->where('department_id', $deptId);
            });
        }

        if ($request->has('course_id') && !empty($request->course_id)) {
            $courseId = $request->course_id;
            $query->whereHas('lectureSession', function ($q) use ($courseId) {
                $q->where('course_id', $courseId);
            });
        }

        if ($request->has('status') && !empty($request->status)) {
            $query->where('status', $request->status);
        }

        if ($request->has('date') && !empty($request->date)) {
            $query->whereDate('scanned_at', $request->date);
        }

        if ($request->has('search') && !empty($request->search)) {
            $search = $request->search;
            $query->whereHas('student', function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhereHas('studentProfile', function ($sq) use ($search) {
                      $sq->where('matric_number', 'like', "%{$search}%");
                  });
            });
        }

        $perPage = $request->get('per_page', 15);
        $paginated = $query->paginate($perPage);

        $paginated->getCollection()->transform(function ($item) {
            $student = $item->student;
            $profile = $student ? ($student->studentProfile ?? $student->student_profile ?? null) : null;
            $department = $profile ? ($profile->department ?? null) : ($item->lectureSession->course->department ?? null);

            $studentName = $student->name ?? 'Student User';
            $matricNo = $profile->matric_number ?? ($student ? "N/A" : 'N/A');
            $deptName = $department->name ?? ($department->code ?? 'N/A');

            $item->student_name = $studentName;
            $item->matric_number = $matricNo;
            $item->department_name = $deptName;

            $item->student_data = [
                'name' => $studentName,
                'matric_number' => $matricNo,
                'department' => [
                    'name' => $deptName
                ]
            ];

            return $item;
        });

        return response()->json($paginated);
    }

    /**
     * Get live check-in list for a projector session.
     */
    public function live($session_id)
    {
        $attendances = Attendance::where('lecture_session_id', $session_id)
            ->with(['student.studentProfile.department', 'lectureSession.course'])
            ->orderBy('scanned_at', 'desc')
            ->get();

        return response()->json($attendances);
    }

    /**
     * Export attendance logs as CSV.
     */
    public function export(Request $request)
    {
        $user = $request->user();
        $query = Attendance::with(['student.studentProfile.department', 'lectureSession.course.department', 'lectureSession.academicSession']);

        if ($user && ($user->hasRole('Head of Department') || $user->role === 'Head of Department')) {
            $hodDeptId = $user->staffProfile->department_id ?? null;
            if ($hodDeptId) {
                $query->whereHas('student.studentProfile', function ($q) use ($hodDeptId) {
                    $q->where('department_id', $hodDeptId);
                });
            }
        }

        if ($user && ($user->hasRole('Lecturer') || $user->role === 'Lecturer')) {
            $query->whereHas('lectureSession', function ($q) use ($user) {
                $q->where('lecturer_id', $user->id);
            });
        }

        if ($request->has('academic_session_id') && !empty($request->academic_session_id)) {
            $acadId = $request->academic_session_id;
            $query->whereHas('lectureSession', function ($q) use ($acadId) {
                $q->where('academic_session_id', $acadId);
            });
        }

        if ($request->has('department_id') && !empty($request->department_id)) {
            $deptId = $request->department_id;
            $query->whereHas('student.studentProfile', function ($q) use ($deptId) {
                $q->where('department_id', $deptId);
            });
        }

        if ($request->has('course_id') && !empty($request->course_id)) {
            $courseId = $request->course_id;
            $query->whereHas('lectureSession', function ($q) use ($courseId) {
                $q->where('course_id', $courseId);
            });
        }

        if ($request->has('status') && !empty($request->status)) {
            $query->where('status', $request->status);
        }

        if ($request->has('date') && !empty($request->date)) {
            $query->whereDate('scanned_at', $request->date);
        }

        if ($request->has('session_id') && !empty($request->session_id)) {
            $query->where('lecture_session_id', $request->session_id);
        }

        $attendances = $query->orderBy('scanned_at', 'desc')->get();

        $headers = [
            "Content-type" => "text/csv",
            "Content-Disposition" => "attachment; filename=attendance_report_" . date('Y-m-d') . ".csv",
            "Pragma" => "no-cache",
            "Cache-Control" => "must-revalidate, post-check=0, pre-check=0",
            "Expires" => "0"
        ];

        $callback = function () use ($attendances) {
            $file = fopen('php://output', 'w');
            fputcsv($file, ['ID', 'Student Name', 'Matric Number', 'Department', 'Course Code', 'Course Name', 'Academic Session', 'Status', 'Scanned At']);

            foreach ($attendances as $log) {
                fputcsv($file, [
                    $log->id,
                    $log->student->name ?? 'N/A',
                    $log->student->studentProfile->matric_number ?? ($log->student->student_profile->matric_number ?? 'N/A'),
                    $log->student->studentProfile->department->name ?? ($log->student->student_profile->department->name ?? 'N/A'),
                    $log->lectureSession->course->code ?? 'N/A',
                    $log->lectureSession->course->name ?? 'N/A',
                    $log->lectureSession->academicSession->name ?? 'N/A',
                    $log->status,
                    $log->scanned_at ? $log->scanned_at->format('Y-m-d H:i:s') : 'N/A',
                ]);
            }
            fclose($file);
        };

        return new StreamedResponse($callback, 200, $headers);
    }

    /**
     * Calculate Haversine distance in meters between two lat/lng pairs.
     */
    private function calculateDistance($lat1, $lon1, $lat2, $lon2)
    {
        $earthRadius = 6371000;

        $latFrom = deg2rad($lat1);
        $lonFrom = deg2rad($lon1);
        $latTo = deg2rad($lat2);
        $lonTo = deg2rad($lon2);

        $latDelta = $latTo - $latFrom;
        $lonDelta = $lonTo - $lonFrom;

        $angle = 2 * asin(sqrt(pow(sin($latDelta / 2), 2) +
            cos($latFrom) * cos($latTo) * pow(sin($lonDelta / 2), 2)));

        return $angle * $earthRadius;
    }
}
