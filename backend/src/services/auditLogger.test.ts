import { prisma } from '../lib/prisma';
import { logAction } from './auditLogger';

const now = new Date();

describe('logAction', () => {
  it('writes an audit log entry with the given fields, defaulting metadata to an empty object', async () => {
    jest.spyOn(prisma.auditLog, 'create').mockResolvedValue({
      id: 'audit_1',
      actorId: 'user_1',
      action: 'TEST_ACTION',
      entityType: 'Thing',
      entityId: 'thing_1',
      timestamp: now,
      metadata: {},
    });

    await logAction({
      actorId: 'user_1',
      action: 'TEST_ACTION',
      entityType: 'Thing',
      entityId: 'thing_1',
    });

    expect(prisma.auditLog.create).toHaveBeenCalledWith({
      data: {
        actorId: 'user_1',
        action: 'TEST_ACTION',
        entityType: 'Thing',
        entityId: 'thing_1',
        metadata: {},
      },
    });
  });

  it('writes against the provided client instead of the default one', async () => {
    const txAuditLog = { create: jest.fn().mockResolvedValue({}) };
    const tx = { auditLog: txAuditLog } as unknown as Parameters<typeof logAction>[1];
    const defaultSpy = jest.spyOn(prisma.auditLog, 'create');

    await logAction(
      { actorId: 'user_1', action: 'TEST_ACTION', entityType: 'Thing', entityId: 'thing_1' },
      tx,
    );

    expect(txAuditLog.create).toHaveBeenCalled();
    expect(defaultSpy).not.toHaveBeenCalled();
  });
});
