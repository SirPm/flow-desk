import { ChangeRequestField, Role } from '@prisma/client';
import { prisma } from '../lib/prisma';
import {
  createWorkflowTemplate,
  getWorkflowTemplateById,
  listWorkflowTemplates,
} from './workflowService';
import { NotFoundError } from '../lib/errors';

const now = new Date();

const template = {
  id: 'wft_1',
  name: 'Expense approval',
  steps: [Role.MANAGER, Role.FINANCE],
  isChangeRequestTemplate: false,
  changeRequestFields: [],
  createdBy: 'user_1',
  organizationId: 'org_1',
  createdAt: now,
  updatedAt: now,
};

describe('workflowService', () => {
  it('creates a template scoped to the creator organization', async () => {
    jest.spyOn(prisma.workflowTemplate, 'create').mockResolvedValue(template);

    const result = await createWorkflowTemplate({
      name: 'Expense approval',
      steps: [Role.MANAGER, Role.FINANCE],
      createdBy: 'user_1',
      organizationId: 'org_1',
    });

    expect(result).toEqual(template);
    expect(prisma.workflowTemplate.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ organizationId: 'org_1' }) }),
    );
  });

  it('defaults isChangeRequestTemplate to false when not provided', async () => {
    jest.spyOn(prisma.workflowTemplate, 'create').mockResolvedValue(template);

    await createWorkflowTemplate({
      name: 'Expense approval',
      steps: [Role.MANAGER, Role.FINANCE],
      createdBy: 'user_1',
      organizationId: 'org_1',
    });

    expect(prisma.workflowTemplate.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ isChangeRequestTemplate: false }),
      }),
    );
  });

  it('passes through an explicit isChangeRequestTemplate opt-in', async () => {
    jest.spyOn(prisma.workflowTemplate, 'create').mockResolvedValue({
      ...template,
      isChangeRequestTemplate: true,
    });

    await createWorkflowTemplate({
      name: 'Position Change',
      steps: [Role.MANAGER, Role.ADMIN],
      isChangeRequestTemplate: true,
      createdBy: 'user_1',
      organizationId: 'org_1',
    });

    expect(prisma.workflowTemplate.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ isChangeRequestTemplate: true }),
      }),
    );
  });

  it('defaults changeRequestFields to an empty (unrestricted) array when not provided', async () => {
    jest.spyOn(prisma.workflowTemplate, 'create').mockResolvedValue(template);

    await createWorkflowTemplate({
      name: 'Expense approval',
      steps: [Role.MANAGER, Role.FINANCE],
      createdBy: 'user_1',
      organizationId: 'org_1',
    });

    expect(prisma.workflowTemplate.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ changeRequestFields: [] }) }),
    );
  });

  it('passes through an explicit changeRequestFields scope', async () => {
    jest.spyOn(prisma.workflowTemplate, 'create').mockResolvedValue({
      ...template,
      changeRequestFields: [ChangeRequestField.POSITION],
    });

    await createWorkflowTemplate({
      name: 'Position Change',
      steps: [Role.MANAGER, Role.ADMIN],
      changeRequestFields: [ChangeRequestField.POSITION],
      createdBy: 'user_1',
      organizationId: 'org_1',
    });

    expect(prisma.workflowTemplate.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ changeRequestFields: [ChangeRequestField.POSITION] }),
      }),
    );
  });

  it('only lists templates scoped to the given organization', async () => {
    jest.spyOn(prisma.workflowTemplate, 'findMany').mockResolvedValue([template]);

    await listWorkflowTemplates('org_1');

    expect(prisma.workflowTemplate.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { organizationId: 'org_1' } }),
    );
  });

  it('returns a template belonging to the requesting organization', async () => {
    jest.spyOn(prisma.workflowTemplate, 'findUnique').mockResolvedValue(template);

    const result = await getWorkflowTemplateById('wft_1', 'org_1');

    expect(result).toEqual(template);
  });

  it('throws NotFoundError when the template belongs to a different organization', async () => {
    jest.spyOn(prisma.workflowTemplate, 'findUnique').mockResolvedValue(template);

    await expect(getWorkflowTemplateById('wft_1', 'org_2')).rejects.toBeInstanceOf(NotFoundError);
  });

  it('throws NotFoundError when the template does not exist', async () => {
    jest.spyOn(prisma.workflowTemplate, 'findUnique').mockResolvedValue(null);

    await expect(getWorkflowTemplateById('missing', 'org_1')).rejects.toBeInstanceOf(NotFoundError);
  });
});
