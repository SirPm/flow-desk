import { useQuery } from '@tanstack/react-query';
import { listAuditLogs, type ListAuditLogsParams } from '../api/auditLogApi';

export function auditLogsQueryKey(params: ListAuditLogsParams) {
  return ['audit-log', params] as const;
}

export function useAuditLogs(params: ListAuditLogsParams = {}) {
  return useQuery({
    queryKey: auditLogsQueryKey(params),
    queryFn: () => listAuditLogs(params),
  });
}
