import { prisma } from '../lib/prisma';

export async function checkHealth(): Promise<{ status: 'ok' | 'degraded'; db: boolean }> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { status: 'ok', db: true };
  } catch {
    return { status: 'degraded', db: false };
  }
}
