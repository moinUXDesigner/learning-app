<?php

namespace App\Models;

use App\Enums\SubmissionType;
use App\Enums\TaskStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TaskSubmission extends Model
{
    /** @use HasFactory<\Database\Factories\TaskSubmissionFactory> */
    use HasFactory;

    protected $fillable = [
        'daily_task_id',
        'student_id',
        'submission_type',
        'text_answer',
        'file_path',
        'url',
        'github_url',
        'status',
        'submitted_at',
        'reviewed_by',
        'reviewed_at',
        'score',
        'feedback',
    ];

    protected function casts(): array
    {
        return [
            'submission_type' => SubmissionType::class,
            'status' => TaskStatus::class,
            'submitted_at' => 'datetime',
            'reviewed_at' => 'datetime',
        ];
    }

    public function dailyTask(): BelongsTo
    {
        return $this->belongsTo(DailyTask::class);
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(User::class, 'student_id');
    }

    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }
}
