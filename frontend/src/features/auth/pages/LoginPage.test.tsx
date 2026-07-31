import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider as ReduxProvider } from 'react-redux';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import { authReducer } from '../authSlice';
import { LoginPage } from './LoginPage';
import * as authApi from '../api/authApi';

jest.mock('../api/authApi');

function renderLoginPage() {
  const store = configureStore({ reducer: { auth: authReducer } });
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

  return render(
    <ReduxProvider store={store}>
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/login']}>
          <LoginPage />
        </MemoryRouter>
      </QueryClientProvider>
    </ReduxProvider>,
  );
}

describe('LoginPage', () => {
  it('submits credentials and does not show an error on success', async () => {
    jest.spyOn(authApi, 'login').mockResolvedValue({
      token: 'a.b.c',
      user: {
        id: '1',
        name: 'Ada Admin',
        email: 'admin@acme.test',
        role: 'ADMIN',
        organizationId: 'org_1',
      },
    });

    renderLoginPage();

    await userEvent.type(screen.getByLabelText(/email/i), 'admin@acme.test');
    await userEvent.type(screen.getByLabelText(/password/i), 'password123');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() =>
      expect(authApi.login).toHaveBeenCalledWith(
        { email: 'admin@acme.test', password: 'password123' },
        expect.anything(),
      ),
    );
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('shows an error message when login fails', async () => {
    jest.spyOn(authApi, 'login').mockRejectedValue(new Error('Invalid email or password'));

    renderLoginPage();

    await userEvent.type(screen.getByLabelText(/email/i), 'admin@acme.test');
    await userEvent.type(screen.getByLabelText(/password/i), 'wrong-password');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid email or password');
  });
});
