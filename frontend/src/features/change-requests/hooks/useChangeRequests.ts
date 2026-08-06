import { useQuery } from '@tanstack/react-query';
import { listChangeRequests, type ListChangeRequestsParams } from '../api/changeRequestsApi';

export function changeRequestsQueryKey(params: ListChangeRequestsParams) {
  return ['change-requests', params] as const;
}

export function useChangeRequests(params: ListChangeRequestsParams = {}) {
  return useQuery({
    queryKey: changeRequestsQueryKey(params),
    queryFn: () => listChangeRequests(params),
  });
}
