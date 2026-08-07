import { useMyProfile } from '../hooks/useMyProfile';
import { EMPLOYMENT_TYPE_LABELS, formatSalary } from '../../users/constants';

function ProfileField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-sm text-slate-900">{value}</p>
    </div>
  );
}

export function ProfilePage() {
  const { data: profile, isLoading, isError } = useMyProfile();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold text-slate-900">My Profile</h1>

      {isLoading && <p className="text-sm text-slate-500">Loading...</p>}
      {isError && <p className="text-sm text-red-600">Could not load your profile.</p>}

      {profile && (
        <div className="grid max-w-2xl grid-cols-2 gap-6 rounded-lg border border-slate-200 bg-white p-5">
          <ProfileField label="Name" value={profile.name} />
          <ProfileField label="Email" value={profile.email} />
          <ProfileField label="Role" value={profile.role} />
          <ProfileField label="Department" value={profile.department?.name ?? 'Not set'} />
          <ProfileField label="Position" value={profile.position?.title ?? 'Not set'} />
          <ProfileField
            label="Employment Type"
            value={
              profile.employmentType ? EMPLOYMENT_TYPE_LABELS[profile.employmentType] : 'Not set'
            }
          />
          <ProfileField label="Salary" value={formatSalary(profile.salary)} />
        </div>
      )}
    </div>
  );
}
