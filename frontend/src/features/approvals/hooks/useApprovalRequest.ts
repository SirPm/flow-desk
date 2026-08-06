import { useQuery } from '@tanstack/react-query';
import { getApprovalRequest } from '../api/approvalsApi';

export function approvalRequestQueryKey(id: string) {
  return ['approval-request', id] as const;
}

export function useApprovalRequest(id: string) {
  return useQuery({
    queryKey: approvalRequestQueryKey(id),
    queryFn: () => getApprovalRequest(id),
  });
}
