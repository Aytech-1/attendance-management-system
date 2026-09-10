<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Course extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'code',
        'name',
        'department_id',
        'lecturer_id',
        'level',
        'credit_unit',
        'semester',
        'status',
    ];

    /**
     * Get the department that owns the course.
     */
    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class);
    }

    /**
     * Get the lecturer assigned to the course.
     */
    public function lecturer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'lecturer_id');
    }

    /**
     * Get the lecture sessions of the course.
     */
    public function lectureSessions(): HasMany
    {
        return $this->hasMany(LectureSession::class);
    }
}
