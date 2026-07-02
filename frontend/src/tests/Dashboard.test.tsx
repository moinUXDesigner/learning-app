import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { Dashboard } from '../pages/common/Dashboard';
import { useAuthStore } from '../auth/authStore';
import { renderWithProviders } from './test-utils';
import { mockAdminUser, mockStudentUser, mockTeacherUser } from './mocks/handlers';

/**
 * Dashboard.tsx (src/pages/common/Dashboard.tsx) is a pure role-dispatch
 * container: it reads `user.role` off the auth store and renders
 * StudentDashboard / TeacherDashboard / AdminDashboard accordingly, each
 * wrapped in DashboardShell. These tests seed the Zustand store directly
 * (bypassing a real login) and assert the right child dashboard — and its
 * real fetched data — renders for each role.
 */
describe('Dashboard role-dispatch', () => {
  it('renders StudentDashboard with fetched XP/streak data for a student user', async () => {
    useAuthStore.setState({ user: mockStudentUser, isAuthenticated: true, isLoading: false });

    renderWithProviders(<Dashboard />);

    expect(await screen.findByText('My Dashboard')).toBeInTheDocument();
    // total_xp: 350 from the /api/student/dashboard MSW handler.
    expect(await screen.findByText('350')).toBeInTheDocument();
    // daily_task_completion_count/total_daily_tasks -> "5/12"
    expect(await screen.findByText('5/12')).toBeInTheDocument();
    // streaks_by_course: { '1': 4 } -> streak count of 4 rendered by StreakWidget
    expect(await screen.findByText('4')).toBeInTheDocument();
  });

  it('renders TeacherDashboard for a teacher user', async () => {
    useAuthStore.setState({ user: mockTeacherUser, isAuthenticated: true, isLoading: false });

    renderWithProviders(<Dashboard />);

    expect(await screen.findByText('Teacher Dashboard')).toBeInTheDocument();
    // pending_reviews_count: 3 from the /api/teacher/dashboard MSW handler.
    expect(await screen.findByText('3')).toBeInTheDocument();
    expect(screen.getByText('Pending Reviews')).toBeInTheDocument();
  });

  it('renders AdminDashboard (org-scoped copy) for an org_admin user', async () => {
    useAuthStore.setState({ user: mockAdminUser, isAuthenticated: true, isLoading: false });

    renderWithProviders(<Dashboard />);

    expect(await screen.findByText('Organization Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Metrics below are scoped to your organization.')).toBeInTheDocument();
    // total_users: 100 from the /api/admin/dashboard MSW handler.
    expect(await screen.findByText('100')).toBeInTheDocument();
  });
});
