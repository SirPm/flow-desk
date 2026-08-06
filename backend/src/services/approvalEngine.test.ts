import { ApprovalActionType, ApprovalStatus, Role } from '@prisma/client';
import { advanceApprovalRequest, canActOnStep } from './approvalEngine';
import { AppError } from '../lib/errors';

const THREE_STEP_CHAIN = [Role.MANAGER, Role.FINANCE, Role.ADMIN];

describe('advanceApprovalRequest', () => {
  it('approves the current step and stays pending when more steps remain', () => {
    const result = advanceApprovalRequest({
      request: { currentStep: 0, status: ApprovalStatus.PENDING },
      steps: THREE_STEP_CHAIN,
      actorRole: Role.MANAGER,
      decision: ApprovalActionType.APPROVE,
    });

    expect(result.request).toEqual({ currentStep: 1, status: ApprovalStatus.PENDING });
    expect(result.actionType).toBe(ApprovalActionType.APPROVE);
  });

  it('marks the request approved once the final step is approved', () => {
    const result = advanceApprovalRequest({
      request: { currentStep: 2, status: ApprovalStatus.PENDING },
      steps: THREE_STEP_CHAIN,
      actorRole: Role.ADMIN,
      decision: ApprovalActionType.APPROVE,
    });

    expect(result.request).toEqual({ currentStep: 3, status: ApprovalStatus.APPROVED });
  });

  it('marks the request approved when the final step is skipped, not rejected or left pending', () => {
    const result = advanceApprovalRequest({
      request: { currentStep: 2, status: ApprovalStatus.PENDING },
      steps: THREE_STEP_CHAIN,
      actorRole: Role.ADMIN,
      decision: ApprovalActionType.SKIP,
    });

    expect(result.request).toEqual({ currentStep: 3, status: ApprovalStatus.APPROVED });
    expect(result.actionType).toBe(ApprovalActionType.SKIP);
  });

  it('advances past a mid-chain skip without resolving the request', () => {
    const result = advanceApprovalRequest({
      request: { currentStep: 0, status: ApprovalStatus.PENDING },
      steps: THREE_STEP_CHAIN,
      actorRole: Role.MANAGER,
      decision: ApprovalActionType.SKIP,
    });

    expect(result.request).toEqual({ currentStep: 1, status: ApprovalStatus.PENDING });
  });

  it('halts the chain on rejection regardless of which step it happens at', () => {
    const result = advanceApprovalRequest({
      request: { currentStep: 1, status: ApprovalStatus.PENDING },
      steps: THREE_STEP_CHAIN,
      actorRole: Role.FINANCE,
      decision: ApprovalActionType.REJECT,
    });

    expect(result.request).toEqual({ currentStep: 1, status: ApprovalStatus.REJECTED });
  });

  it('rejects an action from a role that does not match the current step', () => {
    expect(() =>
      advanceApprovalRequest({
        request: { currentStep: 0, status: ApprovalStatus.PENDING },
        steps: THREE_STEP_CHAIN,
        actorRole: Role.FINANCE,
        decision: ApprovalActionType.APPROVE,
      }),
    ).toThrow(expect.objectContaining({ statusCode: 403, code: 'FORBIDDEN' }));
  });

  it('allows an admin to act on a step regardless of the assigned role', () => {
    const result = advanceApprovalRequest({
      request: { currentStep: 0, status: ApprovalStatus.PENDING },
      steps: THREE_STEP_CHAIN,
      actorRole: Role.ADMIN,
      decision: ApprovalActionType.APPROVE,
    });

    expect(result.request.currentStep).toBe(1);
  });

  it('rejects acting on a request that is already resolved', () => {
    expect(() =>
      advanceApprovalRequest({
        request: { currentStep: 1, status: ApprovalStatus.REJECTED },
        steps: THREE_STEP_CHAIN,
        actorRole: Role.FINANCE,
        decision: ApprovalActionType.APPROVE,
      }),
    ).toThrow(
      expect.objectContaining({
        statusCode: 409,
        code: 'REQUEST_ALREADY_RESOLVED',
      } satisfies Partial<AppError>),
    );
  });
});

describe('canActOnStep', () => {
  it('allows the assigned role', () => {
    expect(canActOnStep(Role.MANAGER, Role.MANAGER)).toBe(true);
  });

  it('allows an admin regardless of the assigned role', () => {
    expect(canActOnStep(Role.MANAGER, Role.ADMIN)).toBe(true);
  });

  it('rejects an unrelated role', () => {
    expect(canActOnStep(Role.MANAGER, Role.EMPLOYEE)).toBe(false);
  });
});
