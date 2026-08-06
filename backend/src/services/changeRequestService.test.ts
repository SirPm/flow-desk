import { ChangeRequestStatus, Role } from '@prisma/client';
import { prisma } from '../lib/prisma';
import {
  createChangeRequest,
  listChangeRequests,
  reviewChangeRequest,
} from './changeRequestService';
import { NotFoundError, ValidationError } from '../lib/errors';

const now = new Date();
const effectiveDate = new Date('2026-09-01');

const employee = {
  id: 'user_employee',
  name: 'Evan Employee',
  email: 'employee@acme.test',
  passwordHash: 'hash',
  role: Role.EMPLOYEE,
  organizationId: 'org_1',
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

describe('createChangeRequest', () => {
  it('rejects an employee from a different organization', async () => {
    jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(employee);

    await expect(
      createChangeRequest({
        employeeId: 'user_employee',
        fieldChanged: 'position',
        oldValue: 'Associate',
        newValue: 'Senior Associate',
        effectiveDate,
        organizationId: 'org_2',
        actorId: 'user_admin',
      }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it('creates a pending change request and logs it', async () => {
    jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(employee);
    mockTransaction();
    mockAuditLog();
    jest.spyOn(prisma.changeRequest, 'create').mockResolvedValue({
      id: 'cr_1',
      employeeId: 'user_employee',
      fieldChanged: 'position',
      oldValue: 'Associate',
      newValue: 'Senior Associate',
      effectiveDate,
      status: ChangeRequestStatus.PENDING,
      createdAt: now,
      updatedAt: now,
    });

    const result = await createChangeRequest({
      employeeId: 'user_employee',
      fieldChanged: 'position',
      oldValue: 'Associate',
      newValue: 'Senior Associate',
      effectiveDate,
      organizationId: 'org_1',
      actorId: 'user_admin',
    });

    expect(prisma.changeRequest.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          employeeId: 'user_employee',
          fieldChanged: 'position',
          oldValue: 'Associate',
          newValue: 'Senior Associate',
          effectiveDate,
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
    fieldChanged: 'position',
    oldValue: 'Associate',
    newValue: 'Senior Associate',
    effectiveDate,
    status: ChangeRequestStatus.PENDING,
    createdAt: now,
    updatedAt: now,
    employee: { organizationId: 'org_1' },
  };

  it('approves a pending request into scheduled status and logs it', async () => {
    jest.spyOn(prisma.changeRequest, 'findUnique').mockResolvedValue(pendingRequest);
    mockTransaction();
    mockAuditLog();
    jest
      .spyOn(prisma.changeRequest, 'update')
      .mockResolvedValue({ ...pendingRequest, status: ChangeRequestStatus.SCHEDULED });

    const result = await reviewChangeRequest({
      id: 'cr_1',
      organizationId: 'org_1',
      actorId: 'user_admin',
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

  it('rejects a pending request into rejected status', async () => {
    jest.spyOn(prisma.changeRequest, 'findUnique').mockResolvedValue(pendingRequest);
    mockTransaction();
    mockAuditLog();
    jest
      .spyOn(prisma.changeRequest, 'update')
      .mockResolvedValue({ ...pendingRequest, status: ChangeRequestStatus.REJECTED });

    const result = await reviewChangeRequest({
      id: 'cr_1',
      organizationId: 'org_1',
      actorId: 'user_admin',
      decision: 'REJECT',
    });

    expect(result.status).toBe(ChangeRequestStatus.REJECTED);
  });

  it('throws when the request no longer belongs to the organization', async () => {
    jest.spyOn(prisma.changeRequest, 'findUnique').mockResolvedValue(pendingRequest);

    await expect(
      reviewChangeRequest({
        id: 'cr_1',
        organizationId: 'org_2',
        actorId: 'user_admin',
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
        decision: 'APPROVE',
      }),
    ).rejects.toBeInstanceOf(ValidationError);
  });
});
