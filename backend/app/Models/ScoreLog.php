<?php

namespace App\Models;

use App\Enums\ActivityType;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Append-only score/points ledger entry.
 *
 * `activity_id` is a polymorphic-ish reference (no FK constraint) whose
 * target table depends on `activity_type` (e.g. a daily_task id for
 * `assignment`, a quiz_attempts id for `quiz_pass`, a projects id for
 * `project`, etc.). Resolve it manually per activity_type rather than via
 * an Eloquent relation.
 */
class ScoreLog extends Model
{
    /** @use HasFactory<\Database\Factories\ScoreLogFactory> */
    use HasFactory;

    protected $fillable = [
        'student_id',
        'course_id',
        'activity_type',
        'activity_id',
        'points',
        'remarks',
    ];

    protected function casts(): array
    {
        return [
            'activity_type' => ActivityType::class,
        ];
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(User::class, 'student_id');
    }

    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class);
    }
}
