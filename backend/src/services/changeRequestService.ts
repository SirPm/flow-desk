import {
  ApprovalActionType,
  ApprovalStatus,
  ChangeRequestField,
  ChangeRequestStatus,
  EmploymentType,
  Role,
  type ApprovalAction,
  type ChangeRequest,
  type Prisma,
} from '@prisma/client';
import { prisma } from '../lib/prisma';
import { NotFoundError, ValidationError } from '../lib/errors';
import { logAction } from './auditLogger';
import { buildUserUpdateData } from './scheduling';
import { actOnApprovalRequest, createApprovalRequest } from './approvalRequestService';

export interface CreateChangeRequestInput {
  employeeId: string;
  fieldChanged: ChangeRequestField;
  oldValue: string;
  newValue: string;
  effectiveDate: Date;
  organizationId: string;
  actorId: string;
}

async function assertValidFieldValue(
  fieldChanged: ChangeRequestField,
  value: string,
  organizationId: string,
  { allowEmpty }: { allowEmpty: boolean },
): Promise<void> {
  if (allowEmpty && value === '') {
    return;
  }

  switch (fieldChanged) {
    case ChangeRequestField.POSITION: {
      const position = await prisma.position.findUnique({ where: { id: value } });
      if (!position || position.organizationId !== organizationId) {
        throw new ValidationError('Value must be a valid position id for this organization');
      }
      return;
    }
    case ChangeRequestField.DEPARTMENT: {
      const department = await prisma.department.findUnique({ where: { id: value } });
      if (!department || department.organizationId !== organizationId) {
        throw new ValidationError('Value must be a valid department id for this organization');
      }
      return;
    }
    case ChangeRequestField.SALARY: {
      if (!/^\d+$/.test(value)) {
        throw new ValidationError('Value must be a non-negative integer salary');
      }
      return;
    }
    case ChangeRequestField.EMPLOYMENT_TYPE: {
      if (!(Object.values(EmploymentType) as string[]).includes(value)) {
        throw new ValidationError('Value must be one of FULL_TIME, PART_TIME, CONTRACT');
      }
      return;
    }
  }
}

export async function createChangeRequest(input: CreateChangeRequestInput): Promise<ChangeRequest> {
  const employee = await prisma.user.findUnique({ where: { id: input.employeeId } });
  if (!employee || employee.organizationId !== input.organizationId) {
    throw new NotFoundError('Employee not found');
  }

  await assertValidFieldValue(input.fieldChanged, input.oldValue, input.organizationId, {
    allowEmpty: true,
  });
  await assertValidFieldValue(input.fieldChanged, input.newValue, input.organizationId, {
    allowEmpty: false,
  });

  const organization = await prisma.organization.findUnique({
    where: { id: input.organizationId },
  });
  if (!organization?.changeRequestTemplateId) {
    throw new ValidationError(
      'This organization has no default change-request approval template configured. Ask an admin to set one first.',
    );
  }

  const template = await prisma.workflowTemplate.findUnique({
    where: { id: organization.changeRequestTemplateId },
  });
  if (
    template &&
    template.changeRequestFields.length > 0 &&
    !template.changeRequestFields.includes(input.fieldChanged)
  ) {
    throw new ValidationError(
      `The organization's default change-request template does not allow ${input.fieldChanged} changes.`,
    );
  }

  return prisma.$transaction(async (tx) => {
    const approvalRequest = await createApprovalRequest(
      {
        workflowTemplateId: organization.changeRequestTemplateId!,
        requestedBy: input.actorId,
        organizationId: input.organizationId,
      },
      tx,
    );

    const request = await tx.changeRequest.create({
      data: {
        employeeId: input.employeeId,
        fieldChanged: input.fieldChanged,
        oldValue: input.oldValue,
        newValue: input.newValue,
        effectiveDate: input.effectiveDate,
        approvalRequestId: approvalRequest.id,
      },
    });

    await logAction(
      {
        actorId: input.actorId,
        action: 'CHANGE_REQUEST_CREATED',
        entityType: 'ChangeRequest',
        entityId: request.id,
        metadata: {
          employeeId: request.employeeId,
          fieldChanged: request.fieldChanged,
          approvalRequestId: approvalRequest.id,
        },
      },
      tx,
    );

    return request;
  });
}

type ChangeRequestWithEmployee = ChangeRequest & {
  employee: { id: string; name: string; email: string };
  approvalRequest: {
    id: string;
    currentStep: number;
    status: ApprovalStatus;
    workflowTemplate: { steps: Role[]; name: string };
  };
};

