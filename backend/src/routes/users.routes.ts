import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { listOrganizationUsers } from '../services/userService';

export const usersRouter = Router();

usersRouter.use(authenticate);

usersRouter.get('/', async (req, res) => {
  const users = await listOrganizationUsers(req.user!.organizationId);
  res.status(200).json({ users });
});
