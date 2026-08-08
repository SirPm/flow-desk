import { useQuery } from '@tanstack/react-query';
import { getChangeRequestById } from '../api/changeRequestsApi';

export function changeRequestQueryKey(id: string) {
  return ['change-request', id] as const;
}

export function useChangeRequest(id: string) {
  return useQuery({
    queryKey: changeRequestQueryKey(id),
    queryFn: () => getChangeRequestById(id),
  });
}
