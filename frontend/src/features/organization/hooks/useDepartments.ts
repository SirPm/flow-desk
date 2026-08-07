import { useQuery } from '@tanstack/react-query';
import { listDepartments } from '../api/departmentsApi';

export const departmentsQueryKey = ['departments'] as const;

export function useDepartments() {
  return useQuery({
    queryKey: departmentsQueryKey,
    queryFn: listDepartments,
  });
}
