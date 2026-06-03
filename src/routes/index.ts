import { Router } from 'express';
import authRouter from './auth.routes.js';
import transactionRoutes from './transactions.routes.js';
import categoryRouter from './category.routes.js';
import analyticsRoutes from './analytics.routes.js';
import adminRoutes from './admin.routes.js';
import tagRouter from './tag.routes.js';
import budgetRouter from './budget.routes.js';
import goalRouter from './goal.routes.js';
import recurringRouter from './recurring-rule.routes.js';
import organizationRouter from './organization.routes.js';

const routes = Router();

routes.use('/auth', authRouter);
routes.use('/transactions', transactionRoutes);
routes.use('/categories', categoryRouter);
routes.use('/analytics', analyticsRoutes);
routes.use('/admin', adminRoutes);
routes.use('/tags', tagRouter);
routes.use('/budgets', budgetRouter);
routes.use('/goals', goalRouter);
routes.use('/recurring', recurringRouter);
routes.use('/organizations', organizationRouter);

export default routes;