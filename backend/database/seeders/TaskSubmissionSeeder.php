<?php

namespace Database\Seeders;

use App\Enums\TaskStatus;
use App\Models\Course;
use App\Models\DailyTask;
use App\Models\TaskSubmission;
use App\Models\User;
use App\Services\ScoreService;
use Illuminate\Database\Seeder;

class TaskSubmissionSeeder extends Seeder
{
    public function run(): void
    {
        $course = Course::firstWhere('title', 'Cybersecurity Beginner');
        $teacher1 = User::where('email', 'teacher1@learntrack.test')->firstOrFail();
        $students = User::where('email', 'like', 'student%@learntrack.test')->orderBy('email')->get();
        $tasks = DailyTask::where('course_id', $course->id)->orderBy('day_number')->get();

        $scoreService = app(ScoreService::class);

        // --- Completed submissions: reviewed, scored, and run through
        // ScoreService::awardForAssignment() so a real ScoreLog is created. ---
        $completedPlan = [
            // [task index, student index, score fraction of task points]
            [0, 0, 1.0],
            [1, 1, 0.9],
            [2, 2, 1.0],
            [3, 3, 0.8],
            [4, 4, 1.0],
            [5, 5, 0.9],
            [6, 6, 1.0],
        ];

        foreach ($completedPlan as [$taskIdx, $studentIdx, $fraction]) {
            $task = $tasks[$taskIdx];
            $student = $students[$studentIdx];

            $submittedAt = $task->due_time->copy()->subHours(3);

            $submission = TaskSubmission::create([
                'daily_task_id' => $task->id,
                'student_id' => $student->id,
                'submission_type' => $task->submission_type,
                'text_answer' => "Submission for \"{$task->title}\" by {$student->name}.",
                'file_path' => null,
                'url' => null,
                'github_url' => null,
                'status' => TaskStatus::Submitted,
                'submitted_at' => $submittedAt,
                'reviewed_by' => null,
                'reviewed_at' => null,
                'score' => null,
                'feedback' => null,
            ]);

            $earnedScore = (int) round($task->points * $fraction);

            $submission->update([
                'status' => TaskStatus::Completed,
                'reviewed_by' => $teacher1->id,
                'reviewed_at' => $submittedAt->copy()->addDay(),
                'score' => $earnedScore,
                'feedback' => 'Good work - reviewed and approved.',
            ]);

            $scoreService->awardForAssignment($student, $submission);
        }

        // --- Late submissions: submitted after due_time, status Late, then
        // ScoreService::applyLatePenalty() invoked. ---
        $latePlan = [
            [7, 7],
            [8, 8],
            [9, 9],
            [1, 0],
            [3, 2],
        ];

        foreach ($latePlan as [$taskIdx, $studentIdx]) {
            $task = $tasks[$taskIdx];
            $student = $students[$studentIdx];

            $submittedAt = $task->due_time->copy()->addHours(6);

            $submission = TaskSubmission::create([
                'daily_task_id' => $task->id,
                'student_id' => $student->id,
                'submission_type' => $task->submission_type,
                'text_answer' => "Late submission for \"{$task->title}\" by {$student->name}.",
                'file_path' => null,
                'url' => null,
                'github_url' => null,
                'status' => TaskStatus::Submitted,
                'submitted_at' => $submittedAt,
                'reviewed_by' => null,
                'reviewed_at' => null,
                'score' => null,
                'feedback' => null,
            ]);

            $submission->update([
                'status' => TaskStatus::Late,
                'reviewed_by' => $teacher1->id,
                'reviewed_at' => $submittedAt->copy()->addDay(),
                'score' => (int) round($task->points * 0.6),
                'feedback' => 'Submitted late - partial credit applied.',
            ]);

            $scoreService->applyLatePenalty($student, $submission);
        }

        // --- Pending submissions: still Submitted, awaiting teacher review,
        // no score and no ScoreLog yet. ---
        $pendingPlan = [
            [10, 0],
            [11, 1],
            [12, 2],
            [13, 3],
            [0, 4],
            [2, 5],
        ];

        foreach ($pendingPlan as [$taskIdx, $studentIdx]) {
            $task = $tasks[$taskIdx];
            $student = $students[$studentIdx];

            TaskSubmission::create([
                'daily_task_id' => $task->id,
                'student_id' => $student->id,
                'submission_type' => $task->submission_type,
                'text_answer' => "Submission for \"{$task->title}\" by {$student->name}, awaiting review.",
                'file_path' => null,
                'url' => null,
                'github_url' => null,
                'status' => TaskStatus::Submitted,
                'submitted_at' => now()->copy()->subHours(2),
                'reviewed_by' => null,
                'reviewed_at' => null,
                'score' => null,
                'feedback' => null,
            ]);
        }
    }
}
