import { ApprovalActionType, ApprovalStatus, Role } from '@prisma/client';
import { prisma } from '../lib/prisma';
import {
  actOnApprovalRequest,
  createApprovalRequest,
  listApprovalRequests,
} from './approvalRequestService';
import { NotFoundError } from '../lib/errors';

const now = new Date();

const template = {
  id: 'wft_1',
  name: 'Expense approval',
  steps: [Role.MANAGER, Role.FINANCE],
  createdBy: 'user_admin',
  organizationId: 'org_1',
  createdAt: now,
  updatedAt: now,
};

describe('createApprovalRequest', () => {
  it('rejects a template from a different organization', async () => {
    jest.spyOn(prisma.workflowTemplate, 'findUnique').mockResolvedValue(template);

    await expect(
      createApprovalRequest({
        workflowTemplateId: 'wft_1',
        requestedBy: 'user_1',
        organizationId: 'org_2',
      }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it('creates a pending request at step zero', async () => {
    jest.spyOn(prisma.workflowTemplate, 'findUnique').mockResolvedValue(template);
    jest.spyOn(prisma.approvalRequest, 'create').mockResolvedValue({
      id: 'req_1',
      workflowTemplateId: 'wft_1',
      currentStep: 0,
      status: ApprovalStatus.PENDING,
      requestedBy: 'user_1',
      createdAt: now,
      updatedAt: now,
    });

    await createApprovalRequest({
      workflowTemplateId: 'wft_1',
      requestedBy: 'user_1',
      organizationId: 'org_1',
    });

    expect(prisma.approvalRequest.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { workflowTemplateId: 'wft_1', requestedBy: 'user_1' },
      }),
    );
  });
});

describe('listApprovalRequests', () => {
  const pendingAtManager = {
    id: 'req_manager_step',
    workflowTemplateId: 'wft_1',
    currentStep: 0,
    status: ApprovalStatus.PENDING,
    requestedBy: 'user_1',
    createdAt: now,
    updatedAt: now,
    workflowTemplate: { steps: [Role.MANAGER, Role.FINANCE] },
  };
  const pendingAtFinance = { ...pendingAtManager, id: 'req_finance_step', currentStep: 1 };
  const alreadyApproved = {
    ...pendingAtManager,
    id: 'req_approved',
    status: ApprovalStatus.APPROVED,
  };

  it('returns every organization request when not filtering to the caller queue', async () => {
    jest
      .spyOn(prisma.approvalRequest, 'findMany')
      .mockResolvedValue([pendingAtManager, pendingAtFinance, alreadyApproved]);

    const result = await listApprovalRequests({
      organizationId: 'org_1',
      actorRole: Role.MANAGER,
      onlyMyQueue: false,
    });

    expect(result).toHaveLength(3);
  });

  it('filters "my queue" to pending requests where the current step matches the actor role', async () => {
    jest
      .spyOn(prisma.approvalRequest, 'findMany')
      .mockResolvedValue([pendingAtManager, pendingAtFinance, alreadyApproved]);

    const result = await listApprovalRequests({
      organizationId: 'org_1',
      actorRole: Role.MANAGER,
      onlyMyQueue: true,
    });

    expect(result).toEqual([pendingAtManager]);
  });
});

describe('actOnApprovalRequest', () => {
  it('persists the advanced request and appends an action record atomically', async () => {
    const pendingRequest = {
      id: 'req_1',
      workflowTemplateId: 'wft_1',
      currentStep: 0,
      status: ApprovalStatus.PENDING,
      requestedBy: 'user_1',
      createdAt: now,
      updatedAt: now,
      workflowTemplate: { steps: [Role.MANAGER, Role.FINANCE], organizationId: 'org_1' },
    };
    jest.spyOn(prisma.approvalRequest, 'findUnique').mockResolvedValue(pendingRequest);

    const updatedRequest = { ...pendingRequest, currentStep: 1 };
    jest.spyOn(prisma.approvalRequest, 'update').mockResolvedValue(updatedRequest);
    jest.spyOn(prisma.approvalAction, 'create').mockResolvedValue({
      id: 'action_1',
      approvalRequestId: 'req_1',
      actorId: 'user_manager',
      action: ApprovalActionType.APPROVE,
      timestamp: now,
      note: null,
    });
    jest.spyOn(prisma.approvalAction, 'findMany').mockResolvedValue([]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    jest.spyOn(prisma, '$transaction').mockImplementation((fn: any) => fn(prisma));

    const result = await actOnApprovalRequest({
      id: 'req_1',
      organizationId: 'org_1',
      actorId: 'user_manager',
      actorRole: Role.MANAGER,
      decision: ApprovalActionType.APPROVE,
    });

    expect(prisma.approvalRequest.update).toHaveBeenCalledWith({
      where: { id: 'req_1' },
      data: { currentStep: 1, status: ApprovalStatus.PENDING },
    });
    expect(prisma.approvalAction.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          actorId: 'user_manager',
          action: ApprovalActionType.APPROVE,
        }),
      }),
    );
    expect(result.currentStep).toBe(1);
  });

  it('rejects when the request belongs to a different organization', async () => {
    const requestInOtherOrg = {
      id: 'req_1',
      workflowTemplateId: 'wft_1',
      currentStep: 0,
      status: ApprovalStatus.PENDING,
      requestedBy: 'user_1',
      createdAt: now,
      updatedAt: now,
      workflowTemplate: { steps: [Role.MANAGER], organizationId: 'org_1' },
    };
    jest.spyOn(prisma.approvalRequest, 'findUnique').mockResolvedValue(requestInOtherOrg);

    await expect(
      actOnApprovalRequest({
        id: 'req_1',
        organizationId: 'org_2',
        actorId: 'user_manager',
        actorRole: Role.MANAGER,
        decision: ApprovalActionType.APPROVE,
      }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});
