<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreDailyTaskRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /**
     * NOTE: the "due_time must be after the learning plan's start date"
     * rule cannot be fully validated here — the LearningPlan context
     * (specifically its start date) isn't guaranteed to be present in this
     * request's payload (a daily task is created against a
     * learning_plan_id, and the plan's start date lives on a different
     * model). We validate that `due_time` is a well-formed date here, and
     * defer the "after start date" cross-model check to the
     * controller/service layer in Phase 4, where the related LearningPlan
     * can be loaded and compared against.
     *
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'learning_plan_id' => ['required', 'integer', 'exists:learning_plans,id'],
            'course_id' => ['required', 'integer', 'exists:courses,id'],
            'module_id' => ['nullable', 'integer', 'exists:modules,id'],
            'lesson_id' => ['nullable', 'integer', 'exists:lessons,id'],
            'day_number' => ['required', 'integer', 'min:1'],
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'task_type' => ['nullable', 'string', 'max:255'],
            'estimated_minutes' => ['nullable', 'integer', 'min:0'],
            'points' => ['nullable', 'integer', 'min:0'],
            'due_time' => ['required', 'date'],
            'difficulty' => ['nullable', 'string', 'max:255'],
            'completion_criteria' => ['nullable', 'string'],
            'resource_link' => ['nullable', 'string', 'max:2048'],
            'video_link' => ['nullable', 'string', 'max:2048'],
            'submission_type' => ['nullable', 'string'],
        ];
    }
}
