import { AdminDashboard } from '../org-admin/AdminDashboard';

/**
 * Super Admin's dashboard renders the exact same component as Org Admin's
 * (see org-admin/AdminDashboard.tsx docblock for why: GET /api/admin/dashboard
 * returns an identical JSON shape for both roles, and AdminDashboard already
 * branches on `user.role` for the copy/quick-links that do differ). Kept as
 * a thin named re-export (rather than pointing the route directly at
 * AdminDashboard) so the route table and DashboardShell nav stay readable
 * and each role has its own page module to import from.
 */
export function SaaSDashboard() {
  return <AdminDashboard />;
}
