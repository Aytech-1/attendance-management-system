<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\StudentProfile;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;

class StudentController extends Controller
{
    /**
     * Display a listing of students.
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $query = User::role('Student')->with(['studentProfile.department']);

        $isHod = $user && $user->isHod();
        $isLecturer = $user && $user->isLecturer();

        // Scoping for Head of Department (HOD)
        if ($isHod) {
            $hodDeptId = $user->staffProfile->department_id ?? null;
            if ($hodDeptId) {
                $query->whereHas('studentProfile', function ($q) use ($hodDeptId) {
                    $q->where('department_id', $hodDeptId);
                });
            } else {
                $query->whereRaw('1 = 0');
            }
        } elseif ($isLecturer) {
            // Scoping for Lecturer: Department + Assigned Courses
            $lecturerDeptId = $user->staffProfile->department_id ?? null;
            $assignedCoursesQuery = \App\Models\Course::where('lecturer_id', $user->id);

            if ($request->has('course_id') && !empty($request->course_id)) {
                $assignedCoursesQuery->where('id', $request->course_id);
            }

            $assignedCourseLevels = $assignedCoursesQuery->pluck('level')->unique()->filter()->toArray();
            $assignedCourseIds = $assignedCoursesQuery->pluck('id')->toArray();

            if ($lecturerDeptId && (!empty($assignedCourseLevels) || !empty($assignedCourseIds))) {
                $query->where(function ($mainQ) use ($lecturerDeptId, $assignedCourseLevels, $assignedCourseIds) {
                    $mainQ->whereHas('studentProfile', function ($q) use ($lecturerDeptId, $assignedCourseLevels) {
                        $q->where('department_id', $lecturerDeptId);
                        if (!empty($assignedCourseLevels)) {
                            $q->whereIn('level', $assignedCourseLevels);
                        }
                    });
                    if (!empty($assignedCourseIds)) {
                        $mainQ->orWhere(function ($orQ) use ($lecturerDeptId, $assignedCourseIds) {
                            $orQ->whereHas('studentProfile', fn($sp) => $sp->where('department_id', $lecturerDeptId))
                                ->whereHas('attendances.lectureSession', fn($lsq) => $lsq->whereIn('course_id', $assignedCourseIds));
                        });
                    }
                });
            } else {
                $query->whereRaw('1 = 0');
            }
        } elseif ($request->has('department_id') && !empty($request->department_id)) {
            // Department filter for Super Admin / Admin
            $deptId = $request->department_id;
            $query->whereHas('studentProfile', function ($q) use ($deptId) {
                $q->where('department_id', $deptId);
            });
        }

        // Level filter
        if ($request->has('level') && !empty($request->level)) {
            $lvl = $request->level;
            $query->whereHas('studentProfile', function ($q) use ($lvl) {
                $q->where('level', $lvl);
            });
        }

        // Status filter
        if ($request->has('status') && !empty($request->status)) {
            $query->where('status', $request->status);
        }

        $perPage = $request->get('per_page', 10);
        $students = $query->paginate($perPage);

        $students->getCollection()->transform(function ($item) {
            $profile = $item->studentProfile ?? ($item->student_profile ?? null);
            $department = $profile->department ?? null;

            $item->matric_number = $profile->matric_number ?? 'N/A';
            $item->level = $profile->level ?? 'N/A';
            $item->phone = $profile->phone ?? 'N/A';
            $item->gender = $profile->gender ?? 'N/A';
            $item->photo_path = $profile->photo_path ?? null;
            $item->department_name = $department->name ?? 'N/A';
            $item->department_code = $department->code ?? 'N/A';
            $item->department = $department;
            $item->student_profile = $profile;
            return $item;
        });

        return response()->json($students);
    }

    /**
     * Store a newly created student in storage (Admin creation).
     */
    public function store(Request $request)
    {
        $authUser = $request->user();
        if ($authUser && ($authUser->isLecturer() || $authUser->isHod())) {
            return response()->json(['message' => 'Academic staff are not authorized to create student records.'], 403);
        }

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:8',
            'matric_number' => 'required|string|unique:student_profiles,matric_number',
            'department_id' => 'required|exists:departments,id',
            'level' => 'required|integer|in:100,200,300,400,500,600',
            'phone' => 'nullable|string|max:20',
            'gender' => 'nullable|in:MALE,FEMALE',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        DB::beginTransaction();
        try {
            $user = User::create([
                'name' => $request->name,
                'email' => $request->email,
                'password' => Hash::make($request->password),
                'status' => 'ACTIVE',
            ]);

            $user->assignRole('Student');

            StudentProfile::create([
                'user_id' => $user->id,
                'department_id' => $request->department_id,
                'matric_number' => strtoupper($request->matric_number),
                'level' => $request->level,
                'phone' => $request->phone,
                'gender' => $request->gender,
            ]);

            AuditLog::create([
                'user_id' => $request->user()->id,
                'action' => 'STUDENT_CREATED',
                'description' => "Admin created student account {$user->name} ({$request->matric_number}).",
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
            ]);

            DB::commit();

            return response()->json($user->load(['studentProfile.department']), 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Failed to create student record.', 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Public Student Registration.
     */
    public function publicRegister(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:8|confirmed',
            'matric_number' => 'required|string|unique:student_profiles,matric_number',
            'department_id' => 'required|exists:departments,id',
            'level' => 'required|integer|in:100,200,300,400,500,600',
            'phone' => 'nullable|string|max:20',
            'gender' => 'nullable|in:MALE,FEMALE',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        DB::beginTransaction();
        try {
            $user = User::create([
                'name' => $request->name,
                'email' => $request->email,
                'password' => Hash::make($request->password),
                'status' => 'ACTIVE',
            ]);

            $user->assignRole('Student');

            StudentProfile::create([
                'user_id' => $user->id,
                'department_id' => $request->department_id,
                'matric_number' => strtoupper($request->matric_number),
                'level' => $request->level,
                'phone' => $request->phone,
                'gender' => $request->gender,
            ]);

            AuditLog::create([
                'user_id' => $user->id,
                'action' => 'STUDENT_REGISTERED',
                'description' => "Student {$user->name} ({$request->matric_number}) self-registered.",
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
            ]);

            DB::commit();

            $token = $user->createToken('auth_token')->plainTextToken;

            return response()->json([
                'message' => 'Registration successful! Welcome.',
                'access_token' => $token,
                'token_type' => 'Bearer',
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => 'Student',
                    'status' => $user->status,
                    'profile' => $user->studentProfile,
                ]
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Registration failed. Please try again.'], 500);
        }
    }

    /**
     * Display specified student details.
     */
    public function show(Request $request, $id)
    {
        $authUser = $request->user();
        $student = User::role('Student')
            ->with(['studentProfile.department', 'attendances.lectureSession.course'])
            ->find($id);

        if (!$student) {
            return response()->json(['message' => 'Student not found.'], 404);
        }

        $profile = $student->studentProfile ?? ($student->student_profile ?? null);
        $department = $profile->department ?? null;

        // HOD Authorization Check
        if ($authUser && $authUser->isHod()) {
            $hodDeptId = $authUser->staffProfile->department_id ?? null;
            if (!$hodDeptId || !$profile || $profile->department_id != $hodDeptId) {
                return response()->json(['message' => 'You are not authorized to view students outside your department.'], 403);
            }
        }

        // Lecturer Authorization Check
        if ($authUser && $authUser->isLecturer()) {
            $lecturerDeptId = $authUser->staffProfile->department_id ?? null;
            if (!$lecturerDeptId || !$profile || $profile->department_id != $lecturerDeptId) {
                return response()->json(['message' => 'You are not authorized to view students outside your department.'], 403);
            }

            $assignedCourses = \App\Models\Course::where('lecturer_id', $authUser->id);
            $assignedCourseLevels = $assignedCourses->pluck('level')->unique()->filter()->toArray();
            $assignedCourseIds = $assignedCourses->pluck('id')->toArray();

            $isLevelMatch = in_array($profile->level, $assignedCourseLevels);
            $hasAttendanceMatch = $student->attendances()->whereHas('lectureSession', function ($sq) use ($assignedCourseIds) {
                $sq->whereIn('course_id', $assignedCourseIds);
            })->exists();

            if (!$isLevelMatch && !$hasAttendanceMatch) {
                return response()->json(['message' => 'You are not authorized to view students not assigned to your courses.'], 403);
            }
        }

        $student->matric_number = $profile->matric_number ?? 'N/A';
        $student->level = $profile->level ?? 'N/A';
        $student->phone = $profile->phone ?? 'N/A';
        $student->gender = $profile->gender ?? 'N/A';
        $student->photo_path = $profile->photo_path ?? null;
        $student->department_id = $profile->department_id ?? null;
        $student->department_name = $department->name ?? 'N/A';
        $student->department_code = $department->code ?? 'N/A';
        $student->department = $department;
        $student->student_profile = $profile;

        return response()->json($student);
    }

    /**
     * Update specified student in storage.
     */
    public function update(Request $request, $id)
    {
        $authUser = $request->user();
        if ($authUser && ($authUser->isLecturer() || $authUser->isHod())) {
            return response()->json(['message' => 'Academic staff are not authorized to modify student records.'], 403);
        }

        $user = User::find($id);

        if (!$user) {
            return response()->json(['message' => 'Student not found.'], 404);
        }

        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|required|string|max:255',
            'email' => 'sometimes|required|email|unique:users,email,' . $id,
            'password' => 'nullable|string|min:8',
            'matric_number' => 'sometimes|required|string|unique:student_profiles,matric_number,' . ($user->studentProfile->id ?? 0),
            'department_id' => 'sometimes|required|exists:departments,id',
            'level' => 'sometimes|required|integer|in:100,200,300,400,500,600',
            'phone' => 'nullable|string|max:20',
            'gender' => 'nullable|in:MALE,FEMALE',
            'status' => 'sometimes|required|in:ACTIVE,INACTIVE,SUSPENDED',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        DB::beginTransaction();
        try {
            if ($request->has('name')) $user->name = $request->name;
            if ($request->has('email')) $user->email = $request->email;
            if ($request->filled('password')) $user->password = Hash::make($request->password);
            if ($request->has('status')) $user->status = $request->status;

            $user->save();

            $profile = $user->studentProfile ?? new StudentProfile(['user_id' => $user->id]);
            if ($request->has('department_id')) $profile->department_id = $request->department_id;
            if ($request->has('matric_number')) $profile->matric_number = strtoupper($request->matric_number);
            if ($request->has('level')) $profile->level = $request->level;
            if ($request->has('phone')) $profile->phone = $request->phone;
            if ($request->has('gender')) $profile->gender = $request->gender;

            $profile->save();

            AuditLog::create([
                'user_id' => $request->user()->id,
                'action' => 'STUDENT_UPDATED',
                'description' => "Updated student record for {$user->name}.",
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
            ]);

            DB::commit();

            return response()->json($user->load(['studentProfile.department']));
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Failed to update student record.', 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Remove specified student from storage.
     */
    public function destroy(Request $request, $id)
    {
        $authUser = $request->user();
        if ($authUser && ($authUser->isLecturer() || $authUser->isHod())) {
            return response()->json(['message' => 'Academic staff are not authorized to delete student records.'], 403);
        }

        $user = User::find($id);

        if (!$user) {
            return response()->json(['message' => 'Student not found.'], 404);
        }

        DB::beginTransaction();
        try {
            if ($user->studentProfile) {
                $user->studentProfile->delete();
            }
            $user->delete();

            AuditLog::create([
                'user_id' => $request->user()->id,
                'action' => 'STUDENT_DELETED',
                'description' => "Deleted student user {$user->name}.",
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
            ]);

            DB::commit();

            return response()->json(['message' => 'Student record deleted successfully.']);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Failed to delete student record.'], 500);
        }
    }
}
