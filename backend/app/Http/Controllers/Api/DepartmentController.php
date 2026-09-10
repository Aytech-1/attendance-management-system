<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Department;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class DepartmentController extends Controller
{
    /**
     * Display a listing of departments.
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $query = Department::query();

        if ($user && $user->isHod()) {
            $hodDeptId = $user->staffProfile->department_id ?? null;
            if ($hodDeptId) {
                $query->where('id', $hodDeptId);
            } else {
                $query->whereRaw('1 = 0');
            }
        }

        // Search filter (name or code)
        if ($request->has('search') && !empty($request->search)) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('code', 'like', "%{$search}%");
            });
        }

        // Status filter
        if ($request->has('status') && !empty($request->status)) {
            $query->where('status', $request->status);
        }

        // Include archived or only non-archived
        if ($request->has('archived') && $request->archived == 'true') {
            $query->whereNotNull('archived_at');
        } else {
            $query->whereNull('archived_at');
        }

        // Pagination
        $perPage = $request->get('per_page', 10);
        $departments = $query->paginate($perPage);

        return response()->json($departments);
    }

    /**
     * Store a newly created department.
     */
    public function store(Request $request)
    {
        if ($request->user()->isHod()) {
            return response()->json(['message' => 'Head of Department is not authorized to create departments.'], 403);
        }

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:50|unique:departments,code',
            'status' => 'nullable|string|in:ACTIVE,INACTIVE',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $department = Department::create([
            'name' => strtoupper($request->name),
            'code' => strtoupper($request->code),
            'status' => $request->get('status', 'ACTIVE'),
        ]);

        // Audit Log
        AuditLog::create([
            'user_id' => $request->user()->id,
            'action' => 'DEPARTMENT_CREATE',
            'description' => "Created department: {$department->code} - {$department->name}.",
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);

        return response()->json([
            'message' => 'Department created successfully.',
            'department' => $department
        ], 201);
    }

    /**
     * Display the specified department.
     */
    public function show(Request $request, $id)
    {
        $user = $request->user();
        $department = Department::find($id);

        if (!$department) {
            return response()->json(['message' => 'Department not found.'], 404);
        }

        if ($user && $user->isHod()) {
            $hodDeptId = $user->staffProfile->department_id ?? null;
            if ($department->id != $hodDeptId) {
                return response()->json(['message' => 'You are not authorized to view departments outside your assignment.'], 403);
            }
        }

        return response()->json($department);
    }

    /**
     * Update the specified department.
     */
    public function update(Request $request, $id)
    {
        if ($request->user()->isHod()) {
            return response()->json(['message' => 'Head of Department is not authorized to modify departments.'], 403);
        }

        $department = Department::find($id);

        if (!$department) {
            return response()->json(['message' => 'Department not found.'], 404);
        }

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:50|unique:departments,code,' . $id,
            'status' => 'nullable|string|in:ACTIVE,INACTIVE',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $department->update([
            'name' => strtoupper($request->name),
            'code' => strtoupper($request->code),
            'status' => $request->get('status', $department->status),
        ]);

        // Audit Log
        AuditLog::create([
            'user_id' => $request->user()->id,
            'action' => 'DEPARTMENT_UPDATE',
            'description' => "Updated department ID {$id}: {$department->code} - {$department->name}.",
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);

        return response()->json([
            'message' => 'Department updated successfully.',
            'department' => $department
        ]);
    }

    /**
     * Soft delete/destroy a department.
     */
    public function destroy(Request $request, $id)
    {
        if ($request->user()->isHod()) {
            return response()->json(['message' => 'Head of Department is not authorized to delete departments.'], 403);
        }

        $department = Department::find($id);

        if (!$department) {
            return response()->json(['message' => 'Department not found.'], 404);
        }

        $department->delete();

        // Audit Log
        AuditLog::create([
            'user_id' => $request->user()->id,
            'action' => 'DEPARTMENT_DELETE',
            'description' => "Deleted department ID {$id}: {$department->code}.",
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);

        return response()->json(['message' => 'Department deleted successfully.']);
    }

    /**
     * Archive a department.
     */
    public function archive(Request $request, $id)
    {
        if ($request->user()->isHod()) {
            return response()->json(['message' => 'Head of Department is not authorized to archive departments.'], 403);
        }

        $department = Department::find($id);

        if (!$department) {
            return response()->json(['message' => 'Department not found.'], 404);
        }

        $department->update([
            'status' => 'INACTIVE',
            'archived_at' => now(),
        ]);

        // Audit Log
        AuditLog::create([
            'user_id' => $request->user()->id,
            'action' => 'DEPARTMENT_ARCHIVE',
            'description' => "Archived department ID {$id}: {$department->code}.",
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);

        return response()->json([
            'message' => 'Department archived successfully.',
            'department' => $department
        ]);
    }

    /**
     * Restore an archived/soft-deleted department.
     */
    public function restore(Request $request, $id)
    {
        if ($request->user()->isHod()) {
            return response()->json(['message' => 'Head of Department is not authorized to restore departments.'], 403);
        }

        // Find including soft-deleted
        $department = Department::withTrashed()->find($id);

        if (!$department) {
            return response()->json(['message' => 'Department not found.'], 404);
        }

        // Restore if soft deleted
        if ($department->trashed()) {
            $department->restore();
        }

        // Clear archived status
        $department->update([
            'status' => 'ACTIVE',
            'archived_at' => null,
        ]);

        // Audit Log
        AuditLog::create([
            'user_id' => $request->user()->id,
            'action' => 'DEPARTMENT_RESTORE',
            'description' => "Restored department ID {$id}: {$department->code}.",
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);

        return response()->json([
            'message' => 'Department restored successfully.',
            'department' => $department
        ]);
    }
}
