import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../auth/authStore';
import { useAllCourses, useCourseWorkflowAction } from '../../api/hooks/useCourses';
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
 * Legal next actions per current status, from the teacher's perspective
 * (mirrors CourseWorkflowService's ALLOWED_TRANSITIONS + isAuthorized rules
 * for the owning teacher): Draft -> submit-approval; Approved -> publish;
 * Rejected -> back to Draft is admin/teacher-owner allowed too, but there's
 * no dedicated "revert" action endpoint distinct from submit-approval, so
 * we only show actions with a real workflow action button (submit-approval
 * from Draft or Rejected isn't legal per the graph — Rejected only goes to
 * Draft, which is an admin-only "revert" action, not something the teacher
 * calls directly here). Submitted/Published/Archived have no teacher-side
 * action.
 */
function legalTeacherActions(status: CourseStatus): { action: CourseWorkflowAction; label: string }[] {
  switch (status) {
    case 'draft':
      return [{ action: 'submit-approval', label: 'Submit for Approval' }];
    case 'approved':
      return [{ action: 'publish', label: 'Publish' }];
    default:
      return [];
  }
}

export function MyCourses() {
  const { user } = useAuthStore();
  const { data: courses, isLoading, error } = useAllCourses();
  const workflowAction = useCourseWorkflowAction();
  const [actionError, setActionError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<number | null>(null);

  if (isLoading) {
    return <p className="text-sm text-gray-500">Loading your courses…</p>;
  }

  if (error) {
    return <p className="text-sm text-red-600">Couldn&apos;t load courses. Please try again.</p>;
  }

  // Course list endpoint (GET /api/courses) is org-scoped only — no
  // created_by filter exists server-side (checked CourseController::index),
  // so we filter to this teacher's own courses client-side.
  const myCourses = (courses ?? []).filter((c: Course) => c.created_by === user?.id);

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
        <h1 className="text-xl font-semibold text-gray-800">My Courses</h1>
        <Link
          to="/teacher/create-course"
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700"
        >
          + Create Course
        </Link>
      </div>

      {actionError && (
        <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
          {actionError}
        </div>
      )}

      {myCourses.length === 0 ? (
        <Card>
          <p className="text-sm text-gray-500">You haven&apos;t created any courses yet.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {myCourses.map((course) => {
            const actions = legalTeacherActions(course.status);
            const canAssign = course.status === 'approved' || course.status === 'published';

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
                {course.status === 'rejected' && course.rejection_reason && (
                  <p className="mt-2 rounded-lg bg-red-50 px-2 py-1 text-xs text-red-700">
                    Rejected: {course.rejection_reason}
                  </p>
                )}

                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                  <Link
                    to={`/teacher/course-builder/${course.id}`}
                    className="rounded-lg border border-gray-300 px-2 py-1 font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Course Builder
                  </Link>
                  <Link
                    to={`/teacher/learning-plan-builder/${course.id}`}
                    className="rounded-lg border border-gray-300 px-2 py-1 font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Learning Plan
                  </Link>
                  <Link
                    to={`/teacher/task-builder/${course.id}`}
                    className="rounded-lg border border-gray-300 px-2 py-1 font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Daily Tasks
                  </Link>
                  {canAssign && (
                    <Link
                      to={`/teacher/assign-course/${course.id}`}
                      className="rounded-lg border border-indigo-300 px-2 py-1 font-medium text-indigo-700 hover:bg-indigo-50"
                    >
                      Assign
                    </Link>
                  )}
                </div>

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
