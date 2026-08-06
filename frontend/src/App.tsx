import { Navigate, Route, Routes } from 'react-router-dom';
import { AppProviders } from './app/AppProviders';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { AppLayout } from './components/layout/AppLayout';
import { LoginPage } from './features/auth/pages/LoginPage';
import { DashboardPage } from './features/dashboard/pages/DashboardPage';
import { WorkflowsPage } from './features/workflows/pages/WorkflowsPage';
import { ApprovalsPage } from './features/approvals/pages/ApprovalsPage';
import { ApprovalRequestDetailPage } from './features/approvals/pages/ApprovalRequestDetailPage';
import { ChangeRequestsPage } from './features/change-requests/pages/ChangeRequestsPage';
import { AuditLogPage } from './features/audit-log/pages/AuditLogPage';

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/workflows" element={<WorkflowsPage />} />
          <Route path="/approvals" element={<ApprovalsPage />} />
          <Route path="/approvals/:id" element={<ApprovalRequestDetailPage />} />
          <Route path="/change-requests" element={<ChangeRequestsPage />} />
          <Route path="/audit-log" element={<AuditLogPage />} />
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
