import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createDepartment } from '../api/departmentsApi';
import { departmentsQueryKey } from './useDepartments';

export function useCreateDepartment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createDepartment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: departmentsQueryKey });
    },
  });
}
