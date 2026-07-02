import { Link } from 'react-router-dom';
import { useAuthStore } from '../../auth/authStore';
import { useAdminDashboard } from '../../api/hooks/useDashboard';
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
 * Shared dashboard for org_admin (/org-admin/dashboard) and super_admin
 * (/super-admin/dashboard). GET /api/admin/dashboard returns the exact same
 * JSON shape for both roles (AdminDashboardController::index) — only the
 * *scope* of the numbers differs server-side (org_admin's counts are
 * filtered to their own organization_id; super_admin's are platform-wide,
 * with no per-organization breakdown in the payload). Rather than
 * duplicating this page under both role folders, it lives once here and is
 * rendered from both /org-admin/dashboard and /super-admin/dashboard
 * routes; the only role-specific bit is the heading/copy and the "quick
 * links" shown at the bottom, chosen via `user.role`.
 */
export function AdminDashboard() {
  const { user } = useAuthStore();
  const { data, isLoading, error } = useAdminDashboard();
  const isSuperAdmin = user?.role === 'super_admin';

  if (isLoading) {
    return <p className="text-sm text-gray-500">Loading dashboard…</p>;
  }

  if (error || !data) {
    return <p className="text-sm text-red-600">Couldn&apos;t load the dashboard. Please try again.</p>;
  }

  const statusEntries = Object.entries(data.course_status_breakdown) as [CourseStatus, number][];

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-gray-800">
        {isSuperAdmin ? 'SaaS Dashboard' : 'Organization Dashboard'}
      </h1>
      {!isSuperAdmin && (
        <p className="-mt-4 text-sm text-gray-500">
          Metrics below are scoped to your organization.
        </p>
      )}
      {isSuperAdmin && (
        <p className="-mt-4 text-sm text-gray-500">
          Platform-wide metrics across every organization.
        </p>
      )}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <Card className="text-center">
          <p className="text-3xl font-bold text-indigo-700">{data.total_users}</p>
          <p className="mt-1 text-sm text-gray-500">Total Users</p>
        </Card>
        <Card className="text-center">
          <p className="text-3xl font-bold text-emerald-600">{data.total_teachers}</p>
          <p className="mt-1 text-sm text-gray-500">Teachers</p>
        </Card>
        <Card className="text-center">
          <p className="text-3xl font-bold text-sky-600">{data.total_students}</p>
          <p className="mt-1 text-sm text-gray-500">Students</p>
        </Card>
        <Card className="text-center">
          <p className="text-3xl font-bold text-purple-600">{data.total_courses}</p>
          <p className="mt-1 text-sm text-gray-500">Courses</p>
        </Card>
        <Card className="text-center">
          <p className="text-3xl font-bold text-orange-500">{data.active_students_count}</p>
          <p className="mt-1 text-sm text-gray-500">Active Students</p>
        </Card>
        <Card className="text-center">
          <p className="text-3xl font-bold text-green-600">{data.completion_rate.toFixed(1)}%</p>
          <p className="mt-1 text-sm text-gray-500">Submission Completion Rate</p>
        </Card>
      </div>

      <Card>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
          Course Status Breakdown
        </h3>
        {statusEntries.length === 0 ? (
          <p className="text-sm text-gray-500">No courses yet.</p>
        ) : (
          <div className="space-y-4">
            {statusEntries.map(([status, count]) => (
              <ProgressBar
                key={status}
                percent={data.total_courses > 0 ? (count / data.total_courses) * 100 : 0}
                label={`${STATUS_LABEL[status] ?? status} (${count})`}
              />
            ))}
          </div>
        )}
      </Card>

      <Card>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">Quick Links</h3>
        <div className="flex flex-wrap gap-2 text-sm">
          {isSuperAdmin ? (
            <>
              <Link to="/super-admin/organizations" className="rounded-lg border border-gray-300 px-3 py-1.5 font-medium text-gray-700 hover:bg-gray-50">
                Organizations
              </Link>
              <Link to="/super-admin/subscription-plans" className="rounded-lg border border-gray-300 px-3 py-1.5 font-medium text-gray-700 hover:bg-gray-50">
                Subscription Plans
              </Link>
              <Link to="/super-admin/analytics" className="rounded-lg border border-gray-300 px-3 py-1.5 font-medium text-gray-700 hover:bg-gray-50">
                Platform Analytics
              </Link>
            </>
          ) : (
            <>
              <Link to="/org-admin/course-approval" className="rounded-lg border border-gray-300 px-3 py-1.5 font-medium text-gray-700 hover:bg-gray-50">
                Course Approval Queue
              </Link>
              <Link to="/org-admin/teachers" className="rounded-lg border border-gray-300 px-3 py-1.5 font-medium text-gray-700 hover:bg-gray-50">
                Manage Teachers
              </Link>
              <Link to="/org-admin/reports" className="rounded-lg border border-gray-300 px-3 py-1.5 font-medium text-gray-700 hover:bg-gray-50">
                Reports
              </Link>
            </>
          )}
        </div>
      </Card>
    </div>
  );
}
