<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\LectureSession;
use App\Models\AcademicSession;
use App\Models\Course;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Validator;
use SimpleSoftwareIO\QrCode\Facades\QrCode;

class LectureSessionController extends Controller
{
    /**
     * Display a listing of lecture sessions.
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $query = LectureSession::with(['course', 'department', 'lecturer', 'academicSession']);

        // Scoping for Head of Department (HOD)
        if ($user && ($user->hasRole('Head of Department') || $user->role === 'Head of Department')) {
            $hodDeptId = $user->staffProfile->department_id ?? null;
            if ($hodDeptId) {
                $query->where('department_id', $hodDeptId);
            }
        }

        // Scoping for Lecturer
        if ($user && ($user->hasRole('Lecturer') || $user->role === 'Lecturer')) {
            $query->where('lecturer_id', $user->id);
        }

        // Filter by Academic Session
        if ($request->has('academic_session_id') && !empty($request->academic_session_id)) {
            $query->where('academic_session_id', $request->academic_session_id);
        }

        // Filter by department
        if ($request->has('department_id') && !empty($request->department_id)) {
            $query->where('department_id', $request->department_id);
        }

        // Filter by course
        if ($request->has('course_id') && !empty($request->course_id)) {
            $query->where('course_id', $request->course_id);
        }

        // Filter by lecturer
        if ($request->has('lecturer_id') && !empty($request->lecturer_id)) {
            $query->where('lecturer_id', $request->lecturer_id);
        }

        // Filter by date
        if ($request->has('date') && !empty($request->date)) {
            $query->where('date', $request->date);
        }

        // Filter by status
        if ($request->has('status') && !empty($request->status)) {
            $query->where('status', $request->status);
        }

        $perPage = $request->get('per_page', 10);
        $sessions = $query->latest()->paginate($perPage);

        return response()->json($sessions);
    }

    /**
     * Store a newly created lecture session.
     */
    public function store(Request $request)
    {
        $user = $request->user();

        $input = $request->all();
        $input['latitude'] = ($request->has('latitude') && $request->latitude !== '' && $request->latitude !== null) ? $request->latitude : null;
        $input['longitude'] = ($request->has('longitude') && $request->longitude !== '' && $request->longitude !== null) ? $request->longitude : null;
        $input['geofence_radius'] = ($request->has('geofence_radius') && $request->geofence_radius !== '' && $request->geofence_radius !== null) ? $request->geofence_radius : null;

        // Auto-assign academic session if not specified
        if (empty($input['academic_session_id'])) {
            $currentAcademic = AcademicSession::where('is_current', true)->first()
                ?? AcademicSession::where('status', 'ACTIVE')->latest()->first();
            $input['academic_session_id'] = $currentAcademic->id ?? null;
        }

        $isLecturer = $user->hasRole('Lecturer') || $user->role === 'Lecturer';
        $isHod = $user->hasRole('Head of Department') || $user->role === 'Head of Department';

        // Role-based Lecturer assignment and departmental constraint
        if ($isLecturer) {
            $lecturerDeptId = $user->staffProfile->department_id ?? null;
            if (!$lecturerDeptId) {
                return response()->json(['message' => 'Lecturer profile department not found.'], 422);
            }
            // Strict backend override: client cannot supply arbitrary lecturer_id or department_id
            $input['lecturer_id'] = $user->id;
            $input['department_id'] = $lecturerDeptId;
        } elseif ($isHod) {
            $hodDeptId = $user->staffProfile->department_id ?? null;
            if ($hodDeptId) {
                $input['department_id'] = $hodDeptId;
            }
        }

        $validator = Validator::make($input, [
            'course_id' => 'required|exists:courses,id',
            'department_id' => 'required|exists:departments,id',
            'academic_session_id' => 'nullable|exists:academic_sessions,id',
            'lecturer_id' => 'required|exists:users,id',
            'date' => 'required|date',
            'start_time' => 'required',
            'end_time' => 'required|after:start_time',
            'location' => 'required|string|max:255',
            'latitude' => 'nullable|numeric|between:-90,90',
            'longitude' => 'nullable|numeric|between:-180,180',
            'geofence_radius' => 'nullable|numeric|min:1',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        // Verify course exists and check ownership & departmental alignment
        $course = Course::find($input['course_id']);
        if (!$course) {
            return response()->json(['message' => 'Selected course not found.'], 404);
        }

        if ($isLecturer) {
            if ($course->lecturer_id != $user->id) {
                return response()->json(['message' => 'You are not authorized to create a session for a course assigned to another lecturer.'], 403);
            }
            if ($course->department_id != $lecturerDeptId) {
                return response()->json(['message' => 'The selected course does not belong to your department.'], 403);
            }
        } elseif ($isHod) {
            if ($course->department_id != $hodDeptId) {
                return response()->json(['message' => 'The selected course does not belong to your department.'], 403);
            }
        } else {
            if ($course->department_id != $input['department_id']) {
                return response()->json(['message' => 'The selected course does not belong to the chosen department.'], 422);
            }
        }

        // Generate temporary encrypted token
        $tempPayload = json_encode([
            'session_id' => null,
            'timestamp' => time(),
            'static' => true,
        ]);
        $token = Crypt::encryptString($tempPayload);

        $session = LectureSession::create([
            'course_id' => $input['course_id'],
            'department_id' => $input['department_id'],
            'academic_session_id' => $input['academic_session_id'],
            'lecturer_id' => $input['lecturer_id'],
            'date' => $input['date'],
            'start_time' => $input['start_time'],
            'end_time' => $input['end_time'],
            'location' => $input['location'],
            'latitude' => $input['latitude'],
            'longitude' => $input['longitude'],
            'geofence_radius' => $input['geofence_radius'] ?? 50,
            'token' => $token,
            'token_expires_at' => now()->parse($input['date'] . ' ' . $input['end_time']),
            'status' => 'ACTIVE',
        ]);

        // Re-encrypt token containing exact session ID and course metadata
        $finalPayload = json_encode([
            'session_id' => $session->id,
            'course_code' => $course->code,
            'academic_session_id' => $session->academic_session_id,
            'timestamp' => time(),
            'static' => true,
        ]);
        $session->token = Crypt::encryptString($finalPayload);
        $session->save();

        AuditLog::create([
            'user_id' => $user->id,
            'action' => 'SESSION_CREATED',
            'description' => "Created lecture session ID {$session->id} for {$course->code} at {$session->location}.",
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);

        return response()->json($session->load(['course', 'department', 'lecturer', 'academicSession']), 201);
    }

    /**
     * Display specified lecture session.
     */
    public function show(Request $request, $id)
    {
        $user = $request->user();
        $session = LectureSession::with(['course', 'department', 'lecturer', 'academicSession', 'attendances.student.studentProfile'])->find($id);

        if (!$session) {
            return response()->json(['message' => 'Lecture session not found.'], 404);
        }

        // Authorization check for Lecturer and HOD
        if ($user && ($user->hasRole('Lecturer') || $user->role === 'Lecturer') && $session->lecturer_id !== $user->id) {
            return response()->json(['message' => 'You are not authorized to access this lecture session.'], 403);
        }

        if ($user && ($user->hasRole('Head of Department') || $user->role === 'Head of Department')) {
            $hodDeptId = $user->staffProfile->department_id ?? null;
            if ($hodDeptId && $session->department_id !== $hodDeptId) {
                return response()->json(['message' => 'This lecture session belongs to another department.'], 403);
            }
        }

        return response()->json($session);
    }

    /**
     * Generate secure QR code token payload for session projection.
     */
    public function generateQrToken(Request $request, $id)
    {
        $user = $request->user();
        $session = LectureSession::with('course')->find($id);

        if (!$session) {
            return response()->json(['message' => 'Session not found.'], 404);
        }

        // Authorization check
        if ($user && ($user->hasRole('Lecturer') || $user->role === 'Lecturer') && $session->lecturer_id !== $user->id) {
            return response()->json(['message' => 'You cannot generate a QR code for another lecturer\'s session.'], 403);
        }

        if ($user && ($user->hasRole('Head of Department') || $user->role === 'Head of Department')) {
            $hodDeptId = $user->staffProfile->department_id ?? null;
            if ($hodDeptId && $session->department_id !== $hodDeptId) {
                return response()->json(['message' => 'You cannot generate a QR code for another department\'s session.'], 403);
            }
        }

        if ($session->status !== 'ACTIVE') {
            return response()->json(['message' => 'Cannot generate QR code for an inactive or concluded session.'], 400);
        }

        $now = time();
        $payload = json_encode([
            'session_id' => $session->id,
            'course_code' => $session->course->code ?? null,
            'academic_session_id' => $session->academic_session_id,
            'timestamp' => $now,
            'time_step' => floor($now / 30),
            'static' => false,
        ]);

        $token = Crypt::encryptString($payload);
        $session->token = $token;
        $session->save();

        $qrCodeDataUri = 'data:image/svg+xml;base64,' . base64_encode(QrCode::format('svg')->size(300)->generate($token));

        return response()->json([
            'session_id' => $session->id,
            'token' => $token,
            'qr_code_url' => $qrCodeDataUri,
        ]);
    }

    /**
     * End a lecture session.
     */
    public function endSession(Request $request, $id)
    {
        $user = $request->user();
        $session = LectureSession::find($id);

        if (!$session) {
            return response()->json(['message' => 'Session not found.'], 404);
        }

        // Authorization check
        if ($user && ($user->hasRole('Lecturer') || $user->role === 'Lecturer') && $session->lecturer_id !== $user->id) {
            return response()->json(['message' => 'You are not authorized to end another lecturer\'s session.'], 403);
        }

        if ($user && ($user->hasRole('Head of Department') || $user->role === 'Head of Department')) {
            $hodDeptId = $user->staffProfile->department_id ?? null;
            if ($hodDeptId && $session->department_id !== $hodDeptId) {
                return response()->json(['message' => 'You are not authorized to end a session belonging to another department.'], 403);
            }
        }

        $session->status = 'COMPLETED';
        $session->save();

        AuditLog::create([
            'user_id' => $user->id,
            'action' => 'SESSION_ENDED',
            'description' => "Ended lecture session ID {$session->id}.",
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);

        return response()->json(['message' => 'Lecture session ended successfully.', 'session' => $session]);
    }
}
