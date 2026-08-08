import { apiClient } from '../../../lib/apiClient';
import type { Organization } from '../types';

export async function getOrganization(): Promise<Organization> {
  const { data } = await apiClient.get<{ organization: Organization }>('/organizations/me');
  return data.organization;
}

export interface SetFeatureFlagPayload {
  key: string;
  enabled: boolean;
}

export async function setFeatureFlag(payload: SetFeatureFlagPayload): Promise<Organization> {
  const { data } = await apiClient.patch<{ organization: Organization }>(
    '/organizations/feature-flags',
    payload,
  );
  return data.organization;
}

export async function setChangeRequestTemplate(
  workflowTemplateId: string | null,
): Promise<Organization> {
  const { data } = await apiClient.patch<{ organization: Organization }>(
    '/organizations/change-request-template',
    { workflowTemplateId },
  );
  return data.organization;
}
