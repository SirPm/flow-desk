import { NavLink } from 'react-router-dom';
import { useAppSelector } from '../../app/hooks';
import { useOrganization } from '../../features/organization/hooks/useOrganization';

export function Sidebar() {
  const role = useAppSelector((state) => state.auth.user?.role);
  const { data: organization } = useOrganization();
  const changeRequestsEnabled = organization?.featureFlags.changeRequests !== false;

  const navItems = [
    { to: '/dashboard', label: 'Dashboard', show: true },
    { to: '/workflows', label: 'Workflows', show: true },
    { to: '/approvals', label: 'Approvals', show: true },
    { to: '/change-requests', label: 'Change Requests', show: changeRequestsEnabled },
    { to: '/audit-log', label: 'Audit Log', show: role === 'ADMIN' },
    { to: '/feature-flags', label: 'Feature Flags', show: role === 'ADMIN' },
  ].filter((item) => item.show);

  return (
    <aside className="w-56 shrink-0 border-r border-slate-200 bg-white">
      <div className="flex h-14 items-center border-b border-slate-200 px-4">
        <span className="text-lg font-semibold text-slate-900">Flowdesk</span>
      </div>
      <nav className="flex flex-col gap-1 p-3">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
