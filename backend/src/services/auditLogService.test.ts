import { prisma } from '../lib/prisma';
import { listAuditLogs } from './auditLogService';

describe('listAuditLogs', () => {
  it('scopes to the organization when no filters are given', async () => {
    jest.spyOn(prisma.auditLog, 'findMany').mockResolvedValue([]);

    await listAuditLogs({ organizationId: 'org_1' });

    expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { actor: { organizationId: 'org_1' } },
      }),
    );
  });

  it('applies actor, action, entityType, and date-range filters', async () => {
    jest.spyOn(prisma.auditLog, 'findMany').mockResolvedValue([]);
    const from = new Date('2026-01-01');
    const to = new Date('2026-02-01');

    await listAuditLogs({
      organizationId: 'org_1',
      actorId: 'user_1',
      action: 'APPROVAL_APPROVE',
      entityType: 'ApprovalRequest',
      from,
      to,
    });

    expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          actor: { organizationId: 'org_1' },
          actorId: 'user_1',
          action: 'APPROVAL_APPROVE',
          entityType: 'ApprovalRequest',
          timestamp: { gte: from, lte: to },
        },
      }),
    );
  });
});
