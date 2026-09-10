<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Spatie\Permission\Traits\HasRoles;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\HasMany;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable, HasRoles;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'status',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    /**
     * Get the staff profile associated with the user.
     */
    public function staffProfile(): HasOne
    {
        return $this->hasOne(StaffProfile::class);
    }

    /**
     * Get the student profile associated with the user.
     */
    public function studentProfile(): HasOne
    {
        return $this->hasOne(StudentProfile::class);
    }

    /**
     * Get the attendances marked by the user (as a student).
     */
    public function attendances(): HasMany
    {
        return $this->hasMany(Attendance::class, 'student_id');
    }

    /**
     * Get the audit logs created by the user.
     */
    public function auditLogs(): HasMany
    {
        return $this->hasMany(AuditLog::class);
    }

    /**
     * Get the lecture sessions taught by the user (as a lecturer).
     */
    public function lectureSessions(): HasMany
    {
        return $this->hasMany(LectureSession::class, 'lecturer_id');
    }

    public function isHod(): bool
    {
        return $this->hasRole(['Head of Department', 'HOD']) || $this->role === 'Head of Department';
    }

    public function isLecturer(): bool
    {
        return $this->hasRole(['Lecturer']) || $this->role === 'Lecturer';
    }

    public function isStudent(): bool
    {
        return $this->hasRole(['Student']) || $this->role === 'Student';
    }

    public function isAdmin(): bool
    {
        return $this->hasRole(['Super Administrator', 'Administrator', 'Super Admin', 'Admin']) || in_array($this->role, ['Super Admin', 'Admin', 'Super Administrator', 'Administrator']);
    }
}
