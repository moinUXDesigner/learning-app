import { Fragment, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useCourse, useCourseLearningPlans, useLearningPlanDailyTasks } from '../../api/hooks/useCourses';
import {
  useCreateDailyTask,
  useDeleteDailyTask,
  useUpdateDailyTask,
} from '../../api/hooks/useDailyTasksAdmin';
import { ApiError } from '../../api/types';
import { Card } from '../../components/Card';
import type { DailyTask, SubmissionType } from '../../types';

const EDITABLE_STATUSES = ['draft', 'rejected'];
const SUBMISSION_TYPES: SubmissionType[] = ['file', 'text', 'screenshot', 'url', 'github_link'];

interface TaskFormValues {
  day_number: string;
  title: string;
  description: string;
  task_type: string;
  estimated_minutes: string;
  points: string;
  due_time: string;
  difficulty: string;
  completion_criteria: string;
  resource_link: string;
  video_link: string;
  submission_type: SubmissionType;
}

const EMPTY_FORM: TaskFormValues = {
  day_number: '',
  title: '',
  description: '',
  task_type: '',
  estimated_minutes: '',
  points: '',
  due_time: '',
  difficulty: '',
  completion_criteria: '',
  resource_link: '',
  video_link: '',
  submission_type: 'text',
};

function taskToFormValues(task: DailyTask): TaskFormValues {
  return {
    day_number: String(task.day_number),
    title: task.title,
    description: task.description ?? '',
    task_type: task.task_type ?? '',
    estimated_minutes: task.estimated_minutes != null ? String(task.estimated_minutes) : '',
    points: String(task.points ?? ''),
    // due_time from backend is an ISO datetime; <input type="datetime-local"> needs "YYYY-MM-DDTHH:mm".
    due_time: task.due_time ? task.due_time.slice(0, 16) : '',
    difficulty: task.difficulty ?? '',
    completion_criteria: task.completion_criteria ?? '',
    resource_link: task.resource_link ?? '',
    video_link: task.video_link ?? '',
    submission_type: task.submission_type,
  };
}

export function TaskBuilder() {
  const { courseId } = useParams<{ courseId: string }>();
  const { data: course, isLoading: courseLoading } = useCourse(courseId);
  const { data: plans, isLoading: plansLoading } = useCourseLearningPlans(courseId);
  const plan = plans?.[0];
  const { data: tasks, isLoading: tasksLoading } = useLearningPlanDailyTasks(plan?.id);

  if (courseLoading || plansLoading) {
    return <p className="text-sm text-gray-500">Loading task builder…</p>;
  }

  if (!course || !courseId) {
    return <p className="text-sm text-red-600">Course not found.</p>;
  }

  if (!plan) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-semibold text-gray-800">Daily Tasks — {course.title}</h1>
        <Card>
          <p className="text-sm text-gray-500">
            This course has no Learning Plan yet. Create one first before adding daily tasks.
          </p>
          <Link
            to={`/teacher/learning-plan-builder/${courseId}`}
            className="mt-3 inline-block rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            Create Learning Plan
          </Link>
        </Card>
      </div>
    );
  }

  const isEditable = EDITABLE_STATUSES.includes(course.status);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-800">Daily Tasks — {course.title}</h1>
        <p className="mt-1 text-sm text-gray-500">
          Plan: {plan.title} ({plan.duration_days} days)
        </p>
        <Link to="/teacher/my-courses" className="mt-2 inline-block text-sm text-indigo-600 hover:text-indigo-500">
          &larr; Back to My Courses
        </Link>
      </div>

      {!isEditable && (
        <div className="rounded-lg bg-yellow-50 px-3 py-2 text-sm text-yellow-800" role="status">
          This course is <strong>{course.status.replace(/_/g, ' ')}</strong> and can no longer be edited.
        </div>
      )}

      {tasksLoading ? (
        <p className="text-sm text-gray-500">Loading tasks…</p>
      ) : (
        <TaskTable
          learningPlanId={plan.id}
          courseId={Number(courseId)}
          tasks={tasks ?? []}
          isEditable={isEditable}
        />
      )}
    </div>
  );
}

