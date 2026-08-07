import {
  ApprovalActionType,
  ApprovalStatus,
  ChangeRequestStatus,
  PrismaClient,
  type Prisma,
  Role,
} from '@prisma/client';
import { hashPassword } from '../src/lib/password';

const prisma = new PrismaClient();

const DEMO_PASSWORD = 'password123';

function addDays(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
}

async function upsertOrganization(id: string, name: string, featureFlags: Record<string, boolean>) {
  return prisma.organization.upsert({
    where: { id },
    update: {},
    create: { id, name, featureFlags },
  });
}

async function upsertUser(
  id: string,
  name: string,
  email: string,
  role: Role,
  organizationId: string,
  passwordHash: string,
) {
  return prisma.user.upsert({
    where: { id },
    update: {},
    create: { id, name, email, role, organizationId, passwordHash },
  });
}

async function upsertWorkflowTemplate(
  id: string,
  name: string,
  steps: Role[],
  createdBy: string,
  organizationId: string,
) {
  return prisma.workflowTemplate.upsert({
    where: { id },
    update: {},
    create: { id, name, steps, createdBy, organizationId },
  });
}

async function upsertApprovalRequest(
  id: string,
  workflowTemplateId: string,
  currentStep: number,
  status: ApprovalStatus,
  requestedBy: string,
) {
  return prisma.approvalRequest.upsert({
    where: { id },
    update: {},
    create: { id, workflowTemplateId, currentStep, status, requestedBy },
  });
}

async function upsertApprovalAction(
  id: string,
  approvalRequestId: string,
  actorId: string,
  action: ApprovalActionType,
  note?: string,
) {
  return prisma.approvalAction.upsert({
    where: { id },
    update: {},
    create: { id, approvalRequestId, actorId, action, note },
  });
}

async function upsertChangeRequest(
  id: string,
  employeeId: string,
  fieldChanged: string,
  oldValue: string,
  newValue: string,
  effectiveDate: Date,
  status: ChangeRequestStatus,
) {
  return prisma.changeRequest.upsert({
    where: { id },
    update: {},
    create: { id, employeeId, fieldChanged, oldValue, newValue, effectiveDate, status },
  });
}

async function upsertAuditLog(
  id: string,
  actorId: string,
  action: string,
  entityType: string,
  entityId: string,
  metadata: Record<string, unknown> = {},
) {
  return prisma.auditLog.upsert({
    where: { id },
    update: {},
    create: {
      id,
      actorId,
      action,
      entityType,
      entityId,
      metadata: metadata as Prisma.InputJsonValue,
    },
  });
}

