import { useAppSelector } from '../../../app/hooks';
import { EmptyState } from '../../../components/EmptyState';
import { useOrganizationUsers } from '../hooks/useOrganizationUsers';
import { EMPLOYMENT_TYPE_LABELS, formatSalary } from '../constants';

export function EmployeesPage() {
  const role = useAppSelector((state) => state.auth.user?.role);
  const { data: users, isLoading, isError } = useOrganizationUsers();
  const showSalary = role === 'ADMIN' || role === 'MANAGER';

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold text-slate-900">Employees</h1>

      {isLoading && <p className="text-sm text-slate-500">Loading...</p>}
      {isError && <p className="text-sm text-red-600">Could not load employees.</p>}

      {users && users.length === 0 && (
        <EmptyState
          title="No employees yet"
          description="Employees will appear here once they're added to your organization."
        />
      )}

      {users && users.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Department</th>
                <th className="px-4 py-3">Position</th>
                <th className="px-4 py-3">Employment Type</th>
                {showSalary && <th className="px-4 py-3">Salary</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((user) => (
                <tr key={user.id}>
                  <td className="px-4 py-3 font-medium text-slate-900">{user.name}</td>
                  <td className="px-4 py-3 text-slate-600">{user.email}</td>
                  <td className="px-4 py-3 text-slate-600">{user.role}</td>
                  <td className="px-4 py-3 text-slate-600">{user.department?.name ?? '—'}</td>
                  <td className="px-4 py-3 text-slate-600">{user.position?.title ?? '—'}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {user.employmentType ? EMPLOYMENT_TYPE_LABELS[user.employmentType] : '—'}
                  </td>
                  {showSalary && (
                    <td className="px-4 py-3 text-slate-600">{formatSalary(user.salary)}</td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
