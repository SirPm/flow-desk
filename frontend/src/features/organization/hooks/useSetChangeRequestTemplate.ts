import { useMutation, useQueryClient } from '@tanstack/react-query';
import { setChangeRequestTemplate } from '../api/organizationApi';
import { organizationQueryKey } from './useOrganization';

export function useSetChangeRequestTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: setChangeRequestTemplate,
    onSuccess: (organization) => {
      queryClient.setQueryData(organizationQueryKey, organization);
    },
  });
}