async function seedAcme(passwordHash: string): Promise<void> {
  const acme = await upsertOrganization('org_acme_demo', 'Acme Corp', { changeRequests: true });

  const admin = await upsertUser(
    'user_acme_admin',
    'Ada Admin',
    'admin@acme.test',
    Role.ADMIN,
    acme.id,
    passwordHash,
  );
  const manager = await upsertUser(
    'user_acme_manager',
    'Mia Manager',
    'manager@acme.test',
    Role.MANAGER,
    acme.id,
    passwordHash,
  );
  const finance = await upsertUser(
    'user_acme_finance',
    'Fin Ance',
    'finance@acme.test',
    Role.FINANCE,
    acme.id,
    passwordHash,
  );
  const employee = await upsertUser(
    'user_acme_employee',
    'Evan Employee',
    'employee@acme.test',
    Role.EMPLOYEE,
    acme.id,
    passwordHash,
  );

  const expenseTemplate = await upsertWorkflowTemplate(
    'wft_acme_expense',
    'Expense Approval',
    [Role.MANAGER, Role.FINANCE],
    admin.id,
    acme.id,
  );
  const policyTemplate = await upsertWorkflowTemplate(
    'wft_acme_policy',
    'Policy Change',
    [Role.MANAGER, Role.ADMIN],
    admin.id,
    acme.id,
  );
  const equipmentTemplate = await upsertWorkflowTemplate(
    'wft_acme_equipment',
    'Equipment Request',
    [Role.MANAGER],
    admin.id,
    acme.id,
  );

  // Awaiting the manager step.
  await upsertApprovalRequest(
    'req_acme_pending_mgr',
    expenseTemplate.id,
    0,
    ApprovalStatus.PENDING,
    employee.id,
  );

  // Manager already approved; awaiting finance.
  await upsertApprovalRequest(
    'req_acme_pending_fin',
    expenseTemplate.id,
    1,
    ApprovalStatus.PENDING,
    employee.id,
  );
  await upsertApprovalAction(
    'action_pending_fin_1',
    'req_acme_pending_fin',
    manager.id,
    ApprovalActionType.APPROVE,
  );
  await upsertAuditLog(
    'audit_pending_fin_1',
    manager.id,
    'APPROVAL_APPROVE',
    'ApprovalRequest',
    'req_acme_pending_fin',
    { decision: 'APPROVE', permissionOverride: false },
  );

  // Fully approved single-step request.
  await upsertApprovalRequest(
    'req_acme_approved',
    equipmentTemplate.id,
    1,
    ApprovalStatus.APPROVED,
    employee.id,
  );
  await upsertApprovalAction(
    'action_approved_1',
    'req_acme_approved',
    manager.id,
    ApprovalActionType.APPROVE,
  );
  await upsertAuditLog(
    'audit_approved_1',
    manager.id,
    'APPROVAL_APPROVE',
    'ApprovalRequest',
    'req_acme_approved',
    { decision: 'APPROVE', permissionOverride: false },
  );

  // Rejected at the manager step.
  await upsertApprovalRequest(
    'req_acme_rejected',
    policyTemplate.id,
    0,
    ApprovalStatus.REJECTED,
    employee.id,
  );
  await upsertApprovalAction(
    'action_rejected_1',
    'req_acme_rejected',
    manager.id,
    ApprovalActionType.REJECT,
    'Budget not approved for this quarter',
  );
  await upsertAuditLog(
    'audit_rejected_1',
    manager.id,
    'APPROVAL_REJECT',
    'ApprovalRequest',
    'req_acme_rejected',
    { decision: 'REJECT', note: 'Budget not approved for this quarter', permissionOverride: false },
  );

  // Manager approved, then finance skipped the final step — request lands APPROVED.
  await upsertApprovalRequest(
    'req_acme_skip_demo',
    expenseTemplate.id,
    2,
    ApprovalStatus.APPROVED,
    employee.id,
  );
  await upsertApprovalAction(
    'action_skip_demo_1',
    'req_acme_skip_demo',
    manager.id,
    ApprovalActionType.APPROVE,
  );
  await upsertApprovalAction(
    'action_skip_demo_2',
    'req_acme_skip_demo',
    finance.id,
    ApprovalActionType.SKIP,
    'No policy conflict, fast-tracking per department head',
  );
  await upsertAuditLog(
    'audit_skip_demo_1',
    manager.id,
    'APPROVAL_APPROVE',
    'ApprovalRequest',
    'req_acme_skip_demo',
    { decision: 'APPROVE', permissionOverride: false },
  );
  await upsertAuditLog(
    'audit_skip_demo_2',
    finance.id,
    'APPROVAL_SKIP',
    'ApprovalRequest',
    'req_acme_skip_demo',
    {
      decision: 'SKIP',
      note: 'No policy conflict, fast-tracking per department head',
      permissionOverride: false,
    },
  );

  // Change requests across every status.
  await upsertChangeRequest(
    'cr_acme_pending',
    employee.id,
    'Position',
    'Associate',
    'Senior Associate',
    addDays(30),
    ChangeRequestStatus.PENDING,
  );
  await upsertAuditLog(
    'audit_cr_pending_1',
    admin.id,
    'CHANGE_REQUEST_CREATED',
    'ChangeRequest',
    'cr_acme_pending',
    { employeeId: employee.id, fieldChanged: 'Position' },
  );

  await upsertChangeRequest(
    'cr_acme_scheduled',
    employee.id,
    'Department',
    'Sales',
    'Marketing',
    addDays(14),
    ChangeRequestStatus.SCHEDULED,
  );
  await upsertAuditLog(
    'audit_cr_scheduled_1',
    admin.id,
    'CHANGE_REQUEST_CREATED',
    'ChangeRequest',
    'cr_acme_scheduled',
    { employeeId: employee.id, fieldChanged: 'Department' },
  );
  await upsertAuditLog(
    'audit_cr_scheduled_2',
    admin.id,
    'CHANGE_REQUEST_APPROVED',
    'ChangeRequest',
    'cr_acme_scheduled',
  );

  await upsertChangeRequest(
    'cr_acme_applied',
    employee.id,
    'Salary',
    '65000',
    '72000',
    addDays(-14),
    ChangeRequestStatus.APPLIED,
  );
  await upsertAuditLog(
    'audit_cr_applied_1',
    admin.id,
    'CHANGE_REQUEST_CREATED',
    'ChangeRequest',
    'cr_acme_applied',
    { employeeId: employee.id, fieldChanged: 'Salary' },
  );
  await upsertAuditLog(
    'audit_cr_applied_2',
    admin.id,
    'CHANGE_REQUEST_APPROVED',
    'ChangeRequest',
    'cr_acme_applied',
  );

  await upsertChangeRequest(
    'cr_acme_rejected',
    employee.id,
    'Employment Type',
    'Contract',
    'Full-Time',
    addDays(7),
    ChangeRequestStatus.REJECTED,
  );
  await upsertAuditLog(
    'audit_cr_rejected_1',
    admin.id,
    'CHANGE_REQUEST_CREATED',
    'ChangeRequest',
    'cr_acme_rejected',
    { employeeId: employee.id, fieldChanged: 'Employment Type' },
  );
  await upsertAuditLog(
    'audit_cr_rejected_2',
    admin.id,
    'CHANGE_REQUEST_REJECTED',
    'ChangeRequest',
    'cr_acme_rejected',
  );

  await upsertAuditLog(
    'audit_feature_flag_1',
    admin.id,
    'FEATURE_FLAG_TOGGLED',
    'Organization',
    acme.id,
    { key: 'changeRequests', enabled: true },
  );

  console.log(
    `Seeded "${acme.name}": 4 users, 3 workflow templates, 5 approval requests, 4 change requests.`,
  );
}

