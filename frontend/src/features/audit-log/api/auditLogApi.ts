import { apiClient } from '../../../lib/apiClient';
import type { AuditLogEntry } from '../types';

export interface ListAuditLogsParams {
  actorId?: string;
  action?: string;
  entityType?: string;
  from?: string;
  to?: string;
}

export async function listAuditLogs(params: ListAuditLogsParams = {}): Promise<AuditLogEntry[]> {
  const { data } = await apiClient.get<{ auditLogs: AuditLogEntry[] }>('/audit-log', { params });
  return data.auditLogs;
}
