import { useMutation } from '@tanstack/react-query';
import { apiClient, ensureCsrfCookie } from '../client';
import type { LessonProgress } from '../../types';

/** POST /api/lessons/{lesson}/progress — beacon endpoint, safe to call repeatedly. */
export function useTrackLessonProgress(lessonId: number | string) {
  return useMutation({
    mutationFn: async (payload: { watched_seconds: number; completed?: boolean }) => {
      await ensureCsrfCookie();
      const { data } = await apiClient.post<LessonProgress>(
        `/api/lessons/${lessonId}/progress`,
        payload,
      );
      return data;
    },
  });
}
