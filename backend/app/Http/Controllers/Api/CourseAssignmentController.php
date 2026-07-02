<?php

namespace App\Http\Controllers\Api;

use App\Enums\Role;
use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\CourseAssignment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

/**
 * Batch-student membership decision (documented per task instructions):
 * the `Batch` model (app/Models/Batch.php) has NO students relationship at
 * all - only `teacher()`, `organization()`, and `courseAssignments()`. There
 * is no pivot table (e.g. `batch_student`) in the migrations either. So
 * "batch membership" is not modeled anywhere in this schema; a Batch is
 * only linked to students indirectly, if at all, via being the *target* of
 * a CourseAssignment (course_assignments.batch_id), not via a roster of
 * member students.
 *
 * Consequence: GET /api/student/courses cannot resolve "courses assigned to
 * my batch" because we have no way to know which batch(es) a student
 * belongs to. We therefore simplify to direct student_id assignments only,
 * as explicitly permitted by the task instructions ("...or simplify to
 * direct student_id assignments only if batch-student membership isn't
 * modeled"). If batch membership is added in a later phase (e.g. a
 * `batch_id` column on `users`, or a pivot table), this endpoint should be
 * revisited to union in batch-based assignments too.
 */
class CourseAssignmentController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'course_id' => ['required', 'integer', 'exists:courses,id'],
            'teacher_id' => ['nullable', 'integer', 'exists:users,id'],
            'student_id' => ['nullable', 'integer', 'exists:users,id'],
            'batch_id' => ['nullable', 'integer', 'exists:batches,id'],
            'start_date' => ['required', 'date'],
            'end_date' => ['nullable', 'date', 'after_or_equal:start_date'],
            'status' => ['nullable', 'string'],
        ]);

        $hasStudent = ! empty($validated['student_id']);
        $hasBatch = ! empty($validated['batch_id']);

        if ($hasStudent === $hasBatch) {
            throw ValidationException::withMessages([
                'student_id' => ['Exactly one of student_id or batch_id must be provided.'],
            ]);
        }

        $course = Course::findOrFail($validated['course_id']);

        $this->authorize('create', [CourseAssignment::class, $course]);

        $actor = $request->user();

        if ($actor->role === Role::Teacher) {
            $teacherId = $actor->id;
        } else {
            // org_admin / super_admin may assign on behalf of a specific
            // teacher; teacher_id is required from them since there is no
            // "acting teacher" to default to.
            if (empty($validated['teacher_id'])) {
                throw ValidationException::withMessages([
                    'teacher_id' => ['teacher_id is required when assigning as org_admin/super_admin.'],
                ]);
            }

            $teacherId = $validated['teacher_id'];
        }

        $assignment = CourseAssignment::create([
            'course_id' => $course->id,
            'teacher_id' => $teacherId,
            'student_id' => $validated['student_id'] ?? null,
            'batch_id' => $validated['batch_id'] ?? null,
            'start_date' => $validated['start_date'],
            'end_date' => $validated['end_date'] ?? null,
            'status' => $validated['status'] ?? 'active',
        ]);

        return response()->json($assignment->load(['course', 'teacher', 'student', 'batch']), 201);
    }

    /**
     * The authenticated teacher's own assignments.
     */
    public function teacherAssignments(Request $request): JsonResponse
    {
        $assignments = CourseAssignment::query()
            ->where('teacher_id', $request->user()->id)
            ->with(['course', 'student', 'batch'])
            ->latest()
            ->paginate(15);

        return response()->json($assignments);
    }

    /**
     * Courses assigned to the authenticated student. See class docblock:
     * batch-based assignments are not resolvable (Batch has no student
     * roster), so this only considers direct student_id assignments.
     */
    public function studentCourses(Request $request): JsonResponse
    {
        $courseIds = CourseAssignment::query()
            ->where('student_id', $request->user()->id)
            ->pluck('course_id');

        $courses = Course::query()
            ->whereIn('id', $courseIds)
            ->paginate(15);

        return response()->json($courses);
    }
}
