import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider as ReduxProvider } from 'react-redux';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import { authReducer } from '../../auth/authSlice';
import { WorkflowsPage } from './WorkflowsPage';
import * as workflowsApi from '../api/workflowsApi';
import * as organizationApi from '../../organization/api/organizationApi';
import type { AuthUser, Role } from '../../auth/types';
import type { WorkflowTemplate } from '../types';
import type { Organization } from '../../organization/types';

jest.mock('../api/workflowsApi');
jest.mock('../../organization/api/organizationApi');

const template: WorkflowTemplate = {
  id: 'wft_1',
  name: 'Employee Change Request',
  steps: ['MANAGER', 'ADMIN'],
  isChangeRequestTemplate: true,
  changeRequestFields: [],
  createdBy: 'user_admin',
  organizationId: 'org_1',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const organization: Organization = {
  id: 'org_1',
  name: 'Acme Corp',
  featureFlags: {},
  changeRequestTemplateId: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
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
        <MemoryRouter>
          <WorkflowsPage />
        </MemoryRouter>
      </QueryClientProvider>
    </ReduxProvider>,
  );
}

beforeEach(() => {
  jest.spyOn(workflowsApi, 'listWorkflowTemplates').mockResolvedValue([template]);
  jest.spyOn(organizationApi, 'getOrganization').mockResolvedValue(organization);
});

describe('WorkflowsPage default change-request template', () => {
  it('lets an admin set a template as the change-request default', async () => {
    const setChangeRequestTemplateSpy = jest
      .spyOn(organizationApi, 'setChangeRequestTemplate')
      .mockResolvedValue({ ...organization, changeRequestTemplateId: 'wft_1' });

    renderPage('ADMIN');

    const setDefaultButton = await screen.findByRole('button', { name: 'Set as default' });
    await userEvent.click(setDefaultButton);

    expect(setChangeRequestTemplateSpy.mock.calls[0]?.[0]).toBe('wft_1');
  });

  it('shows the default badge once a template is the org default', async () => {
    jest
      .spyOn(organizationApi, 'getOrganization')
      .mockResolvedValue({ ...organization, changeRequestTemplateId: 'wft_1' });

    renderPage('ADMIN');

    expect(await screen.findByText('Default for change requests')).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: 'Unset default' })).toBeInTheDocument();
  });

  it('never shows the set-default affordance or change-request scope for a template not enabled for change requests', async () => {
    jest.spyOn(workflowsApi, 'listWorkflowTemplates').mockResolvedValue([
      { ...template, id: 'wft_expense', name: 'Expense Approval', isChangeRequestTemplate: false },
    ]);

    renderPage('ADMIN');

    await screen.findByText('Expense Approval');
    expect(screen.queryByRole('button', { name: /default/i })).not.toBeInTheDocument();
    expect(screen.queryByText(/Change requests:/)).not.toBeInTheDocument();
  });

  it('hides the set-default affordance for a non-admin', async () => {
    renderPage('MANAGER');

    await screen.findByText(template.name);
    expect(screen.queryByRole('button', { name: /default/i })).not.toBeInTheDocument();
  });

  it('shows "all fields" for an unrestricted template and the specific fields for a scoped one', async () => {
    jest.spyOn(workflowsApi, 'listWorkflowTemplates').mockResolvedValue([
      template,
      { ...template, id: 'wft_2', name: 'Position Only', changeRequestFields: ['POSITION'] },
    ]);

    renderPage('ADMIN');

    expect(await screen.findByText(/Change requests: all fields/)).toBeInTheDocument();
    expect(await screen.findByText(/Change requests: Position/)).toBeInTheDocument();
  });

  it('lets an admin scope a new template to specific change-request fields', async () => {
    const createTemplateSpy = jest
      .spyOn(workflowsApi, 'createWorkflowTemplate')
      .mockResolvedValue({ ...template, id: 'wft_new', changeRequestFields: ['SALARY'] });

    renderPage('ADMIN');

    await userEvent.type(await screen.findByLabelText('Name'), 'Salary Change');
    await userEvent.click(screen.getByRole('button', { name: 'Add step' }));
    await userEvent.click(
      screen.getByLabelText('Usable as a change-request review template'),
    );
    await userEvent.click(screen.getByLabelText('Salary'));
    await userEvent.click(screen.getByRole('button', { name: 'Create template' }));

    expect(createTemplateSpy.mock.calls[0]?.[0]).toEqual(
      expect.objectContaining({ isChangeRequestTemplate: true, changeRequestFields: ['SALARY'] }),
    );
  });
});
