import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, ensureCsrfCookie } from '../client';
import type { Lesson } from '../../types';

export interface LessonPayload {
  title: string;
  content?: string | null;
  video_url?: string | null;
  video_start_seconds?: number | null;
  video_end_seconds?: number | null;
  estimated_minutes?: number | null;
  order?: number | null;
  [key: string]: unknown;
}

/** POST /api/modules/{module}/lessons */
export function useCreateLesson(moduleId: number | string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: LessonPayload) => {
      await ensureCsrfCookie();
      const { data } = await apiClient.post<Lesson>(`/api/modules/${moduleId}/lessons`, payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modules', moduleId, 'lessons'] });
    },
  });
}

/** PUT /api/lessons/{lesson} */
export function useUpdateLesson(moduleId: number | string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ lessonId, payload }: { lessonId: number | string; payload: Partial<LessonPayload> }) => {
      await ensureCsrfCookie();
      const { data } = await apiClient.put<Lesson>(`/api/lessons/${lessonId}`, payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modules', moduleId, 'lessons'] });
    },
  });
}

/** DELETE /api/lessons/{lesson} */
export function useDeleteLesson(moduleId: number | string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (lessonId: number | string) => {
      await ensureCsrfCookie();
      const { data } = await apiClient.delete<{ message: string }>(`/api/lessons/${lessonId}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modules', moduleId, 'lessons'] });
    },
  });
}
