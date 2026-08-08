import { ChangeRequestField, ChangeRequestStatus } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { applyDueChangeRequests } from './scheduling';

const dueRequest = {
  id: 'cr_due',
  employeeId: 'user_employee',
  fieldChanged: ChangeRequestField.POSITION,
  oldValue: 'pos_associate',
  newValue: 'pos_senior_associate',
  effectiveDate: new Date('2026-01-01'),
  status: ChangeRequestStatus.SCHEDULED,
  approvalRequestId: 'req_due',
  createdAt: new Date('2025-12-01'),
  updatedAt: new Date('2025-12-01'),
};

function mockTransaction() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  jest.spyOn(prisma, '$transaction').mockImplementation((fn: any) => fn(prisma));
}

describe('applyDueChangeRequests', () => {
  it('does nothing when no scheduled requests are due', async () => {
    jest.spyOn(prisma.changeRequest, 'findMany').mockResolvedValue([]);
    const userUpdateSpy = jest.spyOn(prisma.user, 'update');

    const result = await applyDueChangeRequests(new Date('2026-01-01'));

    expect(result).toEqual([]);
    expect(userUpdateSpy).not.toHaveBeenCalled();
  });

  it('writes the new value onto the employee, flips the request to applied, and audit logs it', async () => {
    jest.spyOn(prisma.changeRequest, 'findMany').mockResolvedValue([dueRequest]);
    mockTransaction();
    const userUpdateSpy = jest.spyOn(prisma.user, 'update').mockResolvedValue({} as never);
    const changeRequestUpdateSpy = jest
      .spyOn(prisma.changeRequest, 'update')
      .mockResolvedValue({ ...dueRequest, status: ChangeRequestStatus.APPLIED });
    const auditLogSpy = jest.spyOn(prisma.auditLog, 'create').mockResolvedValue({
      id: 'audit_1',
      actorId: 'user_employee',
      action: 'CHANGE_REQUEST_APPLIED',
      entityType: 'ChangeRequest',
      entityId: 'cr_due',
      timestamp: new Date('2026-01-02'),
      metadata: {},
    });

    const result = await applyDueChangeRequests(new Date('2026-01-02'));

    expect(prisma.changeRequest.findMany).toHaveBeenCalledWith({
      where: {
        status: ChangeRequestStatus.SCHEDULED,
        effectiveDate: { lte: new Date('2026-01-02') },
      },
    });
    expect(userUpdateSpy).toHaveBeenCalledWith({
      where: { id: 'user_employee' },
      data: { position: { connect: { id: 'pos_senior_associate' } } },
    });
    expect(changeRequestUpdateSpy).toHaveBeenCalledWith({
      where: { id: 'cr_due' },
      data: { status: ChangeRequestStatus.APPLIED },
    });
    expect(auditLogSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          actorId: 'user_employee',
          action: 'CHANGE_REQUEST_APPLIED',
          entityType: 'ChangeRequest',
          entityId: 'cr_due',
        }),
      }),
    );
    expect(result).toEqual([{ ...dueRequest, status: ChangeRequestStatus.APPLIED }]);
  });

  it('applies a salary change as a numeric update', async () => {
    const salaryRequest = {
      ...dueRequest,
      id: 'cr_salary',
      fieldChanged: ChangeRequestField.SALARY,
      newValue: '80000',
    };
    jest.spyOn(prisma.changeRequest, 'findMany').mockResolvedValue([salaryRequest]);
    mockTransaction();
    const userUpdateSpy = jest.spyOn(prisma.user, 'update').mockResolvedValue({} as never);
    jest
      .spyOn(prisma.changeRequest, 'update')
      .mockResolvedValue({ ...salaryRequest, status: ChangeRequestStatus.APPLIED });
    jest.spyOn(prisma.auditLog, 'create').mockResolvedValue({} as never);

    await applyDueChangeRequests(new Date('2026-01-02'));

    expect(userUpdateSpy).toHaveBeenCalledWith({
      where: { id: 'user_employee' },
      data: { salary: 80000 },
    });
  });
});
