import type { Role } from '../auth/types';

export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'SKIPPED';
export type ApprovalActionType = 'APPROVE' | 'REJECT' | 'SKIP';

export interface ApprovalAction {
  id: string;
  approvalRequestId: string;
  actorId: string;
  action: ApprovalActionType;
  timestamp: string;
  note: string | null;
}

export interface ApprovalRequest {
  id: string;
  workflowTemplateId: string;
  currentStep: number;
  status: ApprovalStatus;
  requestedBy: string;
  createdAt: string;
  updatedAt: string;
  workflowTemplate: {
    steps: Role[];
    name?: string;
    organizationId?: string;
  };
  actions?: ApprovalAction[];
}
