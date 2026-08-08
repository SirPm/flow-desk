import { apiClient } from '../../../lib/apiClient';
import type {
  ChangeRequest,
  ChangeRequestDecision,
  ChangeRequestField,
  ChangeRequestStatus,
} from '../types';

export interface ListChangeRequestsParams {
  employeeId?: string;
  status?: ChangeRequestStatus;
}

export async function listChangeRequests(
  params: ListChangeRequestsParams = {},
): Promise<ChangeRequest[]> {
  const { data } = await apiClient.get<{ changeRequests: ChangeRequest[] }>('/change-requests', {
    params,
  });
  return data.changeRequests;
}

export async function getChangeRequestById(id: string): Promise<ChangeRequest> {
  const { data } = await apiClient.get<{ changeRequest: ChangeRequest }>(`/change-requests/${id}`);
  return data.changeRequest;
}

export interface CreateChangeRequestPayload {
  employeeId: string;
  fieldChanged: ChangeRequestField;
  oldValue: string;
  newValue: string;
  effectiveDate: string;
}

export async function createChangeRequest(
  payload: CreateChangeRequestPayload,
): Promise<ChangeRequest> {
  const { data } = await apiClient.post<{ changeRequest: ChangeRequest }>(
    '/change-requests',
    payload,
  );
  return data.changeRequest;
}

export interface ReviewChangeRequestPayload {
  id: string;
  decision: ChangeRequestDecision;
}

export async function reviewChangeRequest({
  id,
  decision,
}: ReviewChangeRequestPayload): Promise<ChangeRequest> {
  const { data } = await apiClient.post<{ changeRequest: ChangeRequest }>(
    `/change-requests/${id}/review`,
    { decision },
  );
  return data.changeRequest;
}
