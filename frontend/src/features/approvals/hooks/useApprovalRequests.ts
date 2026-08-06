import { useQuery } from '@tanstack/react-query';
import { listApprovalRequests } from '../api/approvalsApi';

export function approvalRequestsQueryKey(mine: boolean) {
  return ['approval-requests', { mine }] as const;
}

export function useApprovalRequests(mine: boolean) {
  return useQuery({
    queryKey: approvalRequestsQueryKey(mine),
    queryFn: () => listApprovalRequests(mine),
  });
}
