import { Router } from 'express';
import authRouter from './auth.routes.js';
import transactionRoutes from './transactions.routes.js';
import categoryRouter from './category.routes.js';
import analyticsRoutes from './analytics.routes.js';

import swaggerUi from 'swagger-ui-express';
import { swaggerDocument } from '../config/swagger.js';

const routes = Router();

routes.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

routes.use('/auth', authRouter);
routes.use('/transactions', transactionRoutes);
routes.use('/categories', categoryRouter);
routes.use('/analytics', analyticsRoutes);

export default routes;