<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rules\Password;

class AuthController extends Controller
{
    /**
     * User Login.
     */
    public function login(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
            'password' => 'required',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $user = User::with(['staffProfile.department', 'studentProfile.department'])->where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json(['message' => 'Invalid email or password.'], 401);
        }

        if ($user->status !== 'ACTIVE') {
            return response()->json(['message' => 'Your account is inactive. Please contact the administrator.'], 403);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        // Create Audit Log
        AuditLog::create([
            'user_id' => $user->id,
            'action' => 'LOGIN',
            'description' => "User {$user->email} logged in successfully.",
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Login successful',
            'token' => $token,
            'access_token' => $token,
            'token_type' => 'Bearer',
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->getRoleNames()->first(),
                'status' => $user->status,
                'profile' => $user->staffProfile ?? $user->studentProfile,
            ]
        ], 200);
    }

    /**
     * User Logout.
     */
    public function logout(Request $request)
    {
        $user = $request->user();
        
        // Create Audit Log
        AuditLog::create([
            'user_id' => $user->id,
            'action' => 'LOGOUT',
            'description' => "User {$user->email} logged out.",
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);

        $user->currentAccessToken()->delete();

        return response()->json(['message' => 'Logged out successfully.']);
    }

    /**
     * Get user profile.
     */
    public function profile(Request $request)
    {
        $user = User::with(['staffProfile.department', 'studentProfile.department'])->find($request->user()->id);
        
        return response()->json([
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->getRoleNames()->first(),
                'status' => $user->status,
                'profile' => $user->staffProfile ?? $user->studentProfile,
            ]
        ]);
    }

    /**
     * Change Password.
     */
    public function changePassword(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'current_password' => 'required',
            'new_password' => ['required', Password::min(8)],
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $user = $request->user();

        if (!Hash::check($request->current_password, $user->password)) {
            return response()->json(['message' => 'Current password is incorrect.'], 400);
        }

        $user->password = Hash::make($request->new_password);
        $user->save();

        // Create Audit Log
        AuditLog::create([
            'user_id' => $user->id,
            'action' => 'PASSWORD_CHANGE',
            'description' => "User {$user->email} changed their password.",
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);

        return response()->json(['message' => 'Password updated successfully.']);
    }

    /**
     * Forgot Password.
     */
    public function forgotPassword(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email|exists:users,email',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        // Generate dummy reset token (in production we send email)
        $token = bin2hex(random_bytes(16));
        
        // We will return the token for the API client to complete reset directly.
        return response()->json([
            'message' => 'Password reset token generated.',
            'reset_token' => $token,
            'email' => $request->email
        ]);
    }

    /**
     * Reset Password.
     */
    public function resetPassword(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email|exists:users,email',
            'token' => 'required',
            'password' => ['required', 'confirmed', Password::min(8)],
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $user = User::where('email', $request->email)->first();
        $user->password = Hash::make($request->password);
        $user->save();

        // Create Audit Log
        AuditLog::create([
            'user_id' => $user->id,
            'action' => 'PASSWORD_RESET',
            'description' => "User {$user->email} reset their password using token.",
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);

        return response()->json(['message' => 'Password reset successfully.']);
    }
}
