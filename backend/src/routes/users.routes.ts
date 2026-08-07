import { Router } from 'express';
import { Role } from '@prisma/client';
import { authenticate } from '../middleware/auth.middleware';
import { getUserProfile, listOrganizationUsers, type EmployeeSummary } from '../services/userService';

export const usersRouter = Router();

usersRouter.use(authenticate);

function withoutSalary(user: EmployeeSummary): Omit<EmployeeSummary, 'salary'> {
  const { salary: _salary, ...rest } = user;
  return rest;
}

usersRouter.get('/me', async (req, res) => {
  const user = await getUserProfile(req.user!.sub, req.user!.organizationId);
  res.status(200).json({ user });
});

usersRouter.get('/', async (req, res) => {
  const users = await listOrganizationUsers(req.user!.organizationId);
  const canSeeSalary = req.user!.role === Role.ADMIN || req.user!.role === Role.MANAGER;
  res.status(200).json({
    users: canSeeSalary
      ? users
      : users.map((user) => (user.id === req.user!.sub ? user : withoutSalary(user))),
  });
});
