import axios, { AxiosError } from 'axios';
import { env } from '../config/env';
import { AUTH_STORAGE_KEY } from '../features/auth/authSlice';

export const apiClient = axios.create({
  baseURL: env.apiUrl,
});

apiClient.interceptors.request.use((config) => {
  const raw = localStorage.getItem(AUTH_STORAGE_KEY);
  const token = raw ? (JSON.parse(raw).token as string | null) : null;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const isLoginRequest = error.config?.url?.includes('/auth/login');
    if (error.response?.status === 401 && !isLoginRequest) {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      if (window.location.pathname !== '/login') {
        window.location.assign('/login');
      }
    }
    return Promise.reject(error);
  },
);

interface ApiErrorBody {
  error: { code: string; message: string };
}

export function getErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const axiosErr = err as AxiosError<ApiErrorBody>;
    return axiosErr.response?.data?.error?.message ?? axiosErr.message;
  }
  if (err instanceof Error) return err.message;
  return 'Something went wrong';
}
