import { useAdminDashboard } from '../../api/hooks/useDashboard';
import { useOrganizations } from '../../api/hooks/useOrganizations';
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
 * Super Admin's Platform Analytics page. GET /api/admin/dashboard as
 * super_admin returns platform-wide totals (see AdminDashboardController —
 * `$isGlobal` bypasses the organization_id filter entirely for
 * super_admin), so this reuses the same hook as org_admin's Reports page.
 *
 * Data-availability gap (documented, not fabricated): the dashboard payload
 * has no per-organization breakdown at all — it's a single set of
 * platform-wide numbers. There is no endpoint anywhere in routes/api.php
 * that returns e.g. "users per organization" or "revenue per plan" in one
 * call; the closest thing is cross-referencing GET /api/organizations
 * (which does include each org's subscription_plan) with the global
 * totals, which is what the "Organizations by Plan" section below does.
 * True per-org usage analytics (course counts, active students, etc. split
 * out by organization_id) would need a new backend aggregate endpoint.
 */
export function PlatformAnalytics() {
  const { data: dashboard, isLoading: dashLoading, error: dashError } = useAdminDashboard();
  const { data: organizations, isLoading: orgsLoading, error: orgsError } = useOrganizations();

  if (dashLoading || orgsLoading) {
    return <p className="text-sm text-gray-500">Loading analytics…</p>;
  }

  if (dashError || orgsError || !dashboard) {
    return <p className="text-sm text-red-600">Couldn&apos;t load analytics. Please try again.</p>;
  }

  const statusEntries = Object.entries(dashboard.course_status_breakdown) as [CourseStatus, number][];

  const planCounts = new Map<string, number>();
  for (const org of organizations ?? []) {
    const planName = org.subscription_plan?.name ?? 'No plan';
    planCounts.set(planName, (planCounts.get(planName) ?? 0) + 1);
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-gray-800">Platform Analytics</h1>
      <p className="-mt-4 text-sm text-gray-500">Aggregated across every organization on the platform.</p>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <Card className="text-center">
          <p className="text-3xl font-bold text-indigo-700">{organizations?.length ?? 0}</p>
          <p className="mt-1 text-sm text-gray-500">Organizations</p>
        </Card>
        <Card className="text-center">
          <p className="text-3xl font-bold text-purple-600">{dashboard.total_users}</p>
          <p className="mt-1 text-sm text-gray-500">Total Users</p>
        </Card>
        <Card className="text-center">
          <p className="text-3xl font-bold text-sky-600">{dashboard.total_courses}</p>
          <p className="mt-1 text-sm text-gray-500">Total Courses</p>
        </Card>
        <Card className="text-center">
          <p className="text-3xl font-bold text-green-600">{dashboard.completion_rate.toFixed(1)}%</p>
          <p className="mt-1 text-sm text-gray-500">Completion Rate</p>
        </Card>
      </div>

      <Card>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
          Platform-wide Course Status
        </h3>
        {statusEntries.length === 0 ? (
          <p className="text-sm text-gray-500">No courses yet.</p>
        ) : (
          <div className="space-y-4">
            {statusEntries.map(([status, count]) => (
              <ProgressBar
                key={status}
                percent={dashboard.total_courses > 0 ? (count / dashboard.total_courses) * 100 : 0}
                label={`${STATUS_LABEL[status] ?? status} (${count})`}
              />
            ))}
          </div>
        )}
      </Card>

      <Card>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
          Organizations by Plan
        </h3>
        {planCounts.size === 0 ? (
          <p className="text-sm text-gray-500">No organizations yet.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {[...planCounts.entries()].map(([planName, count]) => (
              <li key={planName} className="flex items-center justify-between py-2 text-sm">
                <span className="text-gray-700">{planName}</span>
                <span className="font-medium text-gray-800">{count}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card className="border-dashed">
        <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-400">
          Not Yet Available
        </h3>
        <p className="text-sm text-gray-500">
          The admin dashboard endpoint returns platform-wide totals only — there is no
          per-organization breakdown of users/courses/completion rate, and no revenue or
          historical-trend data anywhere in the API
          (<code className="mx-1 rounded bg-gray-100 px-1 py-0.5 text-xs">AdminDashboardController</code>
          returns one flat set of numbers regardless of how many organizations exist). The
          &quot;Organizations by Plan&quot; section above is derived by cross-referencing
          <code className="mx-1 rounded bg-gray-100 px-1 py-0.5 text-xs">GET /api/organizations</code>
          client-side; true per-org usage analytics would need a new backend aggregate endpoint.
        </p>
      </Card>
    </div>
  );
}
