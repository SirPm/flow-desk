import { useAppSelector } from '../../../app/hooks';
import { EmptyState } from '../../../components/EmptyState';
import { DepartmentList } from '../components/DepartmentList';
import { PositionList } from '../components/PositionList';

export function OrgStructurePage() {
  const role = useAppSelector((state) => state.auth.user?.role);

  if (role !== 'ADMIN') {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-xl font-semibold text-slate-900">Departments &amp; Positions</h1>
        <EmptyState
          title="Admins only"
          description="Ask an admin for access to manage departments and positions."
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold text-slate-900">Departments &amp; Positions</h1>
      <div className="grid gap-4 md:grid-cols-2">
        <DepartmentList />
        <PositionList />
      </div>
    </div>
  );
}
