import { type Organization } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { NotFoundError, ValidationError } from '../lib/errors';
import { logAction } from './auditLogger';

export async function getOrganization(id: string): Promise<Organization> {
  const organization = await prisma.organization.findUnique({ where: { id } });
  if (!organization) {
    throw new NotFoundError('Organization not found');
  }
  return organization;
}

export interface SetFeatureFlagInput {
  organizationId: string;
  actorId: string;
  key: string;
  enabled: boolean;
}

export async function setFeatureFlag(input: SetFeatureFlagInput): Promise<Organization> {
  const organization = await getOrganization(input.organizationId);
  const featureFlags = {
    ...(organization.featureFlags as Record<string, boolean>),
    [input.key]: input.enabled,
  };

  return prisma.$transaction(async (tx) => {
    const updated = await tx.organization.update({
      where: { id: input.organizationId },
      data: { featureFlags },
    });

    await logAction(
      {
        actorId: input.actorId,
        action: 'FEATURE_FLAG_TOGGLED',
        entityType: 'Organization',
        entityId: input.organizationId,
        metadata: { key: input.key, enabled: input.enabled },
      },
      tx,
    );

    return updated;
  });
}

export interface SetChangeRequestTemplateInput {
  organizationId: string;
  actorId: string;
  workflowTemplateId: string | null;
}

export async function setChangeRequestTemplate(
  input: SetChangeRequestTemplateInput,
): Promise<Organization> {
  await getOrganization(input.organizationId);

  if (input.workflowTemplateId) {
    const template = await prisma.workflowTemplate.findUnique({
      where: { id: input.workflowTemplateId },
    });
    if (!template || template.organizationId !== input.organizationId) {
      throw new NotFoundError('Workflow template not found');
    }
    if (!template.isChangeRequestTemplate) {
      throw new ValidationError(
        'This template is not enabled for change requests. Enable it when creating a template, or choose a different one.',
      );
    }
  }

  return prisma.$transaction(async (tx) => {
    const updated = await tx.organization.update({
      where: { id: input.organizationId },
      data: { changeRequestTemplateId: input.workflowTemplateId },
    });

    await logAction(
      {
        actorId: input.actorId,
        action: 'CHANGE_REQUEST_TEMPLATE_SET',
        entityType: 'Organization',
        entityId: input.organizationId,
        metadata: { workflowTemplateId: input.workflowTemplateId },
      },
      tx,
    );

    return updated;
  });
}
