import { Router } from 'express';
import { z } from 'zod';
import { signup, login, getUserById } from '../services/auth.service';
import { authenticate } from '../middleware/auth.middleware';
import { parseOrThrow } from '../lib/validate';
import { NotFoundError } from '../lib/errors';

export const authRouter = Router();

const signupSchema = z.object({
  organizationName: z.string().min(1, 'Organization name is required'),
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('A valid email is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

const loginSchema = z.object({
  email: z.string().email('A valid email is required'),
  password: z.string().min(1, 'Password is required'),
});

authRouter.post('/signup', async (req, res) => {
  const input = parseOrThrow(signupSchema, req.body);
  const result = await signup(input);
  res.status(201).json(result);
});

authRouter.post('/login', async (req, res) => {
  const input = parseOrThrow(loginSchema, req.body);
  const result = await login(input);
  res.status(200).json(result);
});

authRouter.get('/me', authenticate, async (req, res) => {
  const user = await getUserById(req.user!.sub);
  if (!user) {
    throw new NotFoundError('User not found');
  }
  res.status(200).json({ user });
});
