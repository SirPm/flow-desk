import { Role } from '@prisma/client';
import type { Request, Response } from 'express';
import { signAuthToken } from '../lib/jwt';
import { authenticate, authorize } from './auth.middleware';
import { AppError } from '../lib/errors';

function mockReq(headers: Record<string, string> = {}): Request {
  return { headers } as unknown as Request;
}

describe('authenticate', () => {
  it('throws when the Authorization header is missing', () => {
    const next = jest.fn();
    expect(() => authenticate(mockReq(), {} as Response, next)).toThrow(AppError);
    expect(next).not.toHaveBeenCalled();
  });

  it('throws when the token is invalid', () => {
    const next = jest.fn();
    expect(() =>
      authenticate(mockReq({ authorization: 'Bearer not-a-real-token' }), {} as Response, next),
    ).toThrow(AppError);
  });

  it('attaches the decoded payload to req.user and calls next on a valid token', () => {
    const token = signAuthToken({ sub: 'user_1', role: Role.MANAGER, organizationId: 'org_1' });
    const req = mockReq({ authorization: `Bearer ${token}` });
    const next = jest.fn();

    authenticate(req, {} as Response, next);

    expect(req.user).toMatchObject({ sub: 'user_1', role: Role.MANAGER, organizationId: 'org_1' });
    expect(next).toHaveBeenCalledTimes(1);
  });
});

describe('authorize', () => {
  it('rejects a role that is not in the allowed list', () => {
    const req = mockReq();
    req.user = { sub: 'user_1', role: Role.EMPLOYEE, organizationId: 'org_1' };
    const next = jest.fn();

    expect(() => authorize(Role.ADMIN, Role.MANAGER)(req, {} as Response, next)).toThrow(
      expect.objectContaining({ statusCode: 403, code: 'FORBIDDEN' }),
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('calls next when the role is allowed', () => {
    const req = mockReq();
    req.user = { sub: 'user_1', role: Role.ADMIN, organizationId: 'org_1' };
    const next = jest.fn();

    authorize(Role.ADMIN, Role.MANAGER)(req, {} as Response, next);

    expect(next).toHaveBeenCalledTimes(1);
  });
});
