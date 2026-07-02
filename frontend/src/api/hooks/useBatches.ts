import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient, ensureCsrfCookie } from '../client';
import type { Paginated } from '../pagination';
import type { Batch } from '../../types';

/** GET /api/batches — org-scoped via BelongsToOrganization on the Batch model. */
export function useBatches() {
  return useQuery({
    queryKey: ['batches'],
    queryFn: async () => {
      const { data } = await apiClient.get<Paginated<Batch>>('/api/batches');
      return data.data;
    },
  });
}

export interface BatchPayload {
  name: string;
  teacher_id?: number | null;
  start_date?: string | null;
  end_date?: string | null;
}

/** POST /api/batches — org_admin/super_admin only (BatchPolicy::create). organization_id set server-side. */
export function useCreateBatch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: BatchPayload) => {
      await ensureCsrfCookie();
      const { data } = await apiClient.post<Batch>('/api/batches', payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['batches'] });
    },
  });
}

/** PUT /api/batches/{batch} */
export function useUpdateBatch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      batchId,
      payload,
    }: {
      batchId: number | string;
      payload: Partial<BatchPayload>;
    }) => {
      await ensureCsrfCookie();
      const { data } = await apiClient.put<Batch>(`/api/batches/${batchId}`, payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['batches'] });
    },
  });
}

/** DELETE /api/batches/{batch} */
export function useDeleteBatch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (batchId: number | string) => {
      await ensureCsrfCookie();
      await apiClient.delete(`/api/batches/${batchId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['batches'] });
    },
  });
}
