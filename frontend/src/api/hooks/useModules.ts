import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, ensureCsrfCookie } from '../client';
import type { Module } from '../../types';

export interface ModulePayload {
  title: string;
  description?: string | null;
  order?: number | null;
  [key: string]: unknown;
}

/** POST /api/courses/{course}/modules — teacher/org_admin/super_admin only, gated by CoursePolicy::update. */
export function useCreateModule(courseId: number | string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: ModulePayload) => {
      await ensureCsrfCookie();
      const { data } = await apiClient.post<Module>(`/api/courses/${courseId}/modules`, payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses', courseId, 'modules'] });
    },
  });
}

/** PUT /api/modules/{module} */
export function useUpdateModule(courseId: number | string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ moduleId, payload }: { moduleId: number | string; payload: Partial<ModulePayload> }) => {
      await ensureCsrfCookie();
      const { data } = await apiClient.put<Module>(`/api/modules/${moduleId}`, payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses', courseId, 'modules'] });
    },
  });
}

/** DELETE /api/modules/{module} */
export function useDeleteModule(courseId: number | string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (moduleId: number | string) => {
      await ensureCsrfCookie();
      const { data } = await apiClient.delete<{ message: string }>(`/api/modules/${moduleId}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses', courseId, 'modules'] });
    },
  });
}
