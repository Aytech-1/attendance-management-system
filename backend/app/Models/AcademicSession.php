<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Builder;

class AcademicSession extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name',
        'start_date',
        'end_date',
        'is_current',
        'status',
        'description',
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
        'is_current' => 'boolean',
    ];

    /**
     * Scope query to only currently active academic session.
     */
    public function scopeCurrent(Builder $query): Builder
    {
        return $query->where('is_current', true)->where('status', 'ACTIVE');
    }

    /**
     * Scope query to all active academic sessions.
     */
    public function scopeActive(Builder $query): Builder
    {
        return $query->where('status', 'ACTIVE');
    }

    /**
     * Get lecture sessions associated with this academic session.
     */
    public function lectureSessions(): HasMany
    {
        return $this->hasMany(LectureSession::class);
    }
}
