import { type Organization } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { NotFoundError } from '../lib/errors';
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
