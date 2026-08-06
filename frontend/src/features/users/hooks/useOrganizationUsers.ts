import { useQuery } from '@tanstack/react-query';
import { listOrganizationUsers } from '../api/usersApi';

export const organizationUsersQueryKey = ['organization-users'] as const;

export function useOrganizationUsers() {
  return useQuery({
    queryKey: organizationUsersQueryKey,
    queryFn: listOrganizationUsers,
  });
}
