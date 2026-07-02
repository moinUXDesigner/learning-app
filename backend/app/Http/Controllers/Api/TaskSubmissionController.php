<?php

namespace App\Http\Controllers\Api;

use App\Enums\SubmissionType;
use App\Enums\TaskStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\ReviewSubmissionRequest;
use App\Models\DailyTask;
use App\Models\TaskSubmission;
use App\Services\ScoreService;
use App\Services\StreakService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class TaskSubmissionController extends Controller
{
    /**
     * Student submits a daily task. Which field is required depends on
     * `$dailyTask->submission_type`:
     *  - file / screenshot -> `file` (uploaded file, stored to
     *    storage/app/public/submissions)
     *  - text -> `text_answer`
     *  - url -> `url`
     *  - github_link -> `github_url`
     */
    public function submit(Request $request, DailyTask $dailyTask): JsonResponse
    {
        $submissionType = $dailyTask->submission_type;

        $rules = match ($submissionType) {
            SubmissionType::File, SubmissionType::Screenshot => ['file' => ['required', 'file', 'max:20480']],
            SubmissionType::Text => ['text_answer' => ['required', 'string']],
            SubmissionType::Url => ['url' => ['required', 'url']],
            SubmissionType::GithubLink => ['github_url' => ['required', 'url']],
        };

        $validated = $request->validate($rules);

        $student = $request->user();

        $data = [
            'daily_task_id' => $dailyTask->id,
            'student_id' => $student->id,
            'submission_type' => $submissionType,
            'status' => TaskStatus::Submitted,
            'submitted_at' => now(),
        ];

        if ($submissionType === SubmissionType::File || $submissionType === SubmissionType::Screenshot) {
            $data['file_path'] = $request->file('file')->store('submissions', 'public');
        } elseif ($submissionType === SubmissionType::Text) {
            $data['text_answer'] = $validated['text_answer'];
        } elseif ($submissionType === SubmissionType::Url) {
            $data['url'] = $validated['url'];
        } elseif ($submissionType === SubmissionType::GithubLink) {
            $data['github_url'] = $validated['github_url'];
        }

        $now = now();

        // Early/late determination against the task's due_time. If the
        // task has no due_time, we can't classify - treat as on-time (no
        // bonus, no penalty).
        if ($dailyTask->due_time !== null) {
            if ($now->lt($dailyTask->due_time)) {
                $data['status'] = TaskStatus::Submitted;
            } elseif ($now->gt($dailyTask->due_time)) {
                // TaskStatus has an explicit `Late` case - use it so the
                // submission's own status reflects lateness immediately,
                // ahead of teacher review.
                $data['status'] = TaskStatus::Late;
            }
        }

        $submission = TaskSubmission::create($data);

        $scoreService = app(ScoreService::class);

        if ($dailyTask->due_time !== null) {
            if ($now->lt($dailyTask->due_time)) {
                $scoreService->applyEarlyBonus($student, $submission);
            } elseif ($now->gt($dailyTask->due_time)) {
                $scoreService->applyLatePenalty($student, $submission);
            }
        }

        return response()->json($submission->fresh(['dailyTask', 'student']), 201);
    }

    /**
     * Teacher/org_admin/super_admin reviews (grades) a submission.
     *
     * Status decision (documented, since the spec left exact judgment to
     * us): the request may optionally include a `status` field. If the
     * caller explicitly passes `status = "rejected"`, or omits status but
     * supplies `score = 0`... no: a score of 0 alone is not treated as an
     * automatic rejection (a legitimately low-quality-but-attempted
     * submission scoring 0 should still be "completed", not "rejected" -
     * rejection is reserved for an explicit teacher decision, e.g. "this
     * isn't a real attempt"). So: default status is TaskStatus::Completed;
     * it becomes TaskStatus::Rejected only when the request explicitly
     * passes `status: "rejected"`.
     */
    public function review(ReviewSubmissionRequest $request, TaskSubmission $submission): JsonResponse
    {
        $validated = $request->validated();

        $status = ($validated['status'] ?? null) === TaskStatus::Rejected->value
            ? TaskStatus::Rejected
            : TaskStatus::Completed;

        $submission->update([
            'score' => $validated['score'],
            'feedback' => $validated['feedback'] ?? null,
            'reviewed_by' => $request->user()->id,
            'reviewed_at' => now(),
            'status' => $status,
        ]);

        if ($status === TaskStatus::Completed) {
            $scoreService = app(ScoreService::class);
            $streakService = app(StreakService::class);

            $scoreService->awardForAssignment($submission->student, $submission);

            $course = $submission->dailyTask->course;
            if ($course !== null) {
                $streakService->checkAndAwardStreakIfEligible($submission->student, $course, $scoreService);
            }
        }

        return response()->json($submission->fresh(['dailyTask', 'student', 'reviewer']));
    }

    /**
     * The authenticated student's own submissions.
     */
    public function studentSubmissions(Request $request): JsonResponse
    {
        $submissions = TaskSubmission::query()
            ->where('student_id', $request->user()->id)
            ->with(['dailyTask'])
            ->latest()
            ->paginate(15);

        return response()->json($submissions);
    }

    /**
     * Submissions for courses the authenticated teacher owns (i.e. courses
     * where `created_by` = the teacher). Optional `?status=pending` style
     * filter: since TaskStatus has no literal "pending" case, we treat
     * `status=pending` as an alias for `TaskStatus::Submitted` (awaiting
     * review) OR `TaskStatus::Late` (also awaiting review, just late) -
     * any other `?status=` value is matched literally against the enum.
     */
    public function teacherSubmissions(Request $request): JsonResponse
    {
        $query = TaskSubmission::query()
            ->whereHas('dailyTask.course', function ($q) use ($request) {
                $q->where('created_by', $request->user()->id);
            })
            ->with(['dailyTask', 'student']);

        $statusFilter = $request->query('status');

        if ($statusFilter === 'pending') {
            $query->whereIn('status', [TaskStatus::Submitted->value, TaskStatus::Late->value]);
        } elseif ($statusFilter !== null) {
            $query->where('status', $statusFilter);
        }

        return response()->json($query->latest()->paginate(15));
    }
}
