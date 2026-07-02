<?php

namespace App\Models;

use App\Enums\SubmissionType;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class DailyTask extends Model
{
    /** @use HasFactory<\Database\Factories\DailyTaskFactory> */
    use HasFactory;

    protected $fillable = [
        'learning_plan_id',
        'course_id',
        'module_id',
        'lesson_id',
        'day_number',
        'title',
        'description',
        'task_type',
        'estimated_minutes',
        'points',
        'due_time',
        'difficulty',
        'completion_criteria',
        'resource_link',
        'video_link',
        'submission_type',
    ];

    protected function casts(): array
    {
        return [
            'due_time' => 'datetime',
            'submission_type' => SubmissionType::class,
        ];
    }

    public function learningPlan(): BelongsTo
    {
        return $this->belongsTo(LearningPlan::class);
    }

    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class);
    }

    public function module(): BelongsTo
    {
        return $this->belongsTo(Module::class);
    }

    public function lesson(): BelongsTo
    {
        return $this->belongsTo(Lesson::class);
    }

    public function submissions(): HasMany
    {
        return $this->hasMany(TaskSubmission::class);
    }
}
