import { readinessSchema } from '@crm/shared';
import { useQuery } from '@tanstack/react-query';
import { apiGet } from './api-client';

export function useReadiness() {
  return useQuery({
    queryKey: ['health', 'ready'],
    queryFn: ({ signal }) =>
      apiGet('/api/v1/health/ready', readinessSchema, { acceptStatuses: [503], signal }),
    refetchInterval: 30_000,
    retry: 1,
  });
}
