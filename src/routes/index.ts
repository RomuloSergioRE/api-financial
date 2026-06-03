import { Router } from 'express';
import authRouter from './auth.routes.js';
import transactionRoutes from './transactions.routes.js';
import categoryRouter from './category.routes.js';
import analyticsRoutes from './analytics.routes.js';
import adminRoutes from './admin.routes.js';
import tagRouter from './tag.routes.js';

const routes = Router();

routes.use('/auth', authRouter);
routes.use('/transactions', transactionRoutes);
routes.use('/categories', categoryRouter);
routes.use('/analytics', analyticsRoutes);
routes.use('/admin', adminRoutes);
routes.use('/tags', tagRouter);

export default routes;