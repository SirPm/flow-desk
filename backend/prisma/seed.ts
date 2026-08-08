import {
  ApprovalActionType,
  ApprovalStatus,
  ChangeRequestField,
  ChangeRequestStatus,
  EmploymentType,
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

async function upsertDepartment(id: string, name: string, organizationId: string) {
  return prisma.department.upsert({
    where: { id },
    update: {},
    create: { id, name, organizationId },
  });
}

async function upsertPosition(id: string, title: string, organizationId: string) {
  return prisma.position.upsert({
    where: { id },
    update: {},
    create: { id, title, organizationId },
  });
}

interface EmployeeInfo {
  departmentId?: string;
  positionId?: string;
  salary?: number;
  employmentType?: EmploymentType;
}

async function upsertUser(
  id: string,
  name: string,
  email: string,
  role: Role,
  organizationId: string,
  passwordHash: string,
  employeeInfo: EmployeeInfo = {},
) {
  return prisma.user.upsert({
    where: { id },
    update: {
      departmentId: employeeInfo.departmentId ?? null,
      positionId: employeeInfo.positionId ?? null,
      salary: employeeInfo.salary ?? null,
      employmentType: employeeInfo.employmentType ?? null,
    },
    create: {
      id,
      name,
      email,
      role,
      organizationId,
      passwordHash,
      departmentId: employeeInfo.departmentId,
      positionId: employeeInfo.positionId,
      salary: employeeInfo.salary,
      employmentType: employeeInfo.employmentType,
    },
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
  fieldChanged: ChangeRequestField,
  oldValue: string,
  newValue: string,
  effectiveDate: Date,
  status: ChangeRequestStatus,
  approvalRequestId: string,
) {
  return prisma.changeRequest.upsert({
    where: { id },
    update: {},
    create: {
      id,
      employeeId,
      fieldChanged,
      oldValue,
      newValue,
      effectiveDate,
      status,
      approvalRequestId,
    },
  });
}

async function setDefaultChangeRequestTemplate(organizationId: string, workflowTemplateId: string) {
  await prisma.organization.update({
    where: { id: organizationId },
    data: { changeRequestTemplateId: workflowTemplateId },
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

  await upsertDepartment('dept_acme_engineering', 'Engineering', acme.id);
  const sales = await upsertDepartment('dept_acme_sales', 'Sales', acme.id);
  const marketing = await upsertDepartment('dept_acme_marketing', 'Marketing', acme.id);
  const financeDept = await upsertDepartment('dept_acme_finance', 'Finance', acme.id);
  const operations = await upsertDepartment('dept_acme_operations', 'Operations', acme.id);

  const associate = await upsertPosition('pos_acme_associate', 'Associate', acme.id);
  const seniorAssociate = await upsertPosition(
    'pos_acme_senior_associate',
    'Senior Associate',
    acme.id,
  );
  await upsertPosition('pos_acme_software_engineer', 'Software Engineer', acme.id);
  const financeAnalyst = await upsertPosition(
    'pos_acme_finance_analyst',
    'Finance Analyst',
    acme.id,
  );
  const operationsLead = await upsertPosition(
    'pos_acme_operations_lead',
    'Operations Lead',
    acme.id,
  );

  const admin = await upsertUser(
    'user_acme_admin',
    'Ada Admin',
    'admin@acme.test',
    Role.ADMIN,
    acme.id,
    passwordHash,
    {
      departmentId: operations.id,
      positionId: operationsLead.id,
      salary: 95000,
      employmentType: EmploymentType.FULL_TIME,
    },
  );
  const manager = await upsertUser(
    'user_acme_manager',
    'Mia Manager',
    'manager@acme.test',
    Role.MANAGER,
    acme.id,
    passwordHash,
    {
      departmentId: sales.id,
      positionId: seniorAssociate.id,
      salary: 88000,
      employmentType: EmploymentType.FULL_TIME,
    },
  );
  const finance = await upsertUser(
    'user_acme_finance',
    'Fin Ance',
    'finance@acme.test',
    Role.FINANCE,
    acme.id,
    passwordHash,
    {
      departmentId: financeDept.id,
      positionId: financeAnalyst.id,
      salary: 78000,
      employmentType: EmploymentType.FULL_TIME,
    },
  );
  const employee = await upsertUser(
    'user_acme_employee',
    'Evan Employee',
    'employee@acme.test',
    Role.EMPLOYEE,
    acme.id,
    passwordHash,
    {
      departmentId: sales.id,
      positionId: associate.id,
      salary: 72000,
      employmentType: EmploymentType.CONTRACT,
    },
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
  const changeRequestTemplate = await upsertWorkflowTemplate(
    'wft_acme_change_request',
    'Employee Change Request',
    [Role.MANAGER, Role.ADMIN],
    admin.id,
    acme.id,
  );
  await setDefaultChangeRequestTemplate(acme.id, changeRequestTemplate.id);

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

  // Change requests across every status, each backed by an ApprovalRequest against the 2-step
  // [MANAGER, ADMIN] change-request template. Evan's current position/department/salary/
  // employmentType (set above) reflect the outcome of these: pending/scheduled haven't taken
  // effect yet, applied already did, rejected never did.

  // Manager already approved; awaiting admin (mid-chain PENDING).
  await upsertApprovalRequest(
    'req_acme_cr_pending',
    changeRequestTemplate.id,
    1,
    ApprovalStatus.PENDING,
    employee.id,
  );
  await upsertApprovalAction(
    'action_cr_pending_1',
    'req_acme_cr_pending',
    manager.id,
    ApprovalActionType.APPROVE,
  );
  await upsertAuditLog(
    'audit_approval_cr_pending_1',
    manager.id,
    'APPROVAL_APPROVE',
    'ApprovalRequest',
    'req_acme_cr_pending',
    { decision: 'APPROVE', permissionOverride: false },
  );
  await upsertChangeRequest(
    'cr_acme_pending',
    employee.id,
    ChangeRequestField.POSITION,
    associate.id,
    seniorAssociate.id,
    addDays(30),
    ChangeRequestStatus.PENDING,
    'req_acme_cr_pending',
  );
  await upsertAuditLog(
    'audit_cr_pending_1',
    admin.id,
    'CHANGE_REQUEST_CREATED',
    'ChangeRequest',
    'cr_acme_pending',
    { employeeId: employee.id, fieldChanged: ChangeRequestField.POSITION },
  );

  // Fully approved (manager, then admin).
  await upsertApprovalRequest(
    'req_acme_cr_scheduled',
    changeRequestTemplate.id,
    2,
    ApprovalStatus.APPROVED,
    employee.id,
  );
  await upsertApprovalAction(
    'action_cr_scheduled_1',
    'req_acme_cr_scheduled',
    manager.id,
    ApprovalActionType.APPROVE,
  );
  await upsertApprovalAction(
    'action_cr_scheduled_2',
    'req_acme_cr_scheduled',
    admin.id,
    ApprovalActionType.APPROVE,
  );
  await upsertAuditLog(
    'audit_approval_cr_scheduled_1',
    manager.id,
    'APPROVAL_APPROVE',
    'ApprovalRequest',
    'req_acme_cr_scheduled',
    { decision: 'APPROVE', permissionOverride: false },
  );
  await upsertAuditLog(
    'audit_approval_cr_scheduled_2',
    admin.id,
    'APPROVAL_APPROVE',
    'ApprovalRequest',
    'req_acme_cr_scheduled',
    { decision: 'APPROVE', permissionOverride: false },
  );
  await upsertChangeRequest(
    'cr_acme_scheduled',
    employee.id,
    ChangeRequestField.DEPARTMENT,
    sales.id,
    marketing.id,
    addDays(14),
    ChangeRequestStatus.SCHEDULED,
    'req_acme_cr_scheduled',
  );
  await upsertAuditLog(
    'audit_cr_scheduled_1',
    admin.id,
    'CHANGE_REQUEST_CREATED',
    'ChangeRequest',
    'cr_acme_scheduled',
    { employeeId: employee.id, fieldChanged: ChangeRequestField.DEPARTMENT },
  );
  await upsertAuditLog(
    'audit_cr_scheduled_2',
    admin.id,
    'CHANGE_REQUEST_APPROVED',
    'ChangeRequest',
    'cr_acme_scheduled',
  );

  // Fully approved (manager, then admin), and its effective date has already passed.
  await upsertApprovalRequest(
    'req_acme_cr_applied',
    changeRequestTemplate.id,
    2,
    ApprovalStatus.APPROVED,
    employee.id,
  );
  await upsertApprovalAction(
    'action_cr_applied_1',
    'req_acme_cr_applied',
    manager.id,
    ApprovalActionType.APPROVE,
  );
  await upsertApprovalAction(
    'action_cr_applied_2',
    'req_acme_cr_applied',
    admin.id,
    ApprovalActionType.APPROVE,
  );
  await upsertAuditLog(
    'audit_approval_cr_applied_1',
    manager.id,
    'APPROVAL_APPROVE',
    'ApprovalRequest',
    'req_acme_cr_applied',
    { decision: 'APPROVE', permissionOverride: false },
  );
  await upsertAuditLog(
    'audit_approval_cr_applied_2',
    admin.id,
    'APPROVAL_APPROVE',
    'ApprovalRequest',
    'req_acme_cr_applied',
    { decision: 'APPROVE', permissionOverride: false },
  );
  await upsertChangeRequest(
    'cr_acme_applied',
    employee.id,
    ChangeRequestField.SALARY,
    '65000',
    '72000',
    addDays(-14),
    ChangeRequestStatus.APPLIED,
    'req_acme_cr_applied',
  );
  await upsertAuditLog(
    'audit_cr_applied_1',
    admin.id,
    'CHANGE_REQUEST_CREATED',
    'ChangeRequest',
    'cr_acme_applied',
    { employeeId: employee.id, fieldChanged: ChangeRequestField.SALARY },
  );
  await upsertAuditLog(
    'audit_cr_applied_2',
    admin.id,
    'CHANGE_REQUEST_APPROVED',
    'ChangeRequest',
    'cr_acme_applied',
  );
  await upsertAuditLog(
    'audit_cr_applied_3',
    employee.id,
    'CHANGE_REQUEST_APPLIED',
    'ChangeRequest',
    'cr_acme_applied',
    {
      employeeId: employee.id,
      fieldChanged: ChangeRequestField.SALARY,
      newValue: '72000',
      automated: true,
    },
  );

  // Rejected at the manager step.
  await upsertApprovalRequest(
    'req_acme_cr_rejected',
    changeRequestTemplate.id,
    0,
    ApprovalStatus.REJECTED,
    employee.id,
  );
  await upsertApprovalAction(
    'action_cr_rejected_1',
    'req_acme_cr_rejected',
    manager.id,
    ApprovalActionType.REJECT,
    'Employment type change not approved this cycle',
  );
  await upsertAuditLog(
    'audit_approval_cr_rejected_1',
    manager.id,
    'APPROVAL_REJECT',
    'ApprovalRequest',
    'req_acme_cr_rejected',
    {
      decision: 'REJECT',
      note: 'Employment type change not approved this cycle',
      permissionOverride: false,
    },
  );
  await upsertChangeRequest(
    'cr_acme_rejected',
    employee.id,
    ChangeRequestField.EMPLOYMENT_TYPE,
    EmploymentType.CONTRACT,
    EmploymentType.FULL_TIME,
    addDays(7),
    ChangeRequestStatus.REJECTED,
    'req_acme_cr_rejected',
  );
  await upsertAuditLog(
    'audit_cr_rejected_1',
    admin.id,
    'CHANGE_REQUEST_CREATED',
    'ChangeRequest',
    'cr_acme_rejected',
    { employeeId: employee.id, fieldChanged: ChangeRequestField.EMPLOYMENT_TYPE },
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
  await upsertAuditLog(
    'audit_change_request_template_1',
    admin.id,
    'CHANGE_REQUEST_TEMPLATE_SET',
    'Organization',
    acme.id,
    { workflowTemplateId: changeRequestTemplate.id },
  );

  console.log(
    `Seeded "${acme.name}": 4 users, 4 workflow templates, 9 approval requests, 4 change requests.`,
  );
}

async function seedGlobex(passwordHash: string): Promise<void> {
  const globex = await upsertOrganization('org_globex_demo', 'Globex Inc', {
    changeRequests: false,
  });

  const operations = await upsertDepartment('dept_globex_operations', 'Operations', globex.id);
  const sales = await upsertDepartment('dept_globex_sales', 'Sales', globex.id);

  const teamLead = await upsertPosition('pos_globex_team_lead', 'Team Lead', globex.id);
  const associate = await upsertPosition('pos_globex_associate', 'Associate', globex.id);

  const admin = await upsertUser(
    'user_globex_admin',
    'Gary Grant',
    'admin@globex.test',
    Role.ADMIN,
    globex.id,
    passwordHash,
    {
      departmentId: operations.id,
      positionId: teamLead.id,
      salary: 90000,
      employmentType: EmploymentType.FULL_TIME,
    },
  );
  await upsertUser(
    'user_globex_manager',
    'Meg Michaels',
    'manager@globex.test',
    Role.MANAGER,
    globex.id,
    passwordHash,
    {
      departmentId: sales.id,
      positionId: teamLead.id,
      salary: 82000,
      employmentType: EmploymentType.FULL_TIME,
    },
  );
  const employee = await upsertUser(
    'user_globex_employee',
    'Eli Owens',
    'employee@globex.test',
    Role.EMPLOYEE,
    globex.id,
    passwordHash,
    {
      departmentId: sales.id,
      positionId: associate.id,
      salary: 58000,
      employmentType: EmploymentType.PART_TIME,
    },
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