function TaskTable({
  learningPlanId,
  courseId,
  tasks,
  isEditable,
}: {
  learningPlanId: number;
  courseId: number;
  tasks: DailyTask[];
  isEditable: boolean;
}) {
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const deleteTask = useDeleteDailyTask(learningPlanId);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  async function handleDelete(task: DailyTask) {
    if (!confirm(`Delete task "${task.title}" (Day ${task.day_number})?`)) return;
    setDeleteError(null);
    try {
      await deleteTask.mutateAsync(task.id);
    } catch (err) {
      setDeleteError(err instanceof ApiError ? err.message : 'Failed to delete task.');
    }
  }

  return (
    <Card>
      {deleteError && <p className="mb-3 text-sm text-red-600">{deleteError}</p>}

      {tasks.length === 0 ? (
        <p className="text-sm text-gray-500">No daily tasks yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100 text-sm">
            <thead>
              <tr className="text-left text-xs font-semibold uppercase tracking-wide text-gray-400">
                <th className="py-2 pr-3">Day</th>
                <th className="py-2 pr-3">Title</th>
                <th className="py-2 pr-3">Type</th>
                <th className="py-2 pr-3">Points</th>
                <th className="py-2 pr-3">Due</th>
                <th className="py-2 pr-3">Submission</th>
                {isEditable && <th className="py-2 pr-3">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {tasks.map((task) => (
                <Fragment key={task.id}>
                  <tr>
                    <td className="py-2 pr-3">{task.day_number}</td>
                    <td className="py-2 pr-3 font-medium text-gray-800">{task.title}</td>
                    <td className="py-2 pr-3 text-gray-500">{task.task_type || '—'}</td>
                    <td className="py-2 pr-3">{task.points}</td>
                    <td className="py-2 pr-3 text-gray-500">
                      {task.due_time ? new Date(task.due_time).toLocaleString() : '—'}
                    </td>
                    <td className="py-2 pr-3 text-gray-500">{task.submission_type}</td>
                    {isEditable && (
                      <td className="py-2 pr-3">
                        <div className="flex gap-2 text-xs">
                          <button
                            type="button"
                            onClick={() => setEditingId(editingId === task.id ? null : task.id)}
                            className="rounded-lg border border-gray-300 px-2 py-1 font-medium text-gray-700 hover:bg-gray-50"
                          >
                            {editingId === task.id ? 'Close' : 'Edit'}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(task)}
                            className="rounded-lg border border-red-300 px-2 py-1 font-medium text-red-700 hover:bg-red-50"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                  {editingId === task.id && (
                    <tr>
                      <td colSpan={7} className="bg-gray-50 p-3">
                        <TaskForm
                          learningPlanId={learningPlanId}
                          courseId={courseId}
                          initial={taskToFormValues(task)}
                          taskId={task.id}
                          onDone={() => setEditingId(null)}
                        />
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isEditable && (
        <div className="mt-4 border-t border-gray-100 pt-4">
          {showCreate ? (
            <TaskForm
              learningPlanId={learningPlanId}
              courseId={courseId}
              onDone={() => setShowCreate(false)}
            />
          ) : (
            <button
              type="button"
              onClick={() => setShowCreate(true)}
              className="text-sm font-semibold text-indigo-600 hover:text-indigo-500"
            >
              + Add Daily Task
            </button>
          )}
        </div>
      )}
    </Card>
  );
}

function TaskForm({
  learningPlanId,
  courseId,
  initial,
  taskId,
  onDone,
}: {
  learningPlanId: number;
  courseId: number;
  initial?: TaskFormValues;
  taskId?: number;
  onDone: () => void;
}) {
  const createTask = useCreateDailyTask(learningPlanId);
  const updateTask = useUpdateDailyTask(learningPlanId);
  const [values, setValues] = useState<TaskFormValues>(initial ?? EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof TaskFormValues>(key: K, value: TaskFormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const payload = {
      learning_plan_id: learningPlanId,
      course_id: courseId,
      day_number: Number(values.day_number),
      title: values.title,
      description: values.description || null,
      task_type: values.task_type || null,
      estimated_minutes: values.estimated_minutes ? Number(values.estimated_minutes) : null,
      points: values.points ? Number(values.points) : null,
      // due_time is REQUIRED by the backend (StoreDailyTaskRequest) — the
      // <input type="datetime-local"> value has no seconds/timezone; new
      // Date(...).toISOString() normalizes it to a format Carbon::parse accepts.
      due_time: new Date(values.due_time).toISOString(),
      difficulty: values.difficulty || null,
      completion_criteria: values.completion_criteria || null,
      resource_link: values.resource_link || null,
      video_link: values.video_link || null,
      submission_type: values.submission_type,
    };

    try {
      if (taskId) {
        await updateTask.mutateAsync({ dailyTaskId: taskId, payload });
      } else {
        await createTask.mutateAsync(payload);
      }
      onDone();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to save task.');
    }
  }

  const isPending = createTask.isPending || updateTask.isPending;

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div>
          <label className="block text-xs font-medium text-gray-700">Day #</label>
          <input
            type="number"
            min={1}
            required
            value={values.day_number}
            onChange={(e) => set('day_number', e.target.value)}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
        <div className="col-span-2 sm:col-span-2">
          <label className="block text-xs font-medium text-gray-700">Title</label>
          <input
            required
            value={values.title}
            onChange={(e) => set('title', e.target.value)}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700">Points</label>
          <input
            type="number"
            min={0}
            value={values.points}
            onChange={(e) => set('points', e.target.value)}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-700">Description</label>
        <textarea
          rows={2}
          value={values.description}
          onChange={(e) => set('description', e.target.value)}
          className="mt-1 block w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div>
          <label className="block text-xs font-medium text-gray-700">Task Type</label>
          <input
            value={values.task_type}
            onChange={(e) => set('task_type', e.target.value)}
            placeholder="e.g. reading"
            className="mt-1 block w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700">Est. Minutes</label>
          <input
            type="number"
            min={0}
            value={values.estimated_minutes}
            onChange={(e) => set('estimated_minutes', e.target.value)}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700">Difficulty</label>
          <input
            value={values.difficulty}
            onChange={(e) => set('difficulty', e.target.value)}
            placeholder="e.g. easy"
            className="mt-1 block w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700">Due Time *</label>
          <input
            type="datetime-local"
            required
            value={values.due_time}
            onChange={(e) => set('due_time', e.target.value)}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-700">Completion Criteria</label>
        <textarea
          rows={2}
          value={values.completion_criteria}
          onChange={(e) => set('completion_criteria', e.target.value)}
          className="mt-1 block w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div>
          <label className="block text-xs font-medium text-gray-700">Resource Link</label>
          <input
            value={values.resource_link}
            onChange={(e) => set('resource_link', e.target.value)}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700">Video Link</label>
          <input
            value={values.video_link}
            onChange={(e) => set('video_link', e.target.value)}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700">Submission Type</label>
          <select
            value={values.submission_type}
            onChange={(e) => set('submission_type', e.target.value as SubmissionType)}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            {SUBMISSION_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
        >
          {isPending ? 'Saving…' : taskId ? 'Update Task' : 'Add Task'}
        </button>
        <button
          type="button"
          onClick={onDone}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
