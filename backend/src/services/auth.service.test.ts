import { Role } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { signup, login } from './auth.service';
import { AppError } from '../lib/errors';

const now = new Date();

const baseUser = {
  id: 'user_1',
  name: 'Ada Admin',
  email: 'admin@acme.test',
  passwordHash: '',
  role: Role.ADMIN,
  organizationId: 'org_1',
  departmentId: null,
  positionId: null,
  salary: null,
  employmentType: null,
  createdAt: now,
  updatedAt: now,
};

describe('auth.service', () => {
  beforeEach(() => {
    jest.spyOn(prisma, '$transaction').mockImplementation(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (fn: any) => fn(prisma),
    );
  });

  describe('signup', () => {
    it('creates an organization and an ADMIN user, returning a sanitized user and a token', async () => {
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(null);
      jest.spyOn(prisma.organization, 'create').mockResolvedValue({
        id: 'org_1',
        name: 'Acme Corp',
        featureFlags: {},
        createdAt: now,
        updatedAt: now,
      });
      jest.spyOn(prisma.user, 'create').mockResolvedValue({ ...baseUser, passwordHash: 'hashed' });

      const result = await signup({
        organizationName: 'Acme Corp',
        name: 'Ada Admin',
        email: 'admin@acme.test',
        password: 'password123',
      });

      expect(result.user).toEqual({
        id: 'user_1',
        name: 'Ada Admin',
        email: 'admin@acme.test',
        role: Role.ADMIN,
        organizationId: 'org_1',
      });
      expect(result.user).not.toHaveProperty('passwordHash');
      expect(typeof result.token).toBe('string');
      expect(prisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ role: Role.ADMIN, organizationId: 'org_1' }),
        }),
      );
    });

    it('rejects signup when the email is already registered', async () => {
      jest
        .spyOn(prisma.user, 'findUnique')
        .mockResolvedValue({ ...baseUser, passwordHash: 'hashed' });

      await expect(
        signup({
          organizationName: 'Acme Corp',
          name: 'Ada Admin',
          email: 'admin@acme.test',
          password: 'password123',
        }),
      ).rejects.toMatchObject<Partial<AppError>>({ statusCode: 409, code: 'EMAIL_TAKEN' });
    });
  });

  describe('login', () => {
    it('rejects login for an unknown email', async () => {
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(null);

      await expect(
        login({ email: 'nobody@acme.test', password: 'password123' }),
      ).rejects.toMatchObject<Partial<AppError>>({ statusCode: 401, code: 'INVALID_CREDENTIALS' });
    });

    it('rejects login when the password does not match', async () => {
      const { hashPassword } = await import('../lib/password');
      const passwordHash = await hashPassword('correct-password');
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue({ ...baseUser, passwordHash });

      await expect(
        login({ email: 'admin@acme.test', password: 'wrong-password' }),
      ).rejects.toMatchObject<Partial<AppError>>({ statusCode: 401, code: 'INVALID_CREDENTIALS' });
    });

    it('returns a sanitized user and token on valid credentials', async () => {
      const { hashPassword } = await import('../lib/password');
      const passwordHash = await hashPassword('correct-password');
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue({ ...baseUser, passwordHash });

      const result = await login({ email: 'admin@acme.test', password: 'correct-password' });

      expect(result.user.email).toBe('admin@acme.test');
      expect(result.user).not.toHaveProperty('passwordHash');
      expect(typeof result.token).toBe('string');
    });
  });
});
