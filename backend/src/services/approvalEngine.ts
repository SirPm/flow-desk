import { ApprovalActionType, ApprovalStatus, Role } from '@prisma/client';
import { AppError } from '../lib/errors';

export interface ApprovalRequestState {
  currentStep: number;
  status: ApprovalStatus;
}

export interface AdvanceApprovalRequestInput {
  request: ApprovalRequestState;
  steps: Role[];
  actorRole: Role;
  decision: ApprovalActionType;
}

export interface AdvanceApprovalRequestResult {
  request: ApprovalRequestState;
  actionType: ApprovalActionType;
}

export function canActOnStep(stepRole: Role, actorRole: Role): boolean {
  return actorRole === stepRole || actorRole === Role.ADMIN;
}

export function advanceApprovalRequest(
  input: AdvanceApprovalRequestInput,
): AdvanceApprovalRequestResult {
  const { request, steps, actorRole, decision } = input;

  if (request.status !== ApprovalStatus.PENDING) {
    throw new AppError(
      409,
      'REQUEST_ALREADY_RESOLVED',
      'This approval request has already been resolved',
    );
  }

  const requiredRole = steps[request.currentStep];
  if (!requiredRole) {
    throw new AppError(500, 'INVALID_WORKFLOW_STATE', 'Approval request has no remaining steps');
  }

  if (!canActOnStep(requiredRole, actorRole)) {
    throw new AppError(
      403,
      'FORBIDDEN',
      `Only a ${requiredRole} (or an admin) can act on this step`,
    );
  }

  if (decision === ApprovalActionType.REJECT) {
    return {
      request: { ...request, status: ApprovalStatus.REJECTED },
      actionType: ApprovalActionType.REJECT,
    };
  }

  const nextStep = request.currentStep + 1;
  const isFinalStep = nextStep >= steps.length;

  return {
    request: {
      currentStep: nextStep,
      status: isFinalStep ? ApprovalStatus.APPROVED : ApprovalStatus.PENDING,
    },
    actionType: decision,
  };
}
