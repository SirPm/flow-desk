import { useAppSelector } from '../../../app/hooks';
import { EmptyState } from '../../../components/EmptyState';

export function DashboardPage() {
  const user = useAppSelector((state) => state.auth.user);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">
          Welcome back{user ? `, ${user.name}` : ''}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Signed in as <span className="font-medium text-slate-700">{user?.role}</span>
        </p>
      </div>
      <EmptyState
        title="Nothing to show yet"
        description="Once workflows and approval requests exist, your role-relevant activity will appear here."
      />
    </div>
  );
}
