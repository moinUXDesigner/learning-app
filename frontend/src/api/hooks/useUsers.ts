import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient, ensureCsrfCookie } from '../client';
import type { Paginated } from '../pagination';
import type { Role, User } from '../../types';

/**
 * GET /api/users — org-scoped list of users (org_admin/students/teachers in
 * the caller's organization; super_admin sees everyone). Confirmed via a
 * live curl test that a `teacher` role CAN hit this endpoint (no
 * role:org_admin middleware guards it in routes/api.php, and
 * UserController::index only restricts the *query scope*, not who may
 * call it) — so teachers can list their org's students for AssignCourse.
 * Client-side filters to role === 'student'.
 */
export function useOrgStudents() {
  return useQuery({
    queryKey: ['users', 'students'],
    queryFn: async () => {
      const { data } = await apiClient.get<Paginated<User>>('/api/users');
      return data.data.filter((u) => u.role === 'student');
    },
  });
}

/**
 * GET /api/users — full org-scoped user list (no role filter query param
 * exists server-side; UserController::index just scopes by organization_id
 * for non-super_admin callers — confirmed by reading the controller). Used
 * by org_admin's Teachers/Students pages, which filter client-side by
 * `role`.
 */
export function useOrgUsers() {
  return useQuery({
    queryKey: ['users', 'all'],
    queryFn: async () => {
      const { data } = await apiClient.get<Paginated<User>>('/api/users');
      return data.data;
    },
  });
}

export interface CreateUserPayload {
  name: string;
  email: string;
  password?: string;
  role: Role;
  organization_id?: number | null;
}

/**
 * POST /api/users — matches StoreUserRequest's shape. org_admin may only
 * create teacher/student in their own org (organization_id is forced
 * server-side to the actor's own org for org_admin, so it's safe to omit
 * from the payload for that role). If password is omitted, the backend
 * generates one and returns it once as `generated_password`.
 */
export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateUserPayload) => {
      await ensureCsrfCookie();
      const { data } = await apiClient.post<{ user: User; generated_password?: string; message?: string }>(
        '/api/users',
        payload,
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

export interface UpdateUserPayload {
  name?: string;
  email?: string;
  password?: string;
  role?: Role;
  organization_id?: number | null;
  status?: string | null;
}

/** PUT /api/users/{user} */
export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      payload,
    }: {
      userId: number | string;
      payload: UpdateUserPayload;
    }) => {
      await ensureCsrfCookie();
      const { data } = await apiClient.put<User>(`/api/users/${userId}`, payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

/** DELETE /api/users/{user} */
export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: number | string) => {
      await ensureCsrfCookie();
      await apiClient.delete(`/api/users/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}
