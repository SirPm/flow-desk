import { prisma } from '../lib/prisma';
import { getOrganization, setFeatureFlag } from './organizationService';
import { NotFoundError } from '../lib/errors';

const now = new Date();

const organization = {
  id: 'org_1',
  name: 'Acme Corp',
  featureFlags: { changeRequests: true },
  createdAt: now,
  updatedAt: now,
};

function mockTransaction() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  jest.spyOn(prisma, '$transaction').mockImplementation((fn: any) => fn(prisma));
}

describe('getOrganization', () => {
  it('throws when the organization does not exist', async () => {
    jest.spyOn(prisma.organization, 'findUnique').mockResolvedValue(null);

    await expect(getOrganization('org_missing')).rejects.toBeInstanceOf(NotFoundError);
  });
});

describe('setFeatureFlag', () => {
  it('merges the new key into the existing feature flags and logs the change', async () => {
    jest.spyOn(prisma.organization, 'findUnique').mockResolvedValue(organization);
    mockTransaction();
    jest.spyOn(prisma.organization, 'update').mockResolvedValue({
      ...organization,
      featureFlags: { changeRequests: true, auditLog: false },
    });
    jest.spyOn(prisma.auditLog, 'create').mockResolvedValue({
      id: 'audit_1',
      actorId: 'user_admin',
      action: 'FEATURE_FLAG_TOGGLED',
      entityType: 'Organization',
      entityId: 'org_1',
      timestamp: now,
      metadata: { key: 'auditLog', enabled: false },
    });

    const result = await setFeatureFlag({
      organizationId: 'org_1',
      actorId: 'user_admin',
      key: 'auditLog',
      enabled: false,
    });

    expect(prisma.organization.update).toHaveBeenCalledWith({
      where: { id: 'org_1' },
      data: { featureFlags: { changeRequests: true, auditLog: false } },
    });
    expect(prisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          actorId: 'user_admin',
          action: 'FEATURE_FLAG_TOGGLED',
          entityType: 'Organization',
          entityId: 'org_1',
        }),
      }),
    );
    expect(result.featureFlags).toEqual({ changeRequests: true, auditLog: false });
  });
});
