import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../client';
import type { Paginated } from '../pagination';
import type { Certificate, CertificateVerification } from '../../types';

export function useCertificates() {
  return useQuery({
    queryKey: ['certificates'],
    queryFn: async () => {
      const { data } = await apiClient.get<Paginated<Certificate>>('/api/certificates');
      return data.data;
    },
  });
}

/** Public endpoint — no auth required. */
export function useCertificateVerification(certificateNumber: string | undefined) {
  return useQuery({
    queryKey: ['certificates', 'verify', certificateNumber],
    enabled: !!certificateNumber,
    retry: 0,
    queryFn: async () => {
      const { data } = await apiClient.get<CertificateVerification>(
        `/api/certificates/verify/${certificateNumber}`,
      );
      return data;
    },
  });
}
