import { useState } from 'react';
import type { ReactNode } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../auth/authStore';
import type { Role } from '../types';

interface NavItem {
  label: string;
  to: string;
}

const NAV_ITEMS_BY_ROLE: Record<Role, NavItem[]> = {
  student: [
    { label: "Today's Tasks", to: '/student/todays-tasks' },
    { label: 'My Courses', to: '/student/my-courses' },
    { label: 'Progress', to: '/student/progress' },
    { label: 'Scores', to: '/student/scores' },
    { label: 'Certificates', to: '/student/certificates' },
  ],
  teacher: [
    { label: 'My Courses', to: '/teacher/my-courses' },
    { label: 'Create Course', to: '/teacher/create-course' },
    { label: 'Student Progress', to: '/teacher/student-progress' },
    { label: 'Review Submissions', to: '/teacher/review-submissions' },
    { label: 'Analytics', to: '/teacher/analytics' },
  ],
  org_admin: [
    { label: 'Teachers', to: '/org-admin/teachers' },
    { label: 'Students', to: '/org-admin/students' },
    { label: 'Courses', to: '/org-admin/courses' },
    { label: 'Course Approval', to: '/org-admin/course-approval' },
    { label: 'Batches', to: '/org-admin/batches' },
    { label: 'Reports', to: '/org-admin/reports' },
  ],
  super_admin: [
    { label: 'Organizations', to: '/super-admin/organizations' },
    { label: 'Subscription Plans', to: '/super-admin/subscription-plans' },
    { label: 'Analytics', to: '/super-admin/analytics' },
  ],
};

const ROLE_LABELS: Record<Role, string> = {
  student: 'Student',
  teacher: 'Teacher',
  org_admin: 'Org Admin',
  super_admin: 'Super Admin',
};

interface DashboardShellProps {
  children: ReactNode;
}

export function DashboardShell({ children }: DashboardShellProps) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  if (!user) return null;

  const navItems = NAV_ITEMS_BY_ROLE[user.role] ?? [];

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  const sidebarContent = (
    <nav className="flex flex-1 flex-col gap-1 px-3 py-4">
      <NavLink
        to="/dashboard"
        end
        className={({ isActive }) =>
          `rounded-lg px-3 py-2 text-sm font-medium ${
            isActive ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-100'
          }`
        }
        onClick={() => setIsSidebarOpen(false)}
      >
        Dashboard
      </NavLink>
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            `rounded-lg px-3 py-2 text-sm font-medium ${
              isActive ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-100'
            }`
          }
          onClick={() => setIsSidebarOpen(false)}
        >
          {item.label}
        </NavLink>
      ))}
      <div className="my-2 border-t border-gray-100" />
      <NavLink
        to="/profile"
        className={({ isActive }) =>
          `rounded-lg px-3 py-2 text-sm font-medium ${
            isActive ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-100'
          }`
        }
        onClick={() => setIsSidebarOpen(false)}
      >
        Profile
      </NavLink>
    </nav>
  );

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Mobile sidebar overlay */}
      {isSidebarOpen && (
        <button
          type="button"
          aria-label="Close sidebar"
          className="fixed inset-0 z-30 bg-black/30 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed z-40 flex h-full w-64 flex-col border-r border-gray-200 bg-white transition-transform lg:static lg:translate-x-0 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 items-center px-4 text-lg font-bold text-indigo-700">LearnTrack</div>
        {sidebarContent}
      </aside>

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Topbar */}
        <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label="Toggle sidebar"
              className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 lg:hidden"
              onClick={() => setIsSidebarOpen((v) => !v)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <span className="hidden text-sm font-semibold text-gray-800 sm:inline">LearnTrack SaaS</span>
          </div>

          <div className="flex items-center gap-4">
            <Link
              to="/notifications"
              aria-label="Notifications"
              className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.4-1.4A2 2 0 0118 14.2V11a6 6 0 10-12 0v3.2a2 2 0 01-.6 1.4L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </Link>

            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium text-gray-800">{user.name}</p>
              <span className="inline-block rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-semibold text-indigo-700">
                {ROLE_LABELS[user.role]}
              </span>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100"
            >
              Log out
            </button>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
