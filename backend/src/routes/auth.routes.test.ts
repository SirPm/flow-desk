import request from 'supertest';
import { Role } from '@prisma/client';
import { createApp } from '../app';
import { AppError } from '../lib/errors';

jest.mock('../services/auth.service');

import { signup, login } from '../services/auth.service';

const app = createApp();

const authResult = {
  token: 'signed.jwt.token',
  user: {
    id: 'user_1',
    name: 'Ada Admin',
    email: 'admin@acme.test',
    role: Role.ADMIN,
    organizationId: 'org_1',
  },
};

describe('POST /api/v1/auth/signup', () => {
  it('returns 400 for a missing required field', async () => {
    const res = await request(app).post('/api/v1/auth/signup').send({ email: 'admin@acme.test' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(signup).not.toHaveBeenCalled();
  });

  it('returns 201 with the auth result on success', async () => {
    (signup as jest.Mock).mockResolvedValue(authResult);

    const res = await request(app).post('/api/v1/auth/signup').send({
      organizationName: 'Acme Corp',
      name: 'Ada Admin',
      email: 'admin@acme.test',
      password: 'password123',
    });

    expect(res.status).toBe(201);
    expect(res.body).toEqual(authResult);
  });

  it('propagates a service error as a standardized error response', async () => {
    (signup as jest.Mock).mockRejectedValue(
      new AppError(409, 'EMAIL_TAKEN', 'An account with this email already exists'),
    );

    const res = await request(app).post('/api/v1/auth/signup').send({
      organizationName: 'Acme Corp',
      name: 'Ada Admin',
      email: 'admin@acme.test',
      password: 'password123',
    });

    expect(res.status).toBe(409);
    expect(res.body).toEqual({
      error: { code: 'EMAIL_TAKEN', message: 'An account with this email already exists' },
    });
  });
});

describe('POST /api/v1/auth/login', () => {
  it('returns 401 for invalid credentials', async () => {
    (login as jest.Mock).mockRejectedValue(
      new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password'),
    );

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin@acme.test', password: 'wrong' });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
  });

  it('returns 200 with the auth result on success', async () => {
    (login as jest.Mock).mockResolvedValue(authResult);

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin@acme.test', password: 'password123' });

    expect(res.status).toBe(200);
    expect(res.body).toEqual(authResult);
  });
});

describe('GET /api/v1/auth/me', () => {
  it('returns 401 without a token', async () => {
    const res = await request(app).get('/api/v1/auth/me');
    expect(res.status).toBe(401);
  });
});
