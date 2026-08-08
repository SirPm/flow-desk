import { Navigate, Route, Routes } from 'react-router-dom';
import { AppProviders } from './app/AppProviders';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { AppLayout } from './components/layout/AppLayout';
import { LoginPage } from './features/auth/pages/LoginPage';
import { DashboardPage } from './features/dashboard/pages/DashboardPage';
import { ProfilePage } from './features/profile/pages/ProfilePage';
import { WorkflowsPage } from './features/workflows/pages/WorkflowsPage';
import { ApprovalsPage } from './features/approvals/pages/ApprovalsPage';
import { ApprovalRequestDetailPage } from './features/approvals/pages/ApprovalRequestDetailPage';
import { ChangeRequestsPage } from './features/change-requests/pages/ChangeRequestsPage';
import { ChangeRequestDetailPage } from './features/change-requests/pages/ChangeRequestDetailPage';
import { EmployeesPage } from './features/users/pages/EmployeesPage';
import { AuditLogPage } from './features/audit-log/pages/AuditLogPage';
import { FeatureFlagsPage } from './features/organization/pages/FeatureFlagsPage';
import { OrgStructurePage } from './features/organization/pages/OrgStructurePage';

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/workflows" element={<WorkflowsPage />} />
          <Route path="/approvals" element={<ApprovalsPage />} />
          <Route path="/approvals/:id" element={<ApprovalRequestDetailPage />} />
          <Route path="/change-requests" element={<ChangeRequestsPage />} />
          <Route path="/change-requests/:id" element={<ChangeRequestDetailPage />} />
          <Route path="/employees" element={<EmployeesPage />} />
          <Route path="/audit-log" element={<AuditLogPage />} />
          <Route path="/feature-flags" element={<FeatureFlagsPage />} />
          <Route path="/org-structure" element={<OrgStructurePage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export function App() {
  return (
    <AppProviders>
      <AppRoutes />
    </AppProviders>
  );
}
