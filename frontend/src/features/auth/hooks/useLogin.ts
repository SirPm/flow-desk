import { useMutation } from '@tanstack/react-query';
import { login } from '../api/authApi';
import { useAppDispatch } from '../../../app/hooks';
import { setCredentials } from '../authSlice';

export function useLogin() {
  const dispatch = useAppDispatch();

  return useMutation({
    mutationFn: login,
    onSuccess: (result) => {
      dispatch(setCredentials(result));
    },
  });
}
