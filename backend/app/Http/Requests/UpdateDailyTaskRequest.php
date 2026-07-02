<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateDailyTaskRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /**
     * Same caveat as StoreDailyTaskRequest: the deadline-after-start-date
     * check against the LearningPlan is deferred to the controller/service
     * layer in Phase 4. Here we only validate `due_time` is a valid date.
     *
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'learning_plan_id' => ['sometimes', 'required', 'integer', 'exists:learning_plans,id'],
            'course_id' => ['sometimes', 'required', 'integer', 'exists:courses,id'],
            'module_id' => ['nullable', 'integer', 'exists:modules,id'],
            'lesson_id' => ['nullable', 'integer', 'exists:lessons,id'],
            'day_number' => ['sometimes', 'required', 'integer', 'min:1'],
            'title' => ['sometimes', 'required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'task_type' => ['nullable', 'string', 'max:255'],
            'estimated_minutes' => ['nullable', 'integer', 'min:0'],
            'points' => ['nullable', 'integer', 'min:0'],
            'due_time' => ['sometimes', 'required', 'date'],
            'difficulty' => ['nullable', 'string', 'max:255'],
            'completion_criteria' => ['nullable', 'string'],
            'resource_link' => ['nullable', 'string', 'max:2048'],
            'video_link' => ['nullable', 'string', 'max:2048'],
            'submission_type' => ['nullable', 'string'],
        ];
    }
}
