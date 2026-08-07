import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createPosition } from '../api/positionsApi';
import { positionsQueryKey } from './usePositions';

export function useCreatePosition() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createPosition,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: positionsQueryKey });
    },
  });
}
