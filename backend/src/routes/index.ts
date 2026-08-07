import { Router } from 'express';
import { healthRouter } from './health.routes';
import { authRouter } from './auth.routes';
import { workflowTemplatesRouter } from './workflowTemplates.routes';
import { approvalRequestsRouter } from './approvalRequests.routes';
import { changeRequestsRouter } from './changeRequests.routes';
import { usersRouter } from './users.routes';
import { auditLogRouter } from './auditLog.routes';
import { organizationsRouter } from './organizations.routes';
import { departmentsRouter } from './departments.routes';
import { positionsRouter } from './positions.routes';

export const apiRouter = Router();

apiRouter.use('/health', healthRouter);
apiRouter.use('/auth', authRouter);
apiRouter.use('/workflow-templates', workflowTemplatesRouter);
apiRouter.use('/approval-requests', approvalRequestsRouter);
apiRouter.use('/change-requests', changeRequestsRouter);
apiRouter.use('/users', usersRouter);
apiRouter.use('/audit-log', auditLogRouter);
apiRouter.use('/organizations', organizationsRouter);
apiRouter.use('/departments', departmentsRouter);
apiRouter.use('/positions', positionsRouter);
