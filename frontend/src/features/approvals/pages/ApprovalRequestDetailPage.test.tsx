import { render, screen } from '@testing-library/react';
import { Provider as ReduxProvider } from 'react-redux';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import { authReducer } from '../../auth/authSlice';
import { ApprovalRequestDetailPage } from './ApprovalRequestDetailPage';
import * as approvalsApi from '../api/approvalsApi';
import type { AuthUser, Role } from '../../auth/types';
import type { ApprovalRequest } from '../types';

jest.mock('../api/approvalsApi');

const baseRequest: ApprovalRequest = {
  id: 'req_1',
  workflowTemplateId: 'wft_1',
  currentStep: 0,
  status: 'PENDING',
  requestedBy: 'user_employee',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  workflowTemplate: { name: 'Expense Approval', steps: ['MANAGER', 'FINANCE'] },
  actions: [],
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
        <MemoryRouter initialEntries={['/approvals/req_1']}>
          <Routes>
            <Route path="/approvals/:id" element={<ApprovalRequestDetailPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    </ReduxProvider>,
  );
}

describe('ApprovalRequestDetailPage role gating', () => {
  it('shows action buttons when the signed-in role matches the current step', async () => {
    jest.spyOn(approvalsApi, 'getApprovalRequest').mockResolvedValue(baseRequest);

    renderDetailPage('MANAGER');

    expect(await screen.findByRole('button', { name: /approve/i })).toBeInTheDocument();
  });

  it('shows action buttons for an admin even when the current step belongs to another role', async () => {
    jest.spyOn(approvalsApi, 'getApprovalRequest').mockResolvedValue(baseRequest);

    renderDetailPage('ADMIN');

    expect(await screen.findByRole('button', { name: /approve/i })).toBeInTheDocument();
  });

  it('hides action buttons when the signed-in role does not match the current step', async () => {
    jest.spyOn(approvalsApi, 'getApprovalRequest').mockResolvedValue(baseRequest);

    renderDetailPage('FINANCE');

    await screen.findByText(baseRequest.workflowTemplate.name!);
    expect(screen.queryByRole('button', { name: /approve/i })).not.toBeInTheDocument();
  });

  it('hides action buttons once the request is no longer pending', async () => {
    jest.spyOn(approvalsApi, 'getApprovalRequest').mockResolvedValue({
      ...baseRequest,
      status: 'APPROVED',
    });

    renderDetailPage('MANAGER');

    await screen.findByText(baseRequest.workflowTemplate.name!);
    expect(screen.queryByRole('button', { name: /approve/i })).not.toBeInTheDocument();
  });
});
