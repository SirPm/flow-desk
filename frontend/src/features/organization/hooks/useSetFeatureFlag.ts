import { useMutation, useQueryClient } from '@tanstack/react-query';
import { setFeatureFlag } from '../api/organizationApi';
import { organizationQueryKey } from './useOrganization';

export function useSetFeatureFlag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: setFeatureFlag,
    onSuccess: (organization) => {
      queryClient.setQueryData(organizationQueryKey, organization);
    },
  });
}
