import { ApprovalStatus, ChangeRequestField, ChangeRequestStatus, Role } from '@prisma/client';
import { prisma } from '../lib/prisma';
import {
  createChangeRequest,
  listChangeRequests,
  reviewChangeRequest,
} from './changeRequestService';
import { AppError, NotFoundError, ValidationError } from '../lib/errors';

const now = new Date();
const effectiveDate = new Date('2026-09-01');

const employee = {
  id: 'user_employee',
  name: 'Evan Employee',
  email: 'employee@acme.test',
  passwordHash: 'hash',
  role: Role.EMPLOYEE,
  organizationId: 'org_1',
  departmentId: null,
  positionId: null,
  salary: null,
  employmentType: null,
  createdAt: now,
  updatedAt: now,
};

const organization = {
  id: 'org_1',
  name: 'Acme Corp',
  featureFlags: {},
  changeRequestTemplateId: 'wft_change_request',
  createdAt: now,
  updatedAt: now,
};

const workflowTemplate = {
  id: 'wft_change_request',
  name: 'Employee Change Request',
  steps: [Role.MANAGER, Role.ADMIN],
  organizationId: 'org_1',
  createdBy: 'user_admin',
  createdAt: now,
  updatedAt: now,
};

function mockTransaction() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  jest.spyOn(prisma, '$transaction').mockImplementation((fn: any) => fn(prisma));
}

function mockAuditLog() {
  jest.spyOn(prisma.auditLog, 'create').mockResolvedValue({
    id: 'audit_1',
    actorId: 'user_admin',
    action: 'TEST',
    entityType: 'ChangeRequest',
    entityId: 'cr_1',
    timestamp: now,
    metadata: {},
  });
}

function mockApprovalAction() {
  jest.spyOn(prisma.approvalAction, 'create').mockResolvedValue({} as never);
  jest.spyOn(prisma.approvalAction, 'findMany').mockResolvedValue([]);
}

