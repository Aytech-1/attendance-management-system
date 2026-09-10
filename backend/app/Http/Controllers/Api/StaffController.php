<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\StaffProfile;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;

class StaffController extends Controller
{
    /**
     * Display a listing of staff members.
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $query = User::role(['Super Administrator', 'Administrator', 'Head of Department', 'Lecturer'])
            ->with(['staffProfile.department']);

        $isHod = $user && $user->isHod();
        $hodDeptId = $isHod ? ($user->staffProfile->department_id ?? null) : null;

        // Scoping for Head of Department (HOD)
        if ($isHod) {
            if ($hodDeptId) {
                $query->whereHas('staffProfile', function ($q) use ($hodDeptId) {
                    $q->where('department_id', $hodDeptId);
                });
            } else {
                $query->whereRaw('1 = 0');
            }
        } elseif ($request->has('department_id') && !empty($request->department_id)) {
            // Department filter for non-HOD (Super Admin)
            $deptId = $request->department_id;
            $query->whereHas('staffProfile', function ($q) use ($deptId) {
                $q->where('department_id', $deptId);
            });
        }

        // Search filter (name, email, staff_id)
        if ($request->has('search') && !empty($request->search)) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhereHas('staffProfile', function ($sq) use ($search) {
                      $sq->where('staff_id', 'like', "%{$search}%");
                  });
            });
        }

        // Role filter
        if ($request->has('role') && !empty($request->role)) {
            $query->role($request->role);
        }

        // Status filter
        if ($request->has('status') && !empty($request->status)) {
            $query->where('status', $request->status);
        }

        $perPage = $request->get('per_page', 10);
        $paginated = $query->paginate($perPage);

        // Transform collection to append explicit attributes
        $paginated->getCollection()->transform(function ($item) {
            $profile = $item->staffProfile ?? ($item->staff_profile ?? null);
            $roleName = $item->getRoleNames()->first() ?: ($item->role ?: 'Lecturer');

            $item->role = $roleName;
            $item->staff_id = $profile->staff_id ?? 'N/A';
            $item->designation = $profile->designation ?? $roleName;
            $item->qualification = $profile->qualification ?? 'N/A';
            $item->phone = $profile->phone ?? 'N/A';
            $item->gender = $profile->gender ?? 'N/A';
            $item->photo_path = $profile->photo_path ?? null;
            $item->department_name = $profile->department->name ?? 'N/A';
            return $item;
        });

        return response()->json($paginated);
    }

    /**
     * Store a newly created staff member in storage.
     */
    public function store(Request $request)
    {
        if ($request->user()->isHod()) {
            return response()->json(['message' => 'Head of Department is not authorized to create staff members.'], 403);
        }

        $staffCode = $request->staff_id ?: ('STF/' . date('Y') . '/' . rand(1000, 9999));
        $request->merge(['staff_id' => $staffCode]);

        $roleName = $request->role ?: 'Lecturer';
        if ($roleName === 'Admin') $roleName = 'Administrator';
        if ($roleName === 'Super Admin') $roleName = 'Super Administrator';

        $isAdminRole = in_array($roleName, ['Super Administrator', 'Administrator', 'Super Admin', 'Admin']);

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:8',
            'role' => 'required|string',
            'staff_id' => 'required|string|unique:staff_profiles,staff_id',
            'department_id' => $isAdminRole ? 'nullable' : 'required|exists:departments,id',
            'title' => 'nullable|string|max:50',
            'phone' => 'nullable|string|max:20',
            'gender' => 'nullable|in:MALE,FEMALE',
            'photo_path' => 'nullable|string|max:255',
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

            $user->assignRole($roleName);

            $profile = StaffProfile::create([
                'user_id' => $user->id,
                'department_id' => $isAdminRole ? null : $request->department_id,
                'staff_id' => $staffCode,
                'title' => $request->title ?: 'MR',
                'phone' => $request->phone,
                'gender' => $request->gender,
                'photo_path' => $request->photo_path,
            ]);

            AuditLog::create([
                'user_id' => $request->user()->id,
                'action' => 'STAFF_CREATED',
                'description' => "Created staff user {$user->name} ({$request->staff_id}) with role {$roleName}.",
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
            ]);

            DB::commit();

            $user->load(['roles', 'staffProfile.department']);
            $department = $isAdminRole ? null : ($profile->department ?? null);
            $user->role = $roleName;
            $user->title = $profile->title ?? 'MR';
            $user->staff_id = $profile->staff_id ?? 'N/A';
            $user->designation = $profile->designation ?? $user->role;
            $user->qualification = $profile->qualification ?? 'N/A';
            $user->phone = $profile->phone ?? 'N/A';
            $user->gender = $profile->gender ?? 'N/A';
            $user->photo_path = $profile->photo_path ?? null;
            $user->department_id = $isAdminRole ? null : ($profile->department_id ?? null);
            $user->department_name = $department ? ($department->name ?? 'N/A') : 'N/A';
            $user->department = $department;
            $user->staff_profile = $profile;

            return response()->json($user, 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Failed to create staff member.', 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Display the specified staff member.
     */
    public function show(Request $request, $id)
    {
        $authUser = $request->user();
        $staff = User::role(['Super Administrator', 'Administrator', 'Head of Department', 'Lecturer'])
            ->with(['roles', 'staffProfile.department', 'lectureSessions.course'])
            ->find($id);

        if (!$staff) {
            return response()->json(['message' => 'Staff member not found.'], 404);
        }

        $profile = $staff->staffProfile ?? ($staff->staff_profile ?? null);
        $roleName = $staff->getRoleNames()->first() ?: ($staff->role ?: 'Lecturer');
        $isAdminRole = in_array($roleName, ['Super Administrator', 'Administrator', 'Super Admin', 'Admin']);
        $department = $isAdminRole ? null : ($profile->department ?? null);

        // HOD Authorization Check: Only allow viewing staff in HOD's own department
        if ($authUser && $authUser->isHod()) {
            $hodDeptId = $authUser->staffProfile->department_id ?? null;
            if (!$hodDeptId || !$profile || $profile->department_id != $hodDeptId) {
                return response()->json(['message' => 'You are not authorized to view staff members outside your department.'], 403);
            }
        }

        $staff->role = $roleName;
        $staff->title = $profile->title ?? 'MR';
        $staff->staff_id = $profile->staff_id ?? 'N/A';
        $staff->designation = $profile->designation ?? $staff->role;
        $staff->qualification = $profile->qualification ?? 'N/A';
        $staff->phone = $profile->phone ?? 'N/A';
        $staff->gender = $profile->gender ?? 'N/A';
        $staff->photo_path = $profile->photo_path ?? null;
        $staff->department_id = $isAdminRole ? null : ($profile->department_id ?? null);
        $staff->department_name = $department ? ($department->name ?? 'N/A') : 'N/A';
        $staff->department = $department;
        $staff->staff_profile = $profile;

        return response()->json($staff);
    }

    /**
     * Update specified staff member in storage.
     */
    public function update(Request $request, $id)
    {
        if ($request->user()->isHod()) {
            return response()->json(['message' => 'Head of Department is not authorized to modify staff members.'], 403);
        }

        $user = User::find($id);

        if (!$user) {
            return response()->json(['message' => 'Staff member not found.'], 404);
        }

        $targetRole = $request->input('role', $user->getRoleNames()->first() ?: 'Lecturer');
        if ($targetRole === 'Admin') $targetRole = 'Administrator';
        if ($targetRole === 'Super Admin') $targetRole = 'Super Administrator';

        $isAdminRole = in_array($targetRole, ['Super Administrator', 'Administrator', 'Super Admin', 'Admin']);

        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|required|string|max:255',
            'email' => 'sometimes|required|email|unique:users,email,' . $id,
            'password' => 'nullable|string|min:8',
            'role' => 'sometimes|required|in:Super Administrator,Administrator,Head of Department,Lecturer',
            'staff_id' => 'sometimes|required|string|unique:staff_profiles,staff_id,' . ($user->staffProfile->id ?? 0),
            'department_id' => $isAdminRole ? 'nullable' : 'required|exists:departments,id',
            'designation' => 'nullable|string|max:255',
            'qualification' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:20',
            'gender' => 'nullable|in:MALE,FEMALE',
            'title' => 'nullable|string|max:50',
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

            if ($request->has('role')) {
                $user->syncRoles([$targetRole]);
            }

            $profile = $user->staffProfile ?? new StaffProfile(['user_id' => $user->id]);

            if ($isAdminRole) {
                // System Administrators must NOT belong to a specific department
                $profile->department_id = null;
            } else {
                // HOD and Lecturer roles require a department
                if ($request->has('department_id')) {
                    $profile->department_id = $request->department_id;
                }
            }

            if ($request->has('staff_id')) $profile->staff_id = $request->staff_id;
            if ($request->has('designation')) $profile->designation = $request->designation;
            if ($request->has('qualification')) $profile->qualification = $request->qualification;
            if ($request->has('phone')) $profile->phone = $request->phone;
            if ($request->has('gender')) $profile->gender = $request->gender;
            if ($request->has('title')) $profile->title = $request->title;

            $profile->save();

            AuditLog::create([
                'user_id' => $request->user()->id,
                'action' => 'STAFF_UPDATED',
                'description' => "Updated staff profile for {$user->name}.",
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
            ]);

            DB::commit();

            $user->load(['roles', 'staffProfile.department']);
            $department = $isAdminRole ? null : ($profile->department ?? null);
            $user->role = $user->getRoleNames()->first() ?: 'Lecturer';
            $user->title = $profile->title ?? 'MR';
            $user->staff_id = $profile->staff_id ?? 'N/A';
            $user->designation = $profile->designation ?? $user->role;
            $user->qualification = $profile->qualification ?? 'N/A';
            $user->phone = $profile->phone ?? 'N/A';
            $user->gender = $profile->gender ?? 'N/A';
            $user->photo_path = $profile->photo_path ?? null;
            $user->department_id = $isAdminRole ? null : ($profile->department_id ?? null);
            $user->department_name = $department ? ($department->name ?? 'N/A') : 'N/A';
            $user->department = $department;
            $user->staff_profile = $profile;

            return response()->json($user);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Failed to update staff member.', 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Remove specified staff member from storage.
     */
    public function destroy(Request $request, $id)
    {
        if ($request->user()->isHod()) {
            return response()->json(['message' => 'Head of Department is not authorized to delete staff members.'], 403);
        }

        $user = User::find($id);

        if (!$user) {
            return response()->json(['message' => 'Staff member not found.'], 404);
        }

        DB::beginTransaction();
        try {
            if ($user->staffProfile) {
                $user->staffProfile->delete();
            }
            $user->delete();

            AuditLog::create([
                'user_id' => $request->user()->id,
                'action' => 'STAFF_DELETED',
                'description' => "Deleted staff user {$user->name}.",
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
            ]);

            DB::commit();

            return response()->json(['message' => 'Staff member deleted successfully.']);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Failed to delete staff member.'], 500);
        }
    }
}
