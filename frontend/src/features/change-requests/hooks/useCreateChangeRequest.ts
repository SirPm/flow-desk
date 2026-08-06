import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createChangeRequest } from '../api/changeRequestsApi';

export function useCreateChangeRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createChangeRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['change-requests'] });
    },
  });
}
