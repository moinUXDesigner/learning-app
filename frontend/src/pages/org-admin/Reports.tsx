import { useAdminDashboard } from '../../api/hooks/useDashboard';
import { useAllCourses } from '../../api/hooks/useCourses';
import { Card } from '../../components/Card';
import { ProgressBar } from '../../components/ProgressBar';
import type { CourseStatus } from '../../types';

const STATUS_LABEL: Record<CourseStatus, string> = {
  draft: 'Draft',
  submitted_for_approval: 'Submitted',
  approved: 'Approved',
  rejected: 'Rejected',
  published: 'Published',
  archived: 'Archived',
};

/**
 * Org Admin's Reports page. Extends GET /api/admin/dashboard with a
 * course-approval-status breakdown computed from GET /api/courses (both
 * endpoints are org-scoped for org_admin). Follows the same
 * "call out data gaps explicitly rather than fabricate" pattern established
 * by teacher/Analytics.tsx: the backend has no dedicated reporting
 * endpoint (no CSV export, no time-series/trend data, no per-teacher
 * breakdown) — everything below is derived from the two endpoints already
 * used elsewhere in this app.
 */
export function Reports() {
  const { data: dashboard, isLoading: dashLoading, error: dashError } = useAdminDashboard();
  const { data: courses, isLoading: coursesLoading, error: coursesError } = useAllCourses();

  if (dashLoading || coursesLoading) {
    return <p className="text-sm text-gray-500">Loading reports…</p>;
  }

  if (dashError || coursesError || !dashboard) {
    return <p className="text-sm text-red-600">Couldn&apos;t load reports. Please try again.</p>;
  }

  const statusCounts: Partial<Record<CourseStatus, number>> = {};
  for (const course of courses ?? []) {
    statusCounts[course.status] = (statusCounts[course.status] ?? 0) + 1;
  }
  const totalCourses = courses?.length ?? 0;

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-gray-800">Reports</h1>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Card className="text-center">
          <p className="text-3xl font-bold text-indigo-700">{dashboard.total_users}</p>
          <p className="mt-1 text-sm text-gray-500">Total Users</p>
        </Card>
        <Card className="text-center">
          <p className="text-3xl font-bold text-orange-500">{dashboard.active_students_count}</p>
          <p className="mt-1 text-sm text-gray-500">Active Students</p>
        </Card>
        <Card className="text-center">
          <p className="text-3xl font-bold text-green-600">{dashboard.completion_rate.toFixed(1)}%</p>
          <p className="mt-1 text-sm text-gray-500">Submission Completion Rate</p>
        </Card>
      </div>

      <Card>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
          Course Approval-Status Breakdown
        </h3>
        {totalCourses === 0 ? (
          <p className="text-sm text-gray-500">No courses in your organization yet.</p>
        ) : (
          <div className="space-y-4">
            {(Object.entries(statusCounts) as [CourseStatus, number][]).map(([status, count]) => (
              <ProgressBar
                key={status}
                percent={(count / totalCourses) * 100}
                label={`${STATUS_LABEL[status]} (${count})`}
              />
            ))}
          </div>
        )}
      </Card>

      <Card className="border-dashed">
        <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-400">
          Not Yet Available
        </h3>
        <p className="text-sm text-gray-500">
          The backend does not currently expose a dedicated reporting endpoint — there is no CSV/PDF
          export, no historical trend data (e.g. week-over-week growth), and no per-teacher or
          per-batch performance breakdown anywhere in the API
          (<code className="mx-1 rounded bg-gray-100 px-1 py-0.5 text-xs">AdminDashboardController</code>
          only returns point-in-time totals). Everything above is derived from
          <code className="mx-1 rounded bg-gray-100 px-1 py-0.5 text-xs">GET /api/admin/dashboard</code>
          and <code className="mx-1 rounded bg-gray-100 px-1 py-0.5 text-xs">GET /api/courses</code>.
          Building richer reports would need new backend aggregation support.
        </p>
      </Card>
    </div>
  );
}