async function seedGlobex(passwordHash: string): Promise<void> {
  const globex = await upsertOrganization('org_globex_demo', 'Globex Inc', {
    changeRequests: false,
  });

  const admin = await upsertUser(
    'user_globex_admin',
    'Gary Grant',
    'admin@globex.test',
    Role.ADMIN,
    globex.id,
    passwordHash,
  );
  await upsertUser(
    'user_globex_manager',
    'Meg Michaels',
    'manager@globex.test',
    Role.MANAGER,
    globex.id,
    passwordHash,
  );
  const employee = await upsertUser(
    'user_globex_employee',
    'Eli Owens',
    'employee@globex.test',
    Role.EMPLOYEE,
    globex.id,
    passwordHash,
  );

  const purchaseTemplate = await upsertWorkflowTemplate(
    'wft_globex_purchase',
    'Purchase Approval',
    [Role.MANAGER],
    admin.id,
    globex.id,
  );

  await upsertApprovalRequest(
    'req_globex_pending',
    purchaseTemplate.id,
    0,
    ApprovalStatus.PENDING,
    employee.id,
  );

  console.log(`Seeded "${globex.name}": 3 users, 1 workflow template, 1 approval request.`);
  console.log(
    '  (Change Requests feature flag is off for this org, and it has its own isolated data — use it to demo tenant isolation.)',
  );
}

async function main(): Promise<void> {
  const passwordHash = await hashPassword(DEMO_PASSWORD);

  await seedAcme(passwordHash);
  await seedGlobex(passwordHash);

  console.log(`\nDemo login password for every seeded user: ${DEMO_PASSWORD}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
