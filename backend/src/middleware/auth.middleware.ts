import type { NextFunction, Request, Response } from 'express';
import type { Role } from '@prisma/client';
import { verifyAuthToken } from '../lib/jwt';
import { AppError } from '../lib/errors';

export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  const token = header?.startsWith('Bearer ') ? header.slice('Bearer '.length) : undefined;

  if (!token) {
    throw new AppError(401, 'UNAUTHENTICATED', 'Missing or invalid Authorization header');
  }

  try {
    req.user = verifyAuthToken(token);
  } catch {
    throw new AppError(401, 'UNAUTHENTICATED', 'Invalid or expired token');
  }

  next();
}

export function authorize(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new AppError(401, 'UNAUTHENTICATED', 'Missing or invalid Authorization header');
    }
    if (!roles.includes(req.user.role)) {
      throw new AppError(403, 'FORBIDDEN', 'You do not have permission to perform this action');
    }
    next();
  };
}
