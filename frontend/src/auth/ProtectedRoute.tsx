import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from './authStore';
import type { Role } from '../types';

interface ProtectedRouteProps {
  allowedRoles?: Role[];
  children: ReactNode;
}

/**
 * Route guard used to wrap role-specific route groups.
 * - Shows a loading state while auth status is still being determined (app boot).
 * - Redirects to /login if the user isn't authenticated.
 * - Redirects to /not-authorized if allowedRoles is given and the user's role isn't in it.
 * - Otherwise renders children.
 */
export function ProtectedRoute({ allowedRoles, children }: ProtectedRouteProps) {
  const { user, isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/not-authorized" replace />;
  }

  return <>{children}</>;
}
