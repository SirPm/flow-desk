import { useState } from 'react';
import { useAppSelector } from '../../../app/hooks';
import { EmptyState } from '../../../components/EmptyState';
import { useOrganizationUsers } from '../../users/hooks/useOrganizationUsers';
import { useAuditLogs } from '../hooks/useAuditLogs';

const KNOWN_ACTIONS = [
  'APPROVAL_APPROVE',
  'APPROVAL_REJECT',
  'APPROVAL_SKIP',
  'CHANGE_REQUEST_CREATED',
  'CHANGE_REQUEST_APPROVED',
  'CHANGE_REQUEST_REJECTED',
  'FEATURE_FLAG_TOGGLED',
];

export function AuditLogPage() {
  const role = useAppSelector((state) => state.auth.user?.role);
  const { data: users } = useOrganizationUsers();
  const [actorId, setActorId] = useState('');
  const [action, setAction] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const {
    data: logs,
    isLoading,
    isError,
  } = useAuditLogs({
    actorId: actorId || undefined,
    action: action || undefined,
    from: from || undefined,
    to: to || undefined,
  });

  if (role !== 'ADMIN') {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-xl font-semibold text-slate-900">Audit Log</h1>
        <EmptyState title="Admins only" description="Ask an admin for access to the audit trail." />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold text-slate-900">Audit Log</h1>

      <div className="flex flex-wrap items-end gap-3 rounded-lg border border-slate-200 bg-white p-4">
        <div className="flex flex-col gap-1">
          <label htmlFor="al-actor" className="text-xs font-medium text-slate-700">
            Actor
          </label>
          <select
            id="al-actor"
            value={actorId}
            onChange={(e) => setActorId(e.target.value)}
            className="rounded-md border border-slate-300 px-2 py-1.5 text-sm"
          >
            <option value="">All actors</option>
            {users?.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="al-action" className="text-xs font-medium text-slate-700">
            Action
          </label>
          <select
            id="al-action"
            value={action}
            onChange={(e) => setAction(e.target.value)}
            className="rounded-md border border-slate-300 px-2 py-1.5 text-sm"
          >
            <option value="">All actions</option>
            {KNOWN_ACTIONS.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="al-from" className="text-xs font-medium text-slate-700">
            From
          </label>
          <input
            id="al-from"
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="rounded-md border border-slate-300 px-2 py-1.5 text-sm"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="al-to" className="text-xs font-medium text-slate-700">
            To
          </label>
          <input
            id="al-to"
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="rounded-md border border-slate-300 px-2 py-1.5 text-sm"
          />
        </div>
      </div>

      {isLoading && <p className="text-sm text-slate-500">Loading...</p>}
      {isError && <p className="text-sm text-red-600">Could not load the audit log.</p>}

      {logs && logs.length === 0 && (
        <EmptyState
          title="No activity recorded yet"
          description="Approval actions, change requests, and permission overrides will be logged here."
        />
      )}

      {logs && logs.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs font-medium uppercase text-slate-500">
              <tr>
                <th className="px-4 py-2">Time</th>
                <th className="px-4 py-2">Actor</th>
                <th className="px-4 py-2">Action</th>
                <th className="px-4 py-2">Entity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.map((log) => (
                <tr key={log.id}>
                  <td className="whitespace-nowrap px-4 py-2 text-slate-500">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="whitespace-nowrap px-4 py-2 text-slate-900">{log.actor.name}</td>
                  <td className="whitespace-nowrap px-4 py-2 font-medium text-slate-700">
                    {log.action}
                  </td>
                  <td className="whitespace-nowrap px-4 py-2 text-slate-500">
                    {log.entityType} &middot; {log.entityId.slice(0, 8)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
