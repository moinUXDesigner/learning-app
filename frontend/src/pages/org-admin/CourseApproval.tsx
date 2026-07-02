import { useState } from 'react';
import { useAllCourses, useCourseWorkflowAction } from '../../api/hooks/useCourses';
import { ApiError } from '../../api/types';
import { Card } from '../../components/Card';
import type { Course } from '../../types';

/**
 * Org Admin's Course Approval queue: every course currently in
 * submitted_for_approval status, with Approve/Reject actions.
 * CourseController::reject expects an optional `{ reason }` body
 * (validated as nullable|string|max:2000, stored as rejection_reason) — the
 * reject button prompts for a reason via a small inline textarea rather
 * than a native `prompt()` dialog, staying consistent with the rest of the
 * app's form styling.
 */
export function CourseApproval() {
  const { data: courses, isLoading, error } = useAllCourses();
  const workflowAction = useCourseWorkflowAction();
  const [actionError, setActionError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<number | null>(null);
  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [reason, setReason] = useState('');

  const queue = (courses ?? []).filter((c) => c.status === 'submitted_for_approval');

  async function approve(course: Course) {
    setActionError(null);
    setPendingId(course.id);
    try {
      await workflowAction.mutateAsync({ courseId: course.id, action: 'approve' });
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Failed to approve. Please try again.');
    } finally {
      setPendingId(null);
    }
  }

  async function reject(course: Course) {
    setActionError(null);
    setPendingId(course.id);
    try {
      await workflowAction.mutateAsync({ courseId: course.id, action: 'reject', reason: reason || undefined });
      setRejectingId(null);
      setReason('');
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Failed to reject. Please try again.');
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-gray-800">Course Approval Queue</h1>

      {actionError && (
        <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
          {actionError}
        </div>
      )}

      {isLoading ? (
        <p className="text-sm text-gray-500">Loading queue…</p>
      ) : error ? (
        <p className="text-sm text-red-600">Couldn&apos;t load courses. Please try again.</p>
      ) : queue.length === 0 ? (
        <Card>
          <p className="text-sm text-gray-500">Nothing waiting for approval right now.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {queue.map((course) => (
            <Card key={course.id}>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h2 className="text-base font-semibold text-gray-800">{course.title}</h2>
                  <p className="text-xs text-gray-400">
                    Created by user #{course.created_by} • {course.category ?? 'Uncategorized'} •{' '}
                    {course.difficulty_level ?? 'Difficulty n/a'}
                  </p>
                </div>
                <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-800">
                  Submitted
                </span>
              </div>

              {course.description && <p className="mt-2 text-sm text-gray-600">{course.description}</p>}

              {rejectingId === course.id ? (
                <div className="mt-3 space-y-2 border-t border-gray-100 pt-3">
                  <label className="block text-xs font-medium text-gray-700">
                    Rejection reason <span className="text-gray-400">(optional)</span>
                  </label>
                  <textarea
                    rows={2}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={pendingId === course.id}
                      onClick={() => reject(course)}
                      className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-60"
                    >
                      {pendingId === course.id ? 'Rejecting…' : 'Confirm Reject'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setRejectingId(null);
                        setReason('');
                      }}
                      className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mt-3 flex flex-wrap gap-2 border-t border-gray-100 pt-3">
                  <button
                    type="button"
                    disabled={pendingId === course.id}
                    onClick={() => approve(course)}
                    className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700 disabled:opacity-60"
                  >
                    {pendingId === course.id ? 'Approving…' : 'Approve'}
                  </button>
                  <button
                    type="button"
                    disabled={pendingId === course.id}
                    onClick={() => setRejectingId(course.id)}
                    className="rounded-lg border border-red-300 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-60"
                  >
                    Reject
                  </button>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
