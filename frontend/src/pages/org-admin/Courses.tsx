import { useState } from 'react';
import type { FormEvent } from 'react';
import { useAllCourses, useCreateCourse, useCourseWorkflowAction } from '../../api/hooks/useCourses';
import type { CourseWorkflowAction } from '../../api/hooks/useCourses';
import { ApiError } from '../../api/types';
import { Card } from '../../components/Card';
import type { Course, CourseStatus } from '../../types';

const STATUS_BADGE: Record<CourseStatus, string> = {
  draft: 'bg-gray-100 text-gray-700',
  submitted_for_approval: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-blue-100 text-blue-700',
  rejected: 'bg-red-100 text-red-700',
  published: 'bg-green-100 text-green-700',
  archived: 'bg-gray-200 text-gray-500',
};

const STATUS_LABEL: Record<CourseStatus, string> = {
  draft: 'Draft',
  submitted_for_approval: 'Submitted',
  approved: 'Approved',
  rejected: 'Rejected',
  published: 'Published',
  archived: 'Archived',
};

/**
 * Legal next actions for an org_admin (mirrors CourseWorkflowService's
 * transition graph + CoursePolicy — org_admin can act on any course in
 * their org regardless of who created it): Draft/Submitted -> approve/
 * reject (approve/reject only really make sense from
 * submitted_for_approval, but the dedicated Course Approval queue page is
 * the primary place for that; here we still surface publish/archive since
 * an org_admin manages the full lifecycle) Approved -> publish;
 * Published -> archive.
 */
function legalOrgAdminActions(status: CourseStatus): { action: CourseWorkflowAction; label: string }[] {
  switch (status) {
    case 'draft':
      return [{ action: 'submit-approval', label: 'Submit for Approval' }];
    case 'approved':
      return [{ action: 'publish', label: 'Publish' }];
    case 'published':
      return [{ action: 'archive', label: 'Archive' }];
    default:
      return [];
  }
}

/**
 * Org Admin's Courses page. Org admins can create courses directly
 * (CoursePolicy::create allows teacher/org_admin/super_admin, and
 * POST /api/courses sets organization_id/created_by from the authenticated
 * user server-side — see CourseController::store).
 *
 * Reuse-vs-duplicate decision: rather than linking into the teacher's
 * CreateCourse/CourseBuilder/LearningPlanBuilder/TaskBuilder pages (which
 * would require either duplicating them under /org-admin/* or loosening
 * their route guards — those pages also contain hardcoded
 * `Link to="/teacher/..."` cross-links to each other, so reusing them
 * as-is under an org-admin route would leave dead/wrong links), this page
 * embeds a minimal inline "create course" form using the same
 * useCreateCourse() hook and the same fields as CreateCourse.tsx. Once
 * created, the course sits in Draft; building out its modules/lessons/
 * learning-plan/daily-tasks remains a teacher-side authoring workflow
 * (CourseBuilder etc.) — org_admin's role here is oversight, direct
 * creation when needed, and lifecycle/workflow actions, not curriculum
 * authoring.
 */
export function Courses() {
  const { data: courses, isLoading, error } = useAllCourses();
  const workflowAction = useCourseWorkflowAction();
  const [showCreate, setShowCreate] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<number | null>(null);

  async function runAction(course: Course, action: CourseWorkflowAction) {
    setActionError(null);
    setPendingId(course.id);
    try {
      await workflowAction.mutateAsync({ courseId: course.id, action });
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Action failed. Please try again.');
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-800">Courses</h1>
        <button
          type="button"
          onClick={() => setShowCreate((v) => !v)}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700"
        >
          {showCreate ? 'Cancel' : '+ Create Course'}
        </button>
      </div>

      {showCreate && <CreateCourseInline onDone={() => setShowCreate(false)} />}

      {actionError && (
        <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
          {actionError}
        </div>
      )}

      {isLoading ? (
        <p className="text-sm text-gray-500">Loading courses…</p>
      ) : error ? (
        <p className="text-sm text-red-600">Couldn&apos;t load courses. Please try again.</p>
      ) : !courses || courses.length === 0 ? (
        <Card>
          <p className="text-sm text-gray-500">No courses in your organization yet.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => {
            const actions = legalOrgAdminActions(course.status);
            return (
              <Card key={course.id} className="flex h-full flex-col">
                <div className="flex items-start justify-between gap-2">
                  <h2 className="text-base font-semibold text-gray-800">{course.title}</h2>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGE[course.status]}`}
                  >
                    {STATUS_LABEL[course.status]}
                  </span>
                </div>
                {course.category && (
                  <span className="mt-1 inline-block w-fit rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700">
                    {course.category}
                  </span>
                )}
                <p className="mt-2 line-clamp-3 flex-1 text-sm text-gray-500">{course.description}</p>
                <p className="mt-1 text-xs text-gray-400">Created by user #{course.created_by}</p>
                {course.status === 'rejected' && course.rejection_reason && (
                  <p className="mt-2 rounded-lg bg-red-50 px-2 py-1 text-xs text-red-700">
                    Rejected: {course.rejection_reason}
                  </p>
                )}

                {actions.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2 border-t border-gray-100 pt-3">
                    {actions.map(({ action, label }) => (
                      <button
                        key={action}
                        type="button"
                        disabled={pendingId === course.id}
                        onClick={() => runAction(course, action)}
                        className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
                      >
                        {pendingId === course.id ? 'Working…' : label}
                      </button>
                    ))}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function CreateCourseInline({ onDone }: { onDone: () => void }) {
  const createCourse = useCreateCourse();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [difficultyLevel, setDifficultyLevel] = useState('');
  const [durationDays, setDurationDays] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    try {
      await createCourse.mutateAsync({
        title,
        description: description || null,
        category: category || null,
        difficulty_level: difficultyLevel || null,
        duration_days: durationDays ? Number(durationDays) : null,
      });
      onDone();
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
        setFieldErrors(err.errors ?? {});
      } else {
        setError('Something went wrong. Please try again.');
      }
    }
  }

  return (
    <Card>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
            {error}
          </div>
        )}
        <div>
          <label className="block text-sm font-medium text-gray-700">Title</label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          {fieldErrors.title && <p className="mt-1 text-xs text-red-600">{fieldErrors.title[0]}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Description</label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Category</label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="e.g. Security"
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Difficulty</label>
            <select
              value={difficultyLevel}
              onChange={(e) => setDifficultyLevel(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">Select…</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Duration (days)</label>
          <input
            type="number"
            min={1}
            value={durationDays}
            onChange={(e) => setDurationDays(e.target.value)}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
        <button
          type="submit"
          disabled={createCourse.isPending}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-60"
        >
          {createCourse.isPending ? 'Creating…' : 'Create Course'}
        </button>
      </form>
    </Card>
  );
}
