import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient, ensureCsrfCookie } from '../client';
import type { Paginated } from '../pagination';
import type { TaskSubmission } from '../../types';

export function useStudentSubmissions() {
  return useQuery({
    queryKey: ['student', 'submissions'],
    queryFn: async () => {
      const { data } = await apiClient.get<Paginated<TaskSubmission>>('/api/student/submissions');
      return data.data;
    },
  });
}

/**
 * Submits a daily task. `payload` should be a FormData when the task's
 * submission_type is 'file'/'screenshot' (so the browser sets the correct
 * multipart boundary); for text/url/github_link a plain object works too,
 * but callers in this app always build FormData for simplicity/consistency.
 */
export function useSubmitTask(dailyTaskId: number | string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: FormData) => {
      await ensureCsrfCookie();
      const { data } = await apiClient.post<TaskSubmission>(
        `/api/tasks/${dailyTaskId}/submit`,
        payload,
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student', 'submissions'] });
      queryClient.invalidateQueries({ queryKey: ['student', 'dashboard'] });
    },
  });
}
