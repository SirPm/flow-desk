import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createApprovalRequest } from '../api/approvalsApi';

export function useCreateApprovalRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createApprovalRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approval-requests'] });
    },
  });
}
