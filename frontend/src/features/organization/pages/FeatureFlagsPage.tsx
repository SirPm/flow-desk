import { useAppSelector } from '../../../app/hooks';
import { EmptyState } from '../../../components/EmptyState';
import { useOrganization } from '../hooks/useOrganization';
import { useSetFeatureFlag } from '../hooks/useSetFeatureFlag';
import { FeatureFlagToggle } from '../components/FeatureFlagToggle';

const KNOWN_FLAGS = [
  {
    key: 'changeRequests',
    label: 'Change Requests',
    description:
      'Show the Change Requests section for editing employee info with scheduled effective dates.',
  },
];

export function FeatureFlagsPage() {
  const role = useAppSelector((state) => state.auth.user?.role);
  const { data: organization, isLoading, isError } = useOrganization();
  const setFlag = useSetFeatureFlag();

  if (role !== 'ADMIN') {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-xl font-semibold text-slate-900">Feature Flags</h1>
        <EmptyState
          title="Admins only"
          description="Ask an admin for access to feature flag management."
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold text-slate-900">Feature Flags</h1>

      {isLoading && <p className="text-sm text-slate-500">Loading...</p>}
      {isError && <p className="text-sm text-red-600">Could not load organization settings.</p>}

      {organization && (
        <div className="flex flex-col gap-3">
          {KNOWN_FLAGS.map((flag) => (
            <FeatureFlagToggle
              key={flag.key}
              label={flag.label}
              description={flag.description}
              enabled={organization.featureFlags[flag.key] !== false}
              disabled={setFlag.isPending}
              onChange={(enabled) => setFlag.mutate({ key: flag.key, enabled })}
            />
          ))}
        </div>
      )}
    </div>
  );
}
