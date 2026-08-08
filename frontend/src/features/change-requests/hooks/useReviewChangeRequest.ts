import { useMutation, useQueryClient } from '@tanstack/react-query';
import { reviewChangeRequest } from '../api/changeRequestsApi';
import { changeRequestQueryKey } from './useChangeRequest';

export function useReviewChangeRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: reviewChangeRequest,
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['change-requests'] });
      queryClient.invalidateQueries({ queryKey: changeRequestQueryKey(updated.id) });
    },
  });
}
