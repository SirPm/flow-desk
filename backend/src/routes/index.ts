import { Router } from 'express';
import { healthRouter } from './health.routes';
import { authRouter } from './auth.routes';
import { workflowTemplatesRouter } from './workflowTemplates.routes';
import { approvalRequestsRouter } from './approvalRequests.routes';

export const apiRouter = Router();

apiRouter.use('/health', healthRouter);
apiRouter.use('/auth', authRouter);
apiRouter.use('/workflow-templates', workflowTemplatesRouter);
apiRouter.use('/approval-requests', approvalRequestsRouter);