describe('createChangeRequest', () => {
  it('rejects an employee from a different organization', async () => {
    jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(employee);

    await expect(
      createChangeRequest({
        employeeId: 'user_employee',
        fieldChanged: ChangeRequestField.SALARY,
        oldValue: '65000',
        newValue: '72000',
        effectiveDate,
        organizationId: 'org_2',
        actorId: 'user_admin',
      }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it('rejects a salary newValue that is not a non-negative integer', async () => {
    jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(employee);

    await expect(
      createChangeRequest({
        employeeId: 'user_employee',
        fieldChanged: ChangeRequestField.SALARY,
        oldValue: '',
        newValue: 'not-a-number',
        effectiveDate,
        organizationId: 'org_1',
        actorId: 'user_admin',
      }),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it('rejects an employment type newValue outside the fixed enum', async () => {
    jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(employee);

    await expect(
      createChangeRequest({
        employeeId: 'user_employee',
        fieldChanged: ChangeRequestField.EMPLOYMENT_TYPE,
        oldValue: '',
        newValue: 'FREELANCE',
        effectiveDate,
        organizationId: 'org_1',
        actorId: 'user_admin',
      }),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it('rejects a position newValue that does not belong to the organization', async () => {
    jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(employee);
    jest.spyOn(prisma.position, 'findUnique').mockResolvedValue(null);

    await expect(
      createChangeRequest({
        employeeId: 'user_employee',
        fieldChanged: ChangeRequestField.POSITION,
        oldValue: '',
        newValue: 'pos_unknown',
        effectiveDate,
        organizationId: 'org_1',
        actorId: 'user_admin',
      }),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it('rejects when the organization has no default change-request template configured', async () => {
    jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(employee);
    jest.spyOn(prisma.organization, 'findUnique').mockResolvedValue({
      ...organization,
      changeRequestTemplateId: null,
    });

    await expect(
      createChangeRequest({
        employeeId: 'user_employee',
        fieldChanged: ChangeRequestField.EMPLOYMENT_TYPE,
        oldValue: '',
        newValue: 'FULL_TIME',
        effectiveDate,
        organizationId: 'org_1',
        actorId: 'user_admin',
      }),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it('creates a pending change request backed by an approval request, and logs it', async () => {
    jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(employee);
    jest.spyOn(prisma.organization, 'findUnique').mockResolvedValue(organization);
    jest.spyOn(prisma.workflowTemplate, 'findUnique').mockResolvedValue(workflowTemplate);
    mockTransaction();
    mockAuditLog();
    jest.spyOn(prisma.approvalRequest, 'create').mockResolvedValue({
      id: 'req_1',
      workflowTemplateId: 'wft_change_request',
      currentStep: 0,
      status: ApprovalStatus.PENDING,
      requestedBy: 'user_admin',
      createdAt: now,
      updatedAt: now,
    });
    jest.spyOn(prisma.changeRequest, 'create').mockResolvedValue({
      id: 'cr_1',
      employeeId: 'user_employee',
      fieldChanged: ChangeRequestField.EMPLOYMENT_TYPE,
      oldValue: '',
      newValue: 'FULL_TIME',
      effectiveDate,
      status: ChangeRequestStatus.PENDING,
      approvalRequestId: 'req_1',
      createdAt: now,
      updatedAt: now,
    });

    const result = await createChangeRequest({
      employeeId: 'user_employee',
      fieldChanged: ChangeRequestField.EMPLOYMENT_TYPE,
      oldValue: '',
      newValue: 'FULL_TIME',
      effectiveDate,
      organizationId: 'org_1',
      actorId: 'user_admin',
    });

    expect(prisma.approvalRequest.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { workflowTemplateId: 'wft_change_request', requestedBy: 'user_admin' },
      }),
    );
    expect(prisma.changeRequest.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          employeeId: 'user_employee',
          fieldChanged: ChangeRequestField.EMPLOYMENT_TYPE,
          oldValue: '',
          newValue: 'FULL_TIME',
          effectiveDate,
          approvalRequestId: 'req_1',
        }),
      }),
    );
    expect(prisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          actorId: 'user_admin',
          action: 'CHANGE_REQUEST_CREATED',
          entityType: 'ChangeRequest',
          entityId: 'cr_1',
        }),
      }),
    );
    expect(result.status).toBe(ChangeRequestStatus.PENDING);
  });
});

describe('listChangeRequests', () => {
  it('scopes the query to the organization and optional filters', async () => {
    jest.spyOn(prisma.changeRequest, 'findMany').mockResolvedValue([]);

    await listChangeRequests({
      organizationId: 'org_1',
      employeeId: 'user_employee',
      status: ChangeRequestStatus.SCHEDULED,
    });

    expect(prisma.changeRequest.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          employee: { organizationId: 'org_1' },
          employeeId: 'user_employee',
          status: ChangeRequestStatus.SCHEDULED,
        },
      }),
    );
  });
});

describe('reviewChangeRequest', () => {
  const pendingRequest = {
    id: 'cr_1',
    employeeId: 'user_employee',
    fieldChanged: ChangeRequestField.EMPLOYMENT_TYPE,
    oldValue: '',
    newValue: 'FULL_TIME',
    effectiveDate,
    status: ChangeRequestStatus.PENDING,
    approvalRequestId: 'req_1',
    createdAt: now,
    updatedAt: now,
    employee: { organizationId: 'org_1' },
  };

  // Single-step [ADMIN] chain — an ADMIN approval/rejection always resolves on the first call.
  const singleStepApproval = {
    id: 'req_1',
    workflowTemplateId: 'wft_change_request',
    currentStep: 0,
    status: ApprovalStatus.PENDING,
    requestedBy: 'user_employee',
    createdAt: now,
    updatedAt: now,
    workflowTemplate: { steps: [Role.ADMIN], organizationId: 'org_1' },
  };

  // Two-step [MANAGER, ADMIN] chain, at step 0 — a MANAGER approve here leaves it PENDING.
  const midChainApproval = {
    ...singleStepApproval,
    workflowTemplate: { steps: [Role.MANAGER, Role.ADMIN], organizationId: 'org_1' },
  };

  it('approves a pending request into scheduled status and logs it', async () => {
    jest.spyOn(prisma.changeRequest, 'findUnique').mockResolvedValue(pendingRequest);
    jest.spyOn(prisma.approvalRequest, 'findUnique').mockResolvedValue(singleStepApproval);
    mockTransaction();
    mockAuditLog();
    mockApprovalAction();
    jest.spyOn(prisma.approvalRequest, 'update').mockResolvedValue({
      ...singleStepApproval,
      currentStep: 1,
      status: ApprovalStatus.APPROVED,
    });
    jest
      .spyOn(prisma.changeRequest, 'update')
      .mockResolvedValue({ ...pendingRequest, status: ChangeRequestStatus.SCHEDULED });
    jest
      .spyOn(prisma.changeRequest, 'findUniqueOrThrow')
      .mockResolvedValue({ ...pendingRequest, status: ChangeRequestStatus.SCHEDULED });

    const result = await reviewChangeRequest({
      id: 'cr_1',
      organizationId: 'org_1',
      actorId: 'user_admin',
      actorRole: Role.ADMIN,
      decision: 'APPROVE',
    });

    expect(prisma.changeRequest.update).toHaveBeenCalledWith({
      where: { id: 'cr_1' },
      data: { status: ChangeRequestStatus.SCHEDULED },
    });
    expect(prisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          actorId: 'user_admin',
          action: 'CHANGE_REQUEST_APPROVED',
          entityType: 'ChangeRequest',
          entityId: 'cr_1',
        }),
      }),
    );
    expect(result.status).toBe(ChangeRequestStatus.SCHEDULED);
  });

  it('applies a request immediately when its effective date is today or earlier', async () => {
    const dueRequest = {
      ...pendingRequest,
      fieldChanged: ChangeRequestField.SALARY,
      newValue: '80000',
      effectiveDate: now,
    };
    jest.spyOn(prisma.changeRequest, 'findUnique').mockResolvedValue(dueRequest);
    jest.spyOn(prisma.approvalRequest, 'findUnique').mockResolvedValue(singleStepApproval);
    mockTransaction();
    mockAuditLog();
    mockApprovalAction();
    jest.spyOn(prisma.approvalRequest, 'update').mockResolvedValue({
      ...singleStepApproval,
      currentStep: 1,
      status: ApprovalStatus.APPROVED,
    });
    jest.spyOn(prisma.user, 'update').mockResolvedValue(employee);
    jest
      .spyOn(prisma.changeRequest, 'update')
      .mockResolvedValue({ ...dueRequest, status: ChangeRequestStatus.APPLIED });
    jest
      .spyOn(prisma.changeRequest, 'findUniqueOrThrow')
      .mockResolvedValue({ ...dueRequest, status: ChangeRequestStatus.APPLIED });

    const result = await reviewChangeRequest({
      id: 'cr_1',
      organizationId: 'org_1',
      actorId: 'user_admin',
      actorRole: Role.ADMIN,
      decision: 'APPROVE',
    });

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user_employee' },
      data: { salary: 80000 },
    });
    expect(prisma.changeRequest.update).toHaveBeenCalledWith({
      where: { id: 'cr_1' },
      data: { status: ChangeRequestStatus.APPLIED },
    });
    expect(prisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          actorId: 'user_admin',
          action: 'CHANGE_REQUEST_APPROVED',
          entityType: 'ChangeRequest',
          entityId: 'cr_1',
        }),
      }),
    );
    expect(prisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          actorId: 'user_admin',
          action: 'CHANGE_REQUEST_APPLIED',
          entityType: 'ChangeRequest',
          entityId: 'cr_1',
        }),
      }),
    );
    expect(result.status).toBe(ChangeRequestStatus.APPLIED);
  });

  it('rejects a pending request into rejected status', async () => {
    jest.spyOn(prisma.changeRequest, 'findUnique').mockResolvedValue(pendingRequest);
    jest.spyOn(prisma.approvalRequest, 'findUnique').mockResolvedValue(singleStepApproval);
    mockTransaction();
    mockAuditLog();
    mockApprovalAction();
    jest
      .spyOn(prisma.approvalRequest, 'update')
      .mockResolvedValue({ ...singleStepApproval, status: ApprovalStatus.REJECTED });
    jest
      .spyOn(prisma.changeRequest, 'update')
      .mockResolvedValue({ ...pendingRequest, status: ChangeRequestStatus.REJECTED });
    jest
      .spyOn(prisma.changeRequest, 'findUniqueOrThrow')
      .mockResolvedValue({ ...pendingRequest, status: ChangeRequestStatus.REJECTED });

    const result = await reviewChangeRequest({
      id: 'cr_1',
      organizationId: 'org_1',
      actorId: 'user_admin',
      actorRole: Role.ADMIN,
      decision: 'REJECT',
    });

    expect(result.status).toBe(ChangeRequestStatus.REJECTED);
  });

  it('rejects at a non-final step immediately, without waiting for later steps', async () => {
    jest.spyOn(prisma.changeRequest, 'findUnique').mockResolvedValue(pendingRequest);
    jest.spyOn(prisma.approvalRequest, 'findUnique').mockResolvedValue(midChainApproval);
    mockTransaction();
    mockAuditLog();
    mockApprovalAction();
    jest
      .spyOn(prisma.approvalRequest, 'update')
      .mockResolvedValue({ ...midChainApproval, status: ApprovalStatus.REJECTED });
    jest
      .spyOn(prisma.changeRequest, 'update')
      .mockResolvedValue({ ...pendingRequest, status: ChangeRequestStatus.REJECTED });
    jest
      .spyOn(prisma.changeRequest, 'findUniqueOrThrow')
      .mockResolvedValue({ ...pendingRequest, status: ChangeRequestStatus.REJECTED });

    const result = await reviewChangeRequest({
      id: 'cr_1',
      organizationId: 'org_1',
      actorId: 'user_manager',
      actorRole: Role.MANAGER,
      decision: 'REJECT',
    });

    expect(result.status).toBe(ChangeRequestStatus.REJECTED);
  });

  it('leaves the change request pending mid-chain, without applying any side effects', async () => {
    jest.spyOn(prisma.changeRequest, 'findUnique').mockResolvedValue(pendingRequest);
    jest.spyOn(prisma.approvalRequest, 'findUnique').mockResolvedValue(midChainApproval);
    mockTransaction();
    mockAuditLog();
    mockApprovalAction();
    jest
      .spyOn(prisma.approvalRequest, 'update')
      .mockResolvedValue({ ...midChainApproval, currentStep: 1, status: ApprovalStatus.PENDING });
    const changeRequestUpdateSpy = jest.spyOn(prisma.changeRequest, 'update');
    const userUpdateSpy = jest.spyOn(prisma.user, 'update');
    jest.spyOn(prisma.changeRequest, 'findUniqueOrThrow').mockResolvedValue(pendingRequest);

    const result = await reviewChangeRequest({
      id: 'cr_1',
      organizationId: 'org_1',
      actorId: 'user_manager',
      actorRole: Role.MANAGER,
      decision: 'APPROVE',
    });

    expect(changeRequestUpdateSpy).not.toHaveBeenCalled();
    expect(userUpdateSpy).not.toHaveBeenCalled();
    expect(prisma.auditLog.create).not.toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ action: 'CHANGE_REQUEST_APPROVED' }) }),
    );
    expect(result.status).toBe(ChangeRequestStatus.PENDING);
  });

  it('lets an ADMIN act on a step meant for a different role (override)', async () => {
    jest.spyOn(prisma.changeRequest, 'findUnique').mockResolvedValue(pendingRequest);
    jest.spyOn(prisma.approvalRequest, 'findUnique').mockResolvedValue(midChainApproval);
    mockTransaction();
    mockAuditLog();
    mockApprovalAction();
    jest
      .spyOn(prisma.approvalRequest, 'update')
      .mockResolvedValue({ ...midChainApproval, currentStep: 1, status: ApprovalStatus.PENDING });
    jest.spyOn(prisma.changeRequest, 'findUniqueOrThrow').mockResolvedValue(pendingRequest);

    await expect(
      reviewChangeRequest({
        id: 'cr_1',
        organizationId: 'org_1',
        actorId: 'user_admin',
        actorRole: Role.ADMIN,
        decision: 'APPROVE',
      }),
    ).resolves.toBeDefined();
  });

  it('throws when the actor role does not match the required step and is not an admin', async () => {
    jest.spyOn(prisma.changeRequest, 'findUnique').mockResolvedValue(pendingRequest);
    jest.spyOn(prisma.approvalRequest, 'findUnique').mockResolvedValue(midChainApproval);

    await expect(
      reviewChangeRequest({
        id: 'cr_1',
        organizationId: 'org_1',
        actorId: 'user_employee',
        actorRole: Role.EMPLOYEE,
        decision: 'APPROVE',
      }),
    ).rejects.toBeInstanceOf(AppError);
  });

  it('throws when the request no longer belongs to the organization', async () => {
    jest.spyOn(prisma.changeRequest, 'findUnique').mockResolvedValue(pendingRequest);

    await expect(
      reviewChangeRequest({
        id: 'cr_1',
        organizationId: 'org_2',
        actorId: 'user_admin',
        actorRole: Role.ADMIN,
        decision: 'APPROVE',
      }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it('throws when the request is not pending', async () => {
    jest.spyOn(prisma.changeRequest, 'findUnique').mockResolvedValue({
      ...pendingRequest,
      status: ChangeRequestStatus.SCHEDULED,
    });

    await expect(
      reviewChangeRequest({
        id: 'cr_1',
        organizationId: 'org_1',
        actorId: 'user_admin',
        actorRole: Role.ADMIN,
        decision: 'APPROVE',
      }),
    ).rejects.toBeInstanceOf(ValidationError);
  });
});
