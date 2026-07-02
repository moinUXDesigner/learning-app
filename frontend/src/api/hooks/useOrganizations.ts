import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient, ensureCsrfCookie } from '../client';
import type { Paginated } from '../pagination';
import type { Organization } from '../../types';

/**
 * GET /api/organizations — super_admin sees every organization; any other
 * role only ever sees their own (still paginated, per
 * OrganizationController::index). Used by the Super Admin Organizations
 * page.
 */
export function useOrganizations() {
  return useQuery({
    queryKey: ['organizations'],
    queryFn: async () => {
      const { data } = await apiClient.get<Paginated<Organization>>('/api/organizations');
      return data.data;
    },
  });
}

export interface OrganizationPayload {
  name: string;
  logo?: string | null;
  domain?: string | null;
  subscription_plan_id?: number | null;
  status?: string | null;
}

/** POST /api/organizations — super_admin only (OrganizationPolicy::create). */
export function useCreateOrganization() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: OrganizationPayload) => {
      await ensureCsrfCookie();
      const { data } = await apiClient.post<Organization>('/api/organizations', payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
    },
  });
}

/** PUT /api/organizations/{organization} */
export function useUpdateOrganization() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      organizationId,
      payload,
    }: {
      organizationId: number | string;
      payload: Partial<OrganizationPayload>;
    }) => {
      await ensureCsrfCookie();
      const { data } = await apiClient.put<Organization>(
        `/api/organizations/${organizationId}`,
        payload,
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
    },
  });
}

/** DELETE /api/organizations/{organization} — super_admin only. */
export function useDeleteOrganization() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (organizationId: number | string) => {
      await ensureCsrfCookie();
      await apiClient.delete(`/api/organizations/${organizationId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
    },
  });
}
