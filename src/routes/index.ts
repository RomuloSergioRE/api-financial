import { Router } from 'express';
import authRouter from './auth.routes.js';
import transactionRoutes from './transactions.routes.js';
import categoryRouter from './category.routes.js';

const routes = Router();

routes.use('/auth', authRouter);
routes.use('/transactions', transactionRoutes);
routes.use('/categories', categoryRouter);

export default routes;