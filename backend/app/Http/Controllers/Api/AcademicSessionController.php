<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AcademicSession;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;

class AcademicSessionController extends Controller
{
    /**
     * Display a listing of academic sessions.
     */
    public function index(Request $request)
    {
        $query = AcademicSession::withCount('lectureSessions');

        if ($request->has('search') && !empty($request->search)) {
            $search = $request->search;
            $query->where('name', 'like', "%{$search}%");
        }

        if ($request->has('status') && !empty($request->status)) {
            $query->where('status', $request->status);
        }

        $perPage = $request->get('per_page', 15);
        $sessions = $query->orderBy('is_current', 'desc')
                          ->orderBy('name', 'desc')
                          ->paginate($perPage);

        return response()->json($sessions);
    }

    /**
     * Get the currently active academic session.
     */
    public function current()
    {
        $current = AcademicSession::where('is_current', true)->first();

        if (!$current) {
            $current = AcademicSession::where('status', 'ACTIVE')->latest()->first();
        }

        if (!$current) {
            return response()->json(['message' => 'No active academic session found.'], 404);
        }

        return response()->json($current);
    }

    /**
     * Store a newly created academic session.
     */
    public function store(Request $request)
    {
        $user = $request->user();
        if (!$user->isAdmin()) {
            return response()->json(['message' => 'Only administrators can create academic sessions.'], 403);
        }

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:50|unique:academic_sessions,name',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'is_current' => 'nullable|boolean',
            'status' => 'nullable|in:ACTIVE,INACTIVE,CONCLUDED',
            'description' => 'nullable|string|max:500',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        DB::beginTransaction();
        try {
            $isCurrent = $request->boolean('is_current');

            if ($isCurrent) {
                // Deactivate all other sessions as current
                AcademicSession::query()->update(['is_current' => false]);
            }

            $session = AcademicSession::create([
                'name' => trim($request->name),
                'start_date' => $request->start_date,
                'end_date' => $request->end_date,
                'is_current' => $isCurrent,
                'status' => $request->status ?? 'ACTIVE',
                'description' => $request->description,
            ]);

            AuditLog::create([
                'user_id' => $user->id,
                'action' => 'ACADEMIC_SESSION_CREATED',
                'description' => "Created academic session {$session->name}" . ($isCurrent ? " (Set as Current)" : "") . ".",
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
            ]);

            DB::commit();

            return response()->json($session, 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Failed to create academic session.', 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Display the specified academic session.
     */
    public function show($id)
    {
        $session = AcademicSession::with(['lectureSessions.course', 'lectureSessions.lecturer'])->find($id);

        if (!$session) {
            return response()->json(['message' => 'Academic session not found.'], 404);
        }

        return response()->json($session);
    }

    /**
     * Update the specified academic session.
     */
    public function update(Request $request, $id)
    {
        $user = $request->user();
        if (!$user->isAdmin()) {
            return response()->json(['message' => 'Only administrators can update academic sessions.'], 403);
        }

        $session = AcademicSession::find($id);

        if (!$session) {
            return response()->json(['message' => 'Academic session not found.'], 404);
        }

        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|required|string|max:50|unique:academic_sessions,name,' . $id,
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'is_current' => 'nullable|boolean',
            'status' => 'sometimes|required|in:ACTIVE,INACTIVE,CONCLUDED',
            'description' => 'nullable|string|max:500',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        DB::beginTransaction();
        try {
            if ($request->has('is_current') && $request->boolean('is_current')) {
                AcademicSession::where('id', '!=', $id)->update(['is_current' => false]);
                $session->is_current = true;
                $session->status = 'ACTIVE';
            } elseif ($request->has('is_current')) {
                $session->is_current = $request->boolean('is_current');
            }

            if ($request->has('name')) $session->name = trim($request->name);
            if ($request->has('start_date')) $session->start_date = $request->start_date;
            if ($request->has('end_date')) $session->end_date = $request->end_date;
            if ($request->has('status')) $session->status = $request->status;
            if ($request->has('description')) $session->description = $request->description;

            $session->save();

            AuditLog::create([
                'user_id' => $user->id,
                'action' => 'ACADEMIC_SESSION_UPDATED',
                'description' => "Updated academic session {$session->name}.",
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
            ]);

            DB::commit();

            return response()->json($session);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Failed to update academic session.', 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Activate the specified academic session as the sole current active session.
     */
    public function activate(Request $request, $id)
    {
        $user = $request->user();
        if (!$user->isAdmin()) {
            return response()->json(['message' => 'Only administrators can activate academic sessions.'], 403);
        }

        $session = AcademicSession::find($id);

        if (!$session) {
            return response()->json(['message' => 'Academic session not found.'], 404);
        }

        DB::beginTransaction();
        try {
            AcademicSession::query()->update(['is_current' => false]);

            $session->is_current = true;
            $session->status = 'ACTIVE';
            $session->save();

            AuditLog::create([
                'user_id' => $user->id,
                'action' => 'ACADEMIC_SESSION_ACTIVATED',
                'description' => "Activated academic session {$session->name} as the primary active session.",
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
            ]);

            DB::commit();

            return response()->json([
                'message' => "Academic session {$session->name} activated successfully.",
                'session' => $session
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Failed to activate academic session.', 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Remove the specified academic session from storage.
     */
    public function destroy(Request $request, $id)
    {
        $user = $request->user();
        if (!$user->isAdmin()) {
            return response()->json(['message' => 'Only administrators can delete academic sessions.'], 403);
        }

        $session = AcademicSession::withCount('lectureSessions')->find($id);

        if (!$session) {
            return response()->json(['message' => 'Academic session not found.'], 404);
        }

        // Prevent deletion when dependent lecture session records exist
        if ($session->lecture_sessions_count > 0) {
            return response()->json([
                'message' => "Cannot delete academic session '{$session->name}' because it contains {$session->lecture_sessions_count} lecture session(s). Please deactivate or reassign records first."
            ], 422);
        }

        if ($session->is_current) {
            return response()->json([
                'message' => "Cannot delete the active academic session. Please activate another session before deleting."
            ], 422);
        }

        $session->delete();

        AuditLog::create([
            'user_id' => $user->id,
            'action' => 'ACADEMIC_SESSION_DELETED',
            'description' => "Deleted academic session {$session->name}.",
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);

        return response()->json(['message' => 'Academic session deleted successfully.']);
    }
}
