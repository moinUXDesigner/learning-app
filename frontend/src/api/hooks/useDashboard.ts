import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../client';
import type { AdminDashboardData, StudentDashboardData } from '../../types';

export function useStudentDashboard() {
  return useQuery({
    queryKey: ['student', 'dashboard'],
    queryFn: async () => {
      const { data } = await apiClient.get<StudentDashboardData>('/api/student/dashboard');
      return data;
    },
  });
}

/**
 * GET /api/admin/dashboard — shared endpoint for org_admin and super_admin
 * (role:org_admin,super_admin middleware). See AdminDashboardData for the
 * shape; org_admin gets org-scoped numbers, super_admin gets platform-wide
 * totals, but the JSON shape itself is identical, so one hook/component
 * pair serves both roles.
 */
export function useAdminDashboard() {
  return useQuery({
    queryKey: ['admin', 'dashboard'],
    queryFn: async () => {
      const { data } = await apiClient.get<AdminDashboardData>('/api/admin/dashboard');
      return data;
    },
  });
}
