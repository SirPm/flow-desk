import { useMutation, useQueryClient } from '@tanstack/react-query';
import { actOnApprovalRequest } from '../api/approvalsApi';
import { approvalRequestQueryKey } from './useApprovalRequest';

export function useActOnApprovalRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: actOnApprovalRequest,
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: approvalRequestQueryKey(updated.id) });
      queryClient.invalidateQueries({ queryKey: ['approval-requests'] });
    },
  });
}
