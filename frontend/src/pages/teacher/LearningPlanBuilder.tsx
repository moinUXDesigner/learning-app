import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useCourse, useCourseLearningPlans } from '../../api/hooks/useCourses';
import { useCreateLearningPlan, useUpdateLearningPlan } from '../../api/hooks/useLearningPlans';
import { ApiError } from '../../api/types';
import { Card } from '../../components/Card';

const EDITABLE_STATUSES = ['draft', 'rejected'];

/**
 * A course may have multiple LearningPlan rows per the backend schema, but
 * for MVP the UI treats the first one as "the" plan for the course
 * (create-if-none-exists / edit-if-exists), per the task brief.
 */
export function LearningPlanBuilder() {
  const { courseId } = useParams<{ courseId: string }>();
  const { data: course, isLoading: courseLoading } = useCourse(courseId);
  const { data: plans, isLoading: plansLoading } = useCourseLearningPlans(courseId);
  const createPlan = useCreateLearningPlan(courseId ?? '');
  const updatePlan = useUpdateLearningPlan(courseId ?? '');

  const existingPlan = plans?.[0];

  const [title, setTitle] = useState('');
  const [durationDays, setDurationDays] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (existingPlan) {
      setTitle(existingPlan.title);
      setDurationDays(String(existingPlan.duration_days));
      setDescription(existingPlan.description ?? '');
    }
  }, [existingPlan]);

  if (courseLoading || plansLoading) {
    return <p className="text-sm text-gray-500">Loading learning plan…</p>;
  }

  if (!course || !courseId) {
    return <p className="text-sm text-red-600">Course not found.</p>;
  }

  const isEditable = EDITABLE_STATUSES.includes(course.status);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    const payload = {
      title,
      duration_days: Number(durationDays),
      description: description || null,
    };

    try {
      if (existingPlan) {
        await updatePlan.mutateAsync({ learningPlanId: existingPlan.id, payload });
      } else {
        await createPlan.mutateAsync(payload);
      }
      setSuccess(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to save learning plan.');
    }
  }

  const isPending = createPlan.isPending || updatePlan.isPending;

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-800">Learning Plan — {course.title}</h1>
        <div className="mt-2 flex gap-3 text-sm">
          <Link to="/teacher/my-courses" className="text-indigo-600 hover:text-indigo-500">
            &larr; Back to My Courses
          </Link>
          {existingPlan && (
            <Link to={`/teacher/task-builder/${courseId}`} className="text-indigo-600 hover:text-indigo-500">
              Daily Tasks &rarr;
            </Link>
          )}
        </div>
      </div>

      {!isEditable && (
        <div className="rounded-lg bg-yellow-50 px-3 py-2 text-sm text-yellow-800" role="status">
          This course is <strong>{course.status.replace(/_/g, ' ')}</strong> and can no longer be edited.
        </div>
      )}

      <Card>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
              {error}
            </div>
          )}
          {success && (
            <div className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700" role="status">
              Saved!
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700">Title</label>
            <input
              required
              disabled={!isEditable}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:bg-gray-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Duration (days)</label>
            <input
              type="number"
              min={1}
              required
              disabled={!isEditable}
              value={durationDays}
              onChange={(e) => setDurationDays(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:bg-gray-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              rows={4}
              disabled={!isEditable}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:bg-gray-100"
            />
          </div>

          {isEditable && (
            <button
              type="submit"
              disabled={isPending}
              className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-60"
            >
              {isPending ? 'Saving…' : existingPlan ? 'Update Learning Plan' : 'Create Learning Plan'}
            </button>
          )}
        </form>
      </Card>
    </div>
  );
}
