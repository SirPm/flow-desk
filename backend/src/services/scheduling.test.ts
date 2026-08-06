import { ChangeRequestStatus } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { applyDueChangeRequests } from './scheduling';

const dueRequest = {
  id: 'cr_due',
  employeeId: 'user_employee',
  fieldChanged: 'position',
  oldValue: 'Associate',
  newValue: 'Senior Associate',
  effectiveDate: new Date('2026-01-01'),
  status: ChangeRequestStatus.SCHEDULED,
  createdAt: new Date('2025-12-01'),
  updatedAt: new Date('2025-12-01'),
};

describe('applyDueChangeRequests', () => {
  it('does nothing when no scheduled requests are due', async () => {
    jest.spyOn(prisma.changeRequest, 'findMany').mockResolvedValue([]);
    const updateManySpy = jest.spyOn(prisma.changeRequest, 'updateMany');

    const result = await applyDueChangeRequests(new Date('2026-01-01'));

    expect(result).toEqual([]);
    expect(updateManySpy).not.toHaveBeenCalled();
  });

  it('flips due scheduled requests to applied', async () => {
    jest.spyOn(prisma.changeRequest, 'findMany').mockResolvedValue([dueRequest]);
    const updateManySpy = jest
      .spyOn(prisma.changeRequest, 'updateMany')
      .mockResolvedValue({ count: 1 });

    const result = await applyDueChangeRequests(new Date('2026-01-02'));

    expect(prisma.changeRequest.findMany).toHaveBeenCalledWith({
      where: {
        status: ChangeRequestStatus.SCHEDULED,
        effectiveDate: { lte: new Date('2026-01-02') },
      },
    });
    expect(updateManySpy).toHaveBeenCalledWith({
      where: { id: { in: ['cr_due'] } },
      data: { status: ChangeRequestStatus.APPLIED },
    });
    expect(result).toEqual([{ ...dueRequest, status: ChangeRequestStatus.APPLIED }]);
  });
});
