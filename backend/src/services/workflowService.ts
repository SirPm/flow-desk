import { type ChangeRequestField, type Role, type WorkflowTemplate } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { NotFoundError } from '../lib/errors';

export interface CreateWorkflowTemplateInput {
  name: string;
  steps: Role[];
  isChangeRequestTemplate?: boolean;
  changeRequestFields?: ChangeRequestField[];
  createdBy: string;
  organizationId: string;
}

export function createWorkflowTemplate(
  input: CreateWorkflowTemplateInput,
): Promise<WorkflowTemplate> {
  return prisma.workflowTemplate.create({
    data: {
      name: input.name,
      steps: input.steps,
      isChangeRequestTemplate: input.isChangeRequestTemplate ?? false,
      changeRequestFields: input.changeRequestFields ?? [],
      createdBy: input.createdBy,
      organizationId: input.organizationId,
    },
  });
}

export function listWorkflowTemplates(organizationId: string): Promise<WorkflowTemplate[]> {
  return prisma.workflowTemplate.findMany({
    where: { organizationId },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getWorkflowTemplateById(
  id: string,
  organizationId: string,
): Promise<WorkflowTemplate> {
  const template = await prisma.workflowTemplate.findUnique({ where: { id } });
  if (!template || template.organizationId !== organizationId) {
    throw new NotFoundError('Workflow template not found');
  }
  return template;
}
