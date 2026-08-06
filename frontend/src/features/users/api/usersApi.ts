import { apiClient } from '../../../lib/apiClient';
import type { OrganizationUser } from '../types';

export async function listOrganizationUsers(): Promise<OrganizationUser[]> {
  const { data } = await apiClient.get<{ users: OrganizationUser[] }>('/users');
  return data.users;
}
