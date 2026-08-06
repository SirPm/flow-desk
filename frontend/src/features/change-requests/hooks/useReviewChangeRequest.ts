import { useMutation, useQueryClient } from '@tanstack/react-query';
import { reviewChangeRequest } from '../api/changeRequestsApi';

export function useReviewChangeRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: reviewChangeRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['change-requests'] });
    },
  });
}
