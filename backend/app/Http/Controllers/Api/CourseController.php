<?php

namespace App\Http\Controllers\Api;

use App\Enums\CourseStatus;
use App\Exceptions\InvalidCourseTransitionException;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreCourseRequest;
use App\Http\Requests\UpdateCourseRequest;
use App\Models\Course;
use App\Services\CourseWorkflowService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CourseController extends Controller
{
    public function __construct(private readonly CourseWorkflowService $workflow) {}

    public function index(): JsonResponse
    {
        $this->authorize('viewAny', Course::class);

        return response()->json(
            Course::query()->with(['organization', 'creator', 'approver'])->paginate(15)
        );
    }

    public function store(StoreCourseRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $course = Course::create($validated + [
            'organization_id' => $request->user()->organization_id,
            'created_by' => $request->user()->id,
            'status' => CourseStatus::Draft,
        ]);

        return response()->json($course, 201);
    }

    public function show(Course $course): JsonResponse
    {
        $this->authorize('view', $course);

        return response()->json($course->load(['organization', 'creator', 'approver']));
    }

    public function update(UpdateCourseRequest $request, Course $course): JsonResponse
    {
        $course->update($request->validated());

        return response()->json($course->fresh(['organization', 'creator', 'approver']));
    }

    public function destroy(Course $course): JsonResponse
    {
        $this->authorize('delete', $course);

        $course->delete();

        return response()->json(['message' => 'Course deleted.']);
    }

    public function submitApproval(Request $request, Course $course): JsonResponse
    {
        return $this->applyTransition($course, CourseStatus::SubmittedForApproval, $request);
    }

    public function approve(Request $request, Course $course): JsonResponse
    {
        return $this->applyTransition($course, CourseStatus::Approved, $request);
    }

    public function reject(Request $request, Course $course): JsonResponse
    {
        $reason = $request->validate([
            'reason' => ['nullable', 'string', 'max:2000'],
        ])['reason'] ?? null;

        return $this->applyTransition($course, CourseStatus::Rejected, $request, function (Course $c) use ($reason) {
            $c->rejection_reason = $reason;
        });
    }

    public function publish(Request $request, Course $course): JsonResponse
    {
        return $this->applyTransition($course, CourseStatus::Published, $request);
    }

    public function archive(Request $request, Course $course): JsonResponse
    {
        return $this->applyTransition($course, CourseStatus::Archived, $request);
    }

    /**
     * Shared helper: delegate the actual status mutation to
     * CourseWorkflowService::transition(), optionally applying extra
     * attribute changes (e.g. rejection_reason) before saving, and
     * normalize InvalidCourseTransitionException into the standard
     * {message, errors, status_code} 422 shape.
     */
    private function applyTransition(
        Course $course,
        CourseStatus $newStatus,
        Request $request,
        ?callable $beforeSave = null
    ): JsonResponse {
        try {
            if ($beforeSave !== null) {
                $beforeSave($course);
            }

            $updated = $this->workflow->transition($course, $newStatus, $request->user());

            return response()->json($updated->fresh(['organization', 'creator', 'approver']));
        } catch (InvalidCourseTransitionException $e) {
            return response()->json([
                'message' => $e->getMessage(),
                'errors' => [],
                'status_code' => 422,
            ], 422);
        }
    }
}
