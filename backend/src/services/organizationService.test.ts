import { prisma } from '../lib/prisma';
import { getOrganization, setChangeRequestTemplate, setFeatureFlag } from './organizationService';
import { NotFoundError, ValidationError } from '../lib/errors';

const now = new Date();

const organization = {
  id: 'org_1',
  name: 'Acme Corp',
  featureFlags: { changeRequests: true },
  changeRequestTemplateId: null,
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

describe('setChangeRequestTemplate', () => {
  it('rejects a template that belongs to a different organization', async () => {
    jest.spyOn(prisma.organization, 'findUnique').mockResolvedValue(organization);
    jest.spyOn(prisma.workflowTemplate, 'findUnique').mockResolvedValue({
      id: 'wft_1',
      name: 'Change Request',
      steps: ['MANAGER'],
      isChangeRequestTemplate: true,
      changeRequestFields: [],
      createdBy: 'user_admin',
      organizationId: 'org_2',
      createdAt: now,
      updatedAt: now,
    });

    await expect(
      setChangeRequestTemplate({
        organizationId: 'org_1',
        actorId: 'user_admin',
        workflowTemplateId: 'wft_1',
      }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it('rejects a template that is not enabled for change requests', async () => {
    jest.spyOn(prisma.organization, 'findUnique').mockResolvedValue(organization);
    jest.spyOn(prisma.workflowTemplate, 'findUnique').mockResolvedValue({
      id: 'wft_1',
      name: 'Expense Approval',
      steps: ['MANAGER'],
      isChangeRequestTemplate: false,
      changeRequestFields: [],
      createdBy: 'user_admin',
      organizationId: 'org_1',
      createdAt: now,
      updatedAt: now,
    });

    await expect(
      setChangeRequestTemplate({
        organizationId: 'org_1',
        actorId: 'user_admin',
        workflowTemplateId: 'wft_1',
      }),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it('sets the template id and logs the change', async () => {
    jest.spyOn(prisma.organization, 'findUnique').mockResolvedValue(organization);
    jest.spyOn(prisma.workflowTemplate, 'findUnique').mockResolvedValue({
      id: 'wft_1',
      name: 'Change Request',
      steps: ['MANAGER'],
      isChangeRequestTemplate: true,
      changeRequestFields: [],
      createdBy: 'user_admin',
      organizationId: 'org_1',
      createdAt: now,
      updatedAt: now,
    });
    mockTransaction();
    jest.spyOn(prisma.organization, 'update').mockResolvedValue({
      ...organization,
      changeRequestTemplateId: 'wft_1',
    });
    jest.spyOn(prisma.auditLog, 'create').mockResolvedValue({
      id: 'audit_1',
      actorId: 'user_admin',
      action: 'CHANGE_REQUEST_TEMPLATE_SET',
      entityType: 'Organization',
      entityId: 'org_1',
      timestamp: now,
      metadata: { workflowTemplateId: 'wft_1' },
    });

    const result = await setChangeRequestTemplate({
      organizationId: 'org_1',
      actorId: 'user_admin',
      workflowTemplateId: 'wft_1',
    });

    expect(prisma.organization.update).toHaveBeenCalledWith({
      where: { id: 'org_1' },
      data: { changeRequestTemplateId: 'wft_1' },
    });
    expect(prisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          actorId: 'user_admin',
          action: 'CHANGE_REQUEST_TEMPLATE_SET',
          entityType: 'Organization',
          entityId: 'org_1',
        }),
      }),
    );
    expect(result.changeRequestTemplateId).toBe('wft_1');
  });

  it('clears the template id when null is passed', async () => {
    jest.spyOn(prisma.organization, 'findUnique').mockResolvedValue({
      ...organization,
      changeRequestTemplateId: 'wft_1',
    });
    mockTransaction();
    jest.spyOn(prisma.organization, 'update').mockResolvedValue({
      ...organization,
      changeRequestTemplateId: null,
    });
    jest.spyOn(prisma.auditLog, 'create').mockResolvedValue({
      id: 'audit_1',
      actorId: 'user_admin',
      action: 'CHANGE_REQUEST_TEMPLATE_SET',
      entityType: 'Organization',
      entityId: 'org_1',
      timestamp: now,
      metadata: { workflowTemplateId: null },
    });

    const result = await setChangeRequestTemplate({
      organizationId: 'org_1',
      actorId: 'user_admin',
      workflowTemplateId: null,
    });

    expect(prisma.organization.update).toHaveBeenCalledWith({
      where: { id: 'org_1' },
      data: { changeRequestTemplateId: null },
    });
    expect(result.changeRequestTemplateId).toBeNull();
  });
});