const approvalRequestSummarySelect = {
  id: true,
  currentStep: true,
  status: true,
  workflowTemplate: { select: { steps: true, name: true } },
} as const;

export interface ListChangeRequestsOptions {
  organizationId: string;
  employeeId?: string;
  status?: ChangeRequestStatus;
}

export function listChangeRequests(
  options: ListChangeRequestsOptions,
): Promise<ChangeRequestWithEmployee[]> {
  return prisma.changeRequest.findMany({
    where: {
      employee: { organizationId: options.organizationId },
      ...(options.employeeId ? { employeeId: options.employeeId } : {}),
      ...(options.status ? { status: options.status } : {}),
    },
    include: {
      employee: { select: { id: true, name: true, email: true } },
      approvalRequest: { select: approvalRequestSummarySelect },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getChangeRequestById(
  id: string,
  organizationId: string,
): Promise<ChangeRequestWithEmployee & { approvalRequest: { actions: ApprovalAction[] } }> {
  const request = await prisma.changeRequest.findUnique({
    where: { id },
    include: {
      employee: { select: { id: true, name: true, email: true, organizationId: true } },
      approvalRequest: {
        select: {
          ...approvalRequestSummarySelect,
          actions: { orderBy: { timestamp: 'asc' } },
        },
      },
    },
  });

  if (!request || request.employee.organizationId !== organizationId) {
    throw new NotFoundError('Change request not found');
  }

  return request;
}

export type ChangeRequestDecision = 'APPROVE' | 'REJECT';

export interface ReviewChangeRequestInput {
  id: string;
  organizationId: string;
  actorId: string;
  actorRole: Role;
  decision: ChangeRequestDecision;
}

async function applyChangeRequestResolution(
  tx: Prisma.TransactionClient,
  request: ChangeRequest,
  resolution: typeof ApprovalStatus.APPROVED | typeof ApprovalStatus.REJECTED,
  actorId: string,
): Promise<void> {
  if (resolution === ApprovalStatus.REJECTED) {
    await tx.changeRequest.update({
      where: { id: request.id },
      data: { status: ChangeRequestStatus.REJECTED },
    });
    await logAction(
      {
        actorId,
        action: 'CHANGE_REQUEST_REJECTED',
        entityType: 'ChangeRequest',
        entityId: request.id,
      },
      tx,
    );
    return;
  }

  const isEffectiveImmediately = request.effectiveDate <= new Date();
  const status = isEffectiveImmediately
    ? ChangeRequestStatus.APPLIED
    : ChangeRequestStatus.SCHEDULED;

  if (isEffectiveImmediately) {
    await tx.user.update({
      where: { id: request.employeeId },
      data: buildUserUpdateData(request.fieldChanged, request.newValue),
    });
  }

  await tx.changeRequest.update({ where: { id: request.id }, data: { status } });

  await logAction(
    {
      actorId,
      action: 'CHANGE_REQUEST_APPROVED',
      entityType: 'ChangeRequest',
      entityId: request.id,
    },
    tx,
  );

  if (isEffectiveImmediately) {
    await logAction(
      {
        actorId,
        action: 'CHANGE_REQUEST_APPLIED',
        entityType: 'ChangeRequest',
        entityId: request.id,
        metadata: {
          employeeId: request.employeeId,
          fieldChanged: request.fieldChanged,
          newValue: request.newValue,
          automated: false,
        },
      },
      tx,
    );
  }
}

export async function reviewChangeRequest(input: ReviewChangeRequestInput): Promise<ChangeRequest> {
  const request = await prisma.changeRequest.findUnique({
    where: { id: input.id },
    include: { employee: { select: { organizationId: true } } },
  });

  if (!request || request.employee.organizationId !== input.organizationId) {
    throw new NotFoundError('Change request not found');
  }

  if (request.status !== ChangeRequestStatus.PENDING) {
    throw new ValidationError('Only pending change requests can be reviewed');
  }

  const decisionActionType =
    input.decision === 'APPROVE' ? ApprovalActionType.APPROVE : ApprovalActionType.REJECT;

  await actOnApprovalRequest({
    id: request.approvalRequestId,
    organizationId: input.organizationId,
    actorId: input.actorId,
    actorRole: input.actorRole,
    decision: decisionActionType,
    onResolved: ({ tx, resolution }) =>
      applyChangeRequestResolution(tx, request, resolution, input.actorId),
  });

  return prisma.changeRequest.findUniqueOrThrow({ where: { id: input.id } });
}
