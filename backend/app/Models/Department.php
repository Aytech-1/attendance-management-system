<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Department extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name',
        'code',
        'status',
        'archived_at',
    ];

    protected $casts = [
        'archived_at' => 'datetime',
    ];

    /**
     * Get the courses belonging to the department.
     */
    public function courses(): HasMany
    {
        return $this->hasMany(Course::class);
    }

    /**
     * Get the staff profiles associated with the department.
     */
    public function staffProfiles(): HasMany
    {
        return $this->hasMany(StaffProfile::class);
    }

    /**
     * Get the student profiles associated with the department.
     */
    public function studentProfiles(): HasMany
    {
        return $this->hasMany(StudentProfile::class);
    }

    /**
     * Get the lecture sessions belonging to the department.
     */
    public function lectureSessions(): HasMany
    {
        return $this->hasMany(LectureSession::class);
    }
}
