import { DashboardShell } from '../../layouts/DashboardShell';
import { Card } from '../../components/Card';

/**
 * There is no notifications endpoint in routes/api.php (checked — no
 * `/notifications`, no Notification model/controller referenced anywhere
 * in the route table). Rather than invent a backend contract, this page
 * just renders an empty-state placeholder until a real notifications
 * endpoint is wired up in a future phase.
 */
export function Notifications() {
  return (
    <DashboardShell>
      <div className="mx-auto max-w-lg">
        <h1 className="mb-4 text-xl font-semibold text-gray-800">Notifications</h1>
        <Card className="text-center">
          <p className="text-sm text-gray-500">No notifications yet.</p>
          <p className="mt-1 text-xs text-gray-400">
            (There's no notifications API yet on the backend — this is a placeholder.)
          </p>
        </Card>
      </div>
    </DashboardShell>
  );
}
