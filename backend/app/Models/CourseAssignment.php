<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * A course assigned by a teacher either to an individual student or to a
 * whole batch.
 *
 * IMPORTANT (app-level invariant, not enforced by the DB): exactly one of
 * `student_id` / `batch_id` must be set. This is intentionally not a DB
 * CHECK constraint because MySQL 8 support for CHECK constraints via
 * Laravel's schema builder is inconsistent; validate this in form
 * requests/model events instead.
 */
class CourseAssignment extends Model
{
    /** @use HasFactory<\Database\Factories\CourseAssignmentFactory> */
    use HasFactory;

    protected $fillable = [
        'course_id',
        'teacher_id',
        'student_id',
        'batch_id',
        'start_date',
        'end_date',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'start_date' => 'date',
            'end_date' => 'date',
        ];
    }

    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class);
    }

    public function teacher(): BelongsTo
    {
        return $this->belongsTo(User::class, 'teacher_id');
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(User::class, 'student_id');
    }

    public function batch(): BelongsTo
    {
        return $this->belongsTo(Batch::class);
    }
}
