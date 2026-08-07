import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deletePosition } from '../api/positionsApi';
import { positionsQueryKey } from './usePositions';

export function useDeletePosition() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deletePosition,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: positionsQueryKey });
    },
  });
}
