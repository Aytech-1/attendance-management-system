<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Attendance extends Model
{
    use HasFactory;

    protected $fillable = [
        'student_id',
        'lecture_session_id',
        'status',
        'scanned_at',
        'latitude',
        'longitude',
        'method',
    ];

    protected $casts = [
        'scanned_at' => 'datetime',
    ];

    /**
     * Get the student (user) who marked attendance.
     */
    public function student(): BelongsTo
    {
        return $this->belongsTo(User::class, 'student_id');
    }

    /**
     * Get the lecture session of the attendance.
     */
    public function lectureSession(): BelongsTo
    {
        return $this->belongsTo(LectureSession::class);
    }
}
