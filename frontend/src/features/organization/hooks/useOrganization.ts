import { useQuery } from '@tanstack/react-query';
import { getOrganization } from '../api/organizationApi';

export const organizationQueryKey = ['organization'] as const;

export function useOrganization() {
  return useQuery({
    queryKey: organizationQueryKey,
    queryFn: getOrganization,
  });
}
