import { render, screen } from '@testing-library/react';
import { Provider as ReduxProvider } from 'react-redux';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import { authReducer } from '../../auth/authSlice';
import { ChangeRequestDetailPage } from './ChangeRequestDetailPage';
import * as changeRequestsApi from '../api/changeRequestsApi';
import * as departmentsApi from '../../organization/api/departmentsApi';
import * as positionsApi from '../../organization/api/positionsApi';
import type { AuthUser, Role } from '../../auth/types';
import type { ChangeRequest } from '../types';

jest.mock('../api/changeRequestsApi');
jest.mock('../../organization/api/departmentsApi');
jest.mock('../../organization/api/positionsApi');

const baseRequest: ChangeRequest = {
  id: 'cr_1',
  employeeId: 'user_employee',
  fieldChanged: 'POSITION',
  oldValue: 'pos_associate',
  newValue: 'pos_senior_associate',
  effectiveDate: new Date().toISOString(),
  status: 'PENDING',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  employee: { id: 'user_employee', name: 'Evan Employee', email: 'employee@acme.test' },
  approvalRequest: {
    id: 'req_1',
    currentStep: 0,
    status: 'PENDING',
    workflowTemplate: { steps: ['MANAGER', 'ADMIN'] },
    actions: [],
  },
};

function renderDetailPage(role: Role) {
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
        <MemoryRouter initialEntries={['/change-requests/cr_1']}>
          <Routes>
            <Route path="/change-requests/:id" element={<ChangeRequestDetailPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    </ReduxProvider>,
  );
}

beforeEach(() => {
  jest.spyOn(departmentsApi, 'listDepartments').mockResolvedValue([]);
  jest.spyOn(positionsApi, 'listPositions').mockResolvedValue([]);
});

describe('ChangeRequestDetailPage role gating', () => {
  it('shows action buttons when the signed-in role matches the current step', async () => {
    jest.spyOn(changeRequestsApi, 'getChangeRequestById').mockResolvedValue(baseRequest);

    renderDetailPage('MANAGER');

    expect(await screen.findByRole('button', { name: 'Approve' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reject' })).toBeInTheDocument();
  });

  it('shows action buttons for an admin even when the current step belongs to another role', async () => {
    jest.spyOn(changeRequestsApi, 'getChangeRequestById').mockResolvedValue(baseRequest);

    renderDetailPage('ADMIN');

    expect(await screen.findByRole('button', { name: 'Approve' })).toBeInTheDocument();
  });

  it('hides action buttons when the signed-in role does not match the current step', async () => {
    jest.spyOn(changeRequestsApi, 'getChangeRequestById').mockResolvedValue(baseRequest);

    renderDetailPage('EMPLOYEE');

    await screen.findByText('Evan Employee', { exact: false });
    expect(screen.queryByRole('button', { name: 'Approve' })).not.toBeInTheDocument();
  });

  it('hides action buttons once the request has resolved', async () => {
    jest.spyOn(changeRequestsApi, 'getChangeRequestById').mockResolvedValue({
      ...baseRequest,
      status: 'SCHEDULED',
    });

    renderDetailPage('MANAGER');

    await screen.findByText('Evan Employee', { exact: false });
    expect(screen.queryByRole('button', { name: 'Approve' })).not.toBeInTheDocument();
  });

  it('renders the action history from the linked approval request', async () => {
    jest.spyOn(changeRequestsApi, 'getChangeRequestById').mockResolvedValue({
      ...baseRequest,
      approvalRequest: {
        ...baseRequest.approvalRequest,
        actions: [
          {
            id: 'action_1',
            approvalRequestId: 'req_1',
            actorId: 'user_manager',
            action: 'APPROVE',
            timestamp: new Date().toISOString(),
            note: null,
          },
        ],
      },
    });

    renderDetailPage('ADMIN');

    expect(await screen.findByText('APPROVE')).toBeInTheDocument();
  });
});
