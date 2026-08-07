import { apiClient } from '../../../lib/apiClient';
import type { OrganizationUser } from '../../users/types';

export async function getMyProfile(): Promise<OrganizationUser> {
  const { data } = await apiClient.get<{ user: OrganizationUser }>('/users/me');
  return data.user;
}
