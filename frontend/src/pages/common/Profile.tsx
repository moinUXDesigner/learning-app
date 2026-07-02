import { useAuthStore } from '../../auth/authStore';
import { DashboardShell } from '../../layouts/DashboardShell';
import { Card } from '../../components/Card';

const ROLE_LABELS: Record<string, string> = {
  student: 'Student',
  teacher: 'Teacher',
  org_admin: 'Org Admin',
  super_admin: 'Super Admin',
};

/** Read-only profile display. MVP simplification: no edit functionality yet. */
export function Profile() {
  const user = useAuthStore((state) => state.user);

  if (!user) return null;

  return (
    <DashboardShell>
      <div className="mx-auto max-w-lg">
        <h1 className="mb-4 text-xl font-semibold text-gray-800">Your Profile</h1>
        <Card>
          <dl className="divide-y divide-gray-100">
            <div className="flex justify-between py-3">
              <dt className="text-sm text-gray-500">Name</dt>
              <dd className="text-sm font-medium text-gray-800">{user.name}</dd>
            </div>
            <div className="flex justify-between py-3">
              <dt className="text-sm text-gray-500">Email</dt>
              <dd className="text-sm font-medium text-gray-800">{user.email}</dd>
            </div>
            <div className="flex justify-between py-3">
              <dt className="text-sm text-gray-500">Role</dt>
              <dd className="text-sm font-medium text-gray-800">{ROLE_LABELS[user.role] ?? user.role}</dd>
            </div>
            <div className="flex justify-between py-3">
              <dt className="text-sm text-gray-500">Organization</dt>
              <dd className="text-sm font-medium text-gray-800">{user.organization?.name ?? '—'}</dd>
            </div>
            <div className="flex justify-between py-3">
              <dt className="text-sm text-gray-500">Status</dt>
              <dd className="text-sm font-medium capitalize text-gray-800">{user.status}</dd>
            </div>
          </dl>
        </Card>
        <p className="mt-3 text-xs text-gray-400">
          MVP note: profile editing isn&apos;t implemented yet — this page is read-only.
        </p>
      </div>
    </DashboardShell>
  );
}
