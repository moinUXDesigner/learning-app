import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient, ensureCsrfCookie } from '../client';
import type { Paginated } from '../pagination';
import type { SubscriptionPlan } from '../../types';

/**
 * GET /api/subscription-plans — readable by any authenticated user (an
 * org_admin needs to see plans when choosing/viewing their org's plan);
 * writes are super_admin-gated server-side (SubscriptionPlanController).
 */
export function useSubscriptionPlans() {
  return useQuery({
    queryKey: ['subscription-plans'],
    queryFn: async () => {
      const { data } = await apiClient.get<Paginated<SubscriptionPlan>>('/api/subscription-plans');
      return data.data;
    },
  });
}

export interface SubscriptionPlanPayload {
  name: string;
  price: number;
  max_users?: number | null;
  max_courses?: number | null;
  features?: string[] | null;
}

/** POST /api/subscription-plans — super_admin only. */
export function useCreateSubscriptionPlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: SubscriptionPlanPayload) => {
      await ensureCsrfCookie();
      const { data } = await apiClient.post<SubscriptionPlan>('/api/subscription-plans', payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription-plans'] });
    },
  });
}

/** PUT /api/subscription-plans/{subscriptionPlan} — super_admin only. */
export function useUpdateSubscriptionPlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      planId,
      payload,
    }: {
      planId: number | string;
      payload: Partial<SubscriptionPlanPayload>;
    }) => {
      await ensureCsrfCookie();
      const { data } = await apiClient.put<SubscriptionPlan>(
        `/api/subscription-plans/${planId}`,
        payload,
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription-plans'] });
    },
  });
}

/** DELETE /api/subscription-plans/{subscriptionPlan} — super_admin only. */
export function useDeleteSubscriptionPlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (planId: number | string) => {
      await ensureCsrfCookie();
      await apiClient.delete(`/api/subscription-plans/${planId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription-plans'] });
    },
  });
}
