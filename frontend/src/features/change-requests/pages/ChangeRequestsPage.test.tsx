import { render, screen } from '@testing-library/react';
import { Provider as ReduxProvider } from 'react-redux';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { configureStore } from '@reduxjs/toolkit';
import { authReducer } from '../../auth/authSlice';
import { ChangeRequestsPage } from './ChangeRequestsPage';
import * as changeRequestsApi from '../api/changeRequestsApi';
import * as organizationApi from '../../organization/api/organizationApi';
import * as usersApi from '../../users/api/usersApi';
import type { AuthUser, Role } from '../../auth/types';
import type { ChangeRequest } from '../types';
import type { Organization } from '../../organization/types';

jest.mock('../api/changeRequestsApi');
jest.mock('../../organization/api/organizationApi');
jest.mock('../../users/api/usersApi');

const organization: Organization = {
  id: 'org_1',
  name: 'Acme Corp',
  featureFlags: { changeRequests: true },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const pendingRequest: ChangeRequest = {
  id: 'cr_1',
  employeeId: 'user_employee',
  fieldChanged: 'Position',
  oldValue: 'Associate',
  newValue: 'Senior Associate',
  effectiveDate: new Date().toISOString(),
  status: 'PENDING',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  employee: { id: 'user_employee', name: 'Evan Employee', email: 'employee@acme.test' },
};

function renderPage(role: Role) {
  const user: AuthUser = {
    id: 'user_1',
    name: 'Test User',
    email: 'test@acme.test',
    role,
    organizationId: 'org_1',
  };
  const store = configureStore({
    reducer: { auth: authReducer },
    preloadedState: { auth: { user, token: 'a.b.c' } },
  });
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

  return render(
    <ReduxProvider store={store}>
      <QueryClientProvider client={queryClient}>
        <ChangeRequestsPage />
      </QueryClientProvider>
    </ReduxProvider>,
  );
}

beforeEach(() => {
  jest.spyOn(organizationApi, 'getOrganization').mockResolvedValue(organization);
  jest.spyOn(usersApi, 'listOrganizationUsers').mockResolvedValue([]);
  jest.spyOn(changeRequestsApi, 'listChangeRequests').mockResolvedValue([pendingRequest]);
});

describe('ChangeRequestsPage role gating', () => {
  it('shows the edit-employee-info form and review buttons for an admin', async () => {
    renderPage('ADMIN');

    expect(await screen.findByText('Edit employee info')).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: 'Approve' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reject' })).toBeInTheDocument();
  });

  it('shows the create form but hides review buttons for a manager', async () => {
    renderPage('MANAGER');

    expect(await screen.findByText('Edit employee info')).toBeInTheDocument();
    await screen.findByText('Evan Employee', { exact: false });
    expect(screen.queryByRole('button', { name: /approve/i })).not.toBeInTheDocument();
  });

  it('hides the create form and review buttons for an employee', async () => {
    renderPage('EMPLOYEE');

    await screen.findByText('Evan Employee', { exact: false });
    expect(screen.queryByText('Edit employee info')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /approve/i })).not.toBeInTheDocument();
  });

  it('shows a disabled-feature message when the org has turned change requests off, even for an admin', async () => {
    jest
      .spyOn(organizationApi, 'getOrganization')
      .mockResolvedValue({ ...organization, featureFlags: { changeRequests: false } });

    renderPage('ADMIN');

    expect(await screen.findByText(/feature disabled/i)).toBeInTheDocument();
    expect(screen.queryByText('Edit employee info')).not.toBeInTheDocument();
  });
});
