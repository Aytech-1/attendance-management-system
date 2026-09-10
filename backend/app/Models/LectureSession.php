<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class LectureSession extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'course_id',
        'department_id',
        'academic_session_id',
        'lecturer_id',
        'date',
        'start_time',
        'end_time',
        'location',
        'latitude',
        'longitude',
        'geofence_radius',
        'token',
        'token_expires_at',
        'status',
    ];

    protected $casts = [
        'date' => 'date',
        'token_expires_at' => 'datetime',
    ];

    /**
     * Get the academic session of the lecture session.
     */
    public function academicSession(): BelongsTo
    {
        return $this->belongsTo(AcademicSession::class);
    }

    /**
     * Get the course of the session.
     */
    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class);
    }

    /**
     * Get the department of the session.
     */
    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class);
    }

    /**
     * Get the lecturer of the session.
     */
    public function lecturer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'lecturer_id');
    }

    /**
     * Get the attendances recorded for this session.
     */
    public function attendances(): HasMany
    {
        return $this->hasMany(Attendance::class);
    }
}
