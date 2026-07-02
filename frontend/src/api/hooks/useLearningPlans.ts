import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, ensureCsrfCookie } from '../client';
import type { LearningPlan } from '../../types';

export interface LearningPlanPayload {
  title: string;
  duration_days: number;
  description?: string | null;
  [key: string]: unknown;
}

/** POST /api/courses/{course}/learning-plans */
export function useCreateLearningPlan(courseId: number | string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: LearningPlanPayload) => {
      await ensureCsrfCookie();
      const { data } = await apiClient.post<LearningPlan>(
        `/api/courses/${courseId}/learning-plans`,
        payload,
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses', courseId, 'learning-plans'] });
    },
  });
}

/** PUT /api/learning-plans/{learningPlan} */
export function useUpdateLearningPlan(courseId: number | string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      learningPlanId,
      payload,
    }: {
      learningPlanId: number | string;
      payload: Partial<LearningPlanPayload>;
    }) => {
      await ensureCsrfCookie();
      const { data } = await apiClient.put<LearningPlan>(
        `/api/learning-plans/${learningPlanId}`,
        payload,
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses', courseId, 'learning-plans'] });
    },
  });
}
