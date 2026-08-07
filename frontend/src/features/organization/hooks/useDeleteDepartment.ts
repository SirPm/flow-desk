import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteDepartment } from '../api/departmentsApi';
import { departmentsQueryKey } from './useDepartments';

export function useDeleteDepartment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteDepartment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: departmentsQueryKey });
    },
  });
}
