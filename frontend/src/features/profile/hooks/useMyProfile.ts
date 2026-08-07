import { useQuery } from '@tanstack/react-query';
import { getMyProfile } from '../api/profileApi';

export const myProfileQueryKey = ['my-profile'] as const;

export function useMyProfile() {
  return useQuery({
    queryKey: myProfileQueryKey,
    queryFn: getMyProfile,
  });
}
