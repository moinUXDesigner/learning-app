import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, ensureCsrfCookie } from '../client';
import type { DailyTask, SubmissionType } from '../../types';

// Teacher-side create/update/delete for DailyTasks (the read hooks —
// useLearningPlanDailyTasks / useDailyTask — already live in useCourses.ts).
// NOTE: `due_time` is REQUIRED by the backend (StoreDailyTaskRequest /
// UpdateDailyTaskRequest both mark it required), and it must fall within
// the learning plan's day-N..duration_days window (validated server-side —
// see DailyTaskController::validateAgainstPlan). This form should always
// send a due_time.
export interface DailyTaskPayload {
  learning_plan_id: number;
  course_id: number;
  module_id?: number | null;
  lesson_id?: number | null;
  day_number: number;
  title: string;
  description?: string | null;
  task_type?: string | null;
  estimated_minutes?: number | null;
  points?: number | null;
  due_time: string;
  difficulty?: string | null;
  completion_criteria?: string | null;
  resource_link?: string | null;
  video_link?: string | null;
  submission_type?: SubmissionType | null;
  [key: string]: unknown;
}

/** POST /api/learning-plans/{learningPlan}/daily-tasks */
export function useCreateDailyTask(learningPlanId: number | string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: DailyTaskPayload) => {
      await ensureCsrfCookie();
      const { data } = await apiClient.post<DailyTask>(
        `/api/learning-plans/${learningPlanId}/daily-tasks`,
        payload,
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['learning-plans', learningPlanId, 'daily-tasks'] });
    },
  });
}

/** PUT /api/daily-tasks/{dailyTask} */
export function useUpdateDailyTask(learningPlanId: number | string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      dailyTaskId,
      payload,
    }: {
      dailyTaskId: number | string;
      payload: Partial<DailyTaskPayload>;
    }) => {
      await ensureCsrfCookie();
      const { data } = await apiClient.put<DailyTask>(`/api/daily-tasks/${dailyTaskId}`, payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['learning-plans', learningPlanId, 'daily-tasks'] });
    },
  });
}

/** DELETE /api/daily-tasks/{dailyTask} */
export function useDeleteDailyTask(learningPlanId: number | string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dailyTaskId: number | string) => {
      await ensureCsrfCookie();
      const { data } = await apiClient.delete<{ message: string }>(`/api/daily-tasks/${dailyTaskId}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['learning-plans', learningPlanId, 'daily-tasks'] });
    },
  });
}
