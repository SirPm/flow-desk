import {
  ApprovalActionType,
  ApprovalStatus,
  Role,
  type ApprovalAction,
  type ApprovalRequest,
  type Prisma,
} from '@prisma/client';
import { prisma } from '../lib/prisma';
import { NotFoundError } from '../lib/errors';
import { advanceApprovalRequest } from './approvalEngine';
import { logAction } from './auditLogger';

type PrismaLike = Pick<typeof prisma, 'approvalRequest' | 'workflowTemplate'>;

export interface CreateApprovalRequestInput {
  workflowTemplateId: string;
  requestedBy: string;
  organizationId: string;
}

export async function createApprovalRequest(
  input: CreateApprovalRequestInput,
  client: PrismaLike = prisma,
): Promise<ApprovalRequest> {
  const template = await client.workflowTemplate.findUnique({
    where: { id: input.workflowTemplateId },
  });
  if (!template || template.organizationId !== input.organizationId) {
    throw new NotFoundError('Workflow template not found');
  }

  return client.approvalRequest.create({
    data: {
      workflowTemplateId: input.workflowTemplateId,
      requestedBy: input.requestedBy,
    },
  });
}

type ApprovalRequestWithTemplate = ApprovalRequest & { workflowTemplate: { steps: Role[] } };

export interface ListApprovalRequestsOptions {
  organizationId: string;
  actorRole: Role;
  onlyMyQueue: boolean;
}

export async function listApprovalRequests(
  options: ListApprovalRequestsOptions,
): Promise<ApprovalRequestWithTemplate[]> {
  const requests = await prisma.approvalRequest.findMany({
    where: { workflowTemplate: { organizationId: options.organizationId } },
    include: { workflowTemplate: { select: { steps: true } } },
    orderBy: { createdAt: 'desc' },
  });

  if (!options.onlyMyQueue) {
    return requests;
  }

  return requests.filter((request) => {
    if (request.status !== ApprovalStatus.PENDING) return false;
    const requiredRole = request.workflowTemplate.steps[request.currentStep];
    return requiredRole === options.actorRole;
  });
}

export async function getApprovalRequestById(
  id: string,
  organizationId: string,
): Promise<ApprovalRequestWithTemplate & { actions: ApprovalAction[] }> {
  const request = await prisma.approvalRequest.findUnique({
    where: { id },
    include: {
      workflowTemplate: { select: { steps: true, name: true, organizationId: true } },
      actions: { orderBy: { timestamp: 'asc' } },
    },
  });

  if (!request || request.workflowTemplate.organizationId !== organizationId) {
    throw new NotFoundError('Approval request not found');
  }

  return request;
}

export interface ActOnApprovalRequestInput {
  id: string;
  organizationId: string;
  actorId: string;
  actorRole: Role;
  decision: ApprovalActionType;
  note?: string;
  onResolved?: (ctx: {
    tx: Prisma.TransactionClient;
    approvalRequest: ApprovalRequest & { actions: ApprovalAction[] };
    resolution: typeof ApprovalStatus.APPROVED | typeof ApprovalStatus.REJECTED;
  }) => Promise<void>;
}

export async function actOnApprovalRequest(
  input: ActOnApprovalRequestInput,
): Promise<ApprovalRequest & { actions: ApprovalAction[] }> {
  const request = await prisma.approvalRequest.findUnique({
    where: { id: input.id },
    include: { workflowTemplate: { select: { steps: true, organizationId: true } } },
  });

  if (!request || request.workflowTemplate.organizationId !== input.organizationId) {
    throw new NotFoundError('Approval request not found');
  }

  const requiredRole = request.workflowTemplate.steps[request.currentStep];

  const result = advanceApprovalRequest({
    request: { currentStep: request.currentStep, status: request.status },
    steps: request.workflowTemplate.steps,
    actorRole: input.actorRole,
    decision: input.decision,
  });

  return prisma.$transaction(async (tx) => {
    const updated = await tx.approvalRequest.update({
      where: { id: input.id },
      data: { currentStep: result.request.currentStep, status: result.request.status },
    });

    await tx.approvalAction.create({
      data: {
        approvalRequestId: input.id,
        actorId: input.actorId,
        action: result.actionType,
        note: input.note,
      },
    });

    const actions = await tx.approvalAction.findMany({
      where: { approvalRequestId: input.id },
      orderBy: { timestamp: 'asc' },
    });

    await logAction(
      {
        actorId: input.actorId,
        action: `APPROVAL_${result.actionType}`,
        entityType: 'ApprovalRequest',
        entityId: input.id,
        metadata: {
          decision: result.actionType,
          note: input.note,
          permissionOverride: input.actorRole === Role.ADMIN && requiredRole !== input.actorRole,
        },
      },
      tx,
    );

    const resolved = { ...updated, actions };

    if (
      input.onResolved &&
      (result.request.status === ApprovalStatus.APPROVED ||
        result.request.status === ApprovalStatus.REJECTED)
    ) {
      await input.onResolved({ tx, approvalRequest: resolved, resolution: result.request.status });
    }

    return resolved;
  });
}
