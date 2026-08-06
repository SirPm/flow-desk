import { apiClient } from '../../../lib/apiClient';
import type { ApprovalActionType, ApprovalRequest } from '../types';

export async function listApprovalRequests(mine: boolean): Promise<ApprovalRequest[]> {
  const { data } = await apiClient.get<{ approvalRequests: ApprovalRequest[] }>(
    '/approval-requests',
    {
      params: mine ? { mine: 'true' } : undefined,
    },
  );
  return data.approvalRequests;
}

export async function getApprovalRequest(id: string): Promise<ApprovalRequest> {
  const { data } = await apiClient.get<{ approvalRequest: ApprovalRequest }>(
    `/approval-requests/${id}`,
  );
  return data.approvalRequest;
}

export async function createApprovalRequest(workflowTemplateId: string): Promise<ApprovalRequest> {
  const { data } = await apiClient.post<{ approvalRequest: ApprovalRequest }>(
    '/approval-requests',
    {
      workflowTemplateId,
    },
  );
  return data.approvalRequest;
}

export interface ActOnApprovalRequestPayload {
  id: string;
  action: ApprovalActionType;
  note?: string;
}

export async function actOnApprovalRequest({
  id,
  action,
  note,
}: ActOnApprovalRequestPayload): Promise<ApprovalRequest> {
  const { data } = await apiClient.post<{ approvalRequest: ApprovalRequest }>(
    `/approval-requests/${id}/actions`,
    { action, note },
  );
  return data.approvalRequest;
}
