<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StaffProfile extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'user_id',
        'department_id',
        'staff_id',
        'title',
        'phone',
        'gender',
        'photo_path',
    ];

    /**
     * Get the user that owns the staff profile.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the department associated with the staff member.
     */
    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class);
    }
}
