<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class CourseController extends Controller
{
    /**
     * Display a listing of courses.
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $query = Course::with(['department', 'lecturer']);

        $isHod = $user && $user->isHod();
        $hodDeptId = $isHod ? ($user->staffProfile->department_id ?? null) : null;

        // Scoping for Head of Department (HOD)
        if ($isHod) {
            if ($hodDeptId) {
                $query->where('department_id', $hodDeptId);
            } else {
                $query->whereRaw('1 = 0');
            }
        } elseif ($request->has('department_id') && !empty($request->department_id)) {
            // Department filter for non-HOD (Super Admin)
            $query->where('department_id', $request->department_id);
        }

        // Scoping for Lecturer
        if ($user && $user->isLecturer()) {
            $query->where('lecturer_id', $user->id);
        }

        // Search filter (name or code)
        if ($request->has('search') && !empty($request->search)) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('code', 'like', "%{$search}%");
            });
        }

        // Lecturer filter
        if ($request->has('lecturer_id') && !empty($request->lecturer_id)) {
            $query->where('lecturer_id', $request->lecturer_id);
        }

        // Level filter
        if ($request->has('level') && !empty($request->level)) {
            $query->where('level', $request->level);
        }

        // Semester filter
        if ($request->has('semester') && !empty($request->semester)) {
            $query->where('semester', $request->semester);
        }

        // Status filter
        if ($request->has('status') && !empty($request->status)) {
            $query->where('status', $request->status);
        }

        $perPage = $request->get('per_page', 10);
        $courses = $query->paginate($perPage);

        return response()->json($courses);
    }

    /**
     * Store a newly created course in storage.
     */
    public function store(Request $request)
    {
        $user = $request->user();
        if ($user && $user->isHod()) {
            $hodDeptId = $user->staffProfile->department_id ?? null;
            if (!$hodDeptId) {
                return response()->json(['message' => 'HOD has no assigned department.'], 403);
            }
            $request->merge(['department_id' => $hodDeptId]);
        }

        $validator = Validator::make($request->all(), [
            'code' => 'required|string|max:15|unique:courses,code',
            'name' => 'required|string|max:255',
            'department_id' => 'required|exists:departments,id',
            'lecturer_id' => 'nullable|exists:users,id',
            'level' => 'required|integer|in:100,200,300,400,500,600',
            'credit_unit' => 'required|integer|min:1|max:6',
            'semester' => 'required|in:FIRST,SECOND',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        // Verify Lecturer belongs to HOD's department if created by HOD
        if ($user && $user->isHod() && $request->filled('lecturer_id')) {
            $hodDeptId = $user->staffProfile->department_id ?? null;
            $lecturer = \App\Models\User::find($request->lecturer_id);
            $lecturerDeptId = $lecturer->staffProfile->department_id ?? null;
            if ($lecturerDeptId != $hodDeptId) {
                return response()->json([
                    'errors' => ['lecturer_id' => ['The assigned lecturer must belong to your department.']]
                ], 422);
            }
        }

        $course = Course::create([
            'code' => strtoupper($request->code),
            'name' => $request->name,
            'department_id' => $request->department_id,
            'lecturer_id' => $request->lecturer_id,
            'level' => $request->level,
            'credit_unit' => $request->credit_unit,
            'semester' => $request->semester,
            'status' => 'ACTIVE',
        ]);

        AuditLog::create([
            'user_id' => $request->user()->id,
            'action' => 'COURSE_CREATED',
            'description' => "Created course {$course->code} - {$course->name}.",
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);

        return response()->json($course->load(['department', 'lecturer']), 201);
    }

    /**
     * Display the specified course.
     */
    public function show(Request $request, $id)
    {
        $user = $request->user();
        $course = Course::with(['department', 'lecturer', 'lectureSessions'])->find($id);

        if (!$course) {
            return response()->json(['message' => 'Course not found.'], 404);
        }

        if ($user && $user->isHod()) {
            $hodDeptId = $user->staffProfile->department_id ?? null;
            if ($course->department_id != $hodDeptId) {
                return response()->json(['message' => 'You are not authorized to view courses outside your department.'], 403);
            }
        }

        return response()->json($course);
    }

    /**
     * Update the specified course in storage.
     */
    public function update(Request $request, $id)
    {
        $user = $request->user();
        $course = Course::find($id);

        if (!$course) {
            return response()->json(['message' => 'Course not found.'], 404);
        }

        if ($user && $user->isHod()) {
            $hodDeptId = $user->staffProfile->department_id ?? null;
            if ($course->department_id != $hodDeptId) {
                return response()->json(['message' => 'You are not authorized to update courses outside your department.'], 403);
            }
            $request->merge(['department_id' => $hodDeptId]);
        }

        $validator = Validator::make($request->all(), [
            'code' => 'sometimes|required|string|max:15|unique:courses,code,' . $id,
            'name' => 'sometimes|required|string|max:255',
            'department_id' => 'sometimes|required|exists:departments,id',
            'lecturer_id' => 'nullable|exists:users,id',
            'level' => 'sometimes|required|integer|in:100,200,300,400,500,600',
            'credit_unit' => 'sometimes|required|integer|min:1|max:6',
            'semester' => 'sometimes|required|in:FIRST,SECOND',
            'status' => 'sometimes|required|in:ACTIVE,INACTIVE',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        // Cross-Department Lecturer Assignment Security Check
        if ($request->filled('lecturer_id')) {
            $targetDeptId = $request->input('department_id', $course->department_id);
            if ($user && $user->isHod()) {
                $targetDeptId = $user->staffProfile->department_id ?? $targetDeptId;
            }

            $lecturer = \App\Models\User::find($request->lecturer_id);
            $lecturerDeptId = $lecturer->staffProfile->department_id ?? null;

            if ($lecturerDeptId != $targetDeptId) {
                return response()->json([
                    'errors' => ['lecturer_id' => ['The assigned lecturer must belong to the course department.']]
                ], 422);
            }
        }

        if ($request->has('code')) $course->code = strtoupper($request->code);
        if ($request->has('name')) $course->name = $request->name;
        if ($request->has('department_id')) $course->department_id = $request->department_id;
        if ($request->has('lecturer_id')) $course->lecturer_id = $request->lecturer_id;
        if ($request->has('level')) $course->level = $request->level;
        if ($request->has('credit_unit')) $course->credit_unit = $request->credit_unit;
        if ($request->has('semester')) $course->semester = $request->semester;
        if ($request->has('status')) $course->status = $request->status;

        $course->save();

        AuditLog::create([
            'user_id' => $request->user()->id,
            'action' => 'COURSE_UPDATED',
            'description' => "Updated course {$course->code}.",
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);

        return response()->json($course->load(['department', 'lecturer']));
    }

    /**
     * Remove the specified course from storage.
     */
    public function destroy(Request $request, $id)
    {
        $user = $request->user();
        $course = Course::find($id);

        if (!$course) {
            return response()->json(['message' => 'Course not found.'], 404);
        }

        if ($user && $user->isHod()) {
            $hodDeptId = $user->staffProfile->department_id ?? null;
            if ($course->department_id != $hodDeptId) {
                return response()->json(['message' => 'You are not authorized to delete courses outside your department.'], 403);
            }
        }

        $course->delete();

        AuditLog::create([
            'user_id' => $request->user()->id,
            'action' => 'COURSE_DELETED',
            'description' => "Deleted course {$course->code}.",
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);

        return response()->json(['message' => 'Course deleted successfully.']);
    }
}
