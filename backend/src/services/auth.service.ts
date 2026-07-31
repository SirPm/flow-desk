import { Role } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { hashPassword, verifyPassword } from '../lib/password';
import { signAuthToken } from '../lib/jwt';
import { AppError } from '../lib/errors';

export interface AuthResult {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: Role;
    organizationId: string;
  };
}

export interface SignupInput {
  organizationName: string;
  name: string;
  email: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

function toAuthResult(user: {
  id: string;
  name: string;
  email: string;
  role: Role;
  organizationId: string;
}): AuthResult {
  const token = signAuthToken({
    sub: user.id,
    role: user.role,
    organizationId: user.organizationId,
  });
  const { id, name, email, role, organizationId } = user;
  return { token, user: { id, name, email, role, organizationId } };
}

export async function signup(input: SignupInput): Promise<AuthResult> {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) {
    throw new AppError(409, 'EMAIL_TAKEN', 'An account with this email already exists');
  }

  const passwordHash = await hashPassword(input.password);

  const user = await prisma.$transaction(async (tx) => {
    const organization = await tx.organization.create({ data: { name: input.organizationName } });
    return tx.user.create({
      data: {
        name: input.name,
        email: input.email,
        passwordHash,
        role: Role.ADMIN,
        organizationId: organization.id,
      },
    });
  });

  return toAuthResult(user);
}

export async function login(input: LoginInput): Promise<AuthResult> {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  if (!user) {
    throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
  }

  const passwordMatches = await verifyPassword(input.password, user.passwordHash);
  if (!passwordMatches) {
    throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
  }

  return toAuthResult(user);
}

export async function getUserById(id: string): Promise<AuthResult['user'] | null> {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return null;
  const { id: userId, name, email, role, organizationId } = user;
  return { id: userId, name, email, role, organizationId };
}
