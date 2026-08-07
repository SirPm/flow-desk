import { useQuery } from '@tanstack/react-query';
import { listPositions } from '../api/positionsApi';

export const positionsQueryKey = ['positions'] as const;

export function usePositions() {
  return useQuery({
    queryKey: positionsQueryKey,
    queryFn: listPositions,
  });
}
