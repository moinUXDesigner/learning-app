import { useAuthStore } from '../../auth/authStore';
import { DashboardShell } from '../../layouts/DashboardShell';
import { StudentDashboard } from '../student/StudentDashboard';
import { TeacherDashboard } from '../teacher/TeacherDashboard';
import { AdminDashboard } from '../org-admin/AdminDashboard';

/**
 * Role-dispatching container for the generic /dashboard route. Renders each
 * role's real dashboard component directly (all four now exist as of
 * Phase 8) — org_admin and super_admin both render AdminDashboard, which
 * branches on `user.role` internally since GET /api/admin/dashboard returns
 * the same JSON shape for both (see org-admin/AdminDashboard.tsx docblock).
 */
export function Dashboard() {
  const user = useAuthStore((state) => state.user);

  if (!user) return null;

  const content =
    user.role === 'student' ? (
      <StudentDashboard />
    ) : user.role === 'teacher' ? (
      <TeacherDashboard />
    ) : (
      <AdminDashboard />
    );

  return <DashboardShell>{content}</DashboardShell>;
}
