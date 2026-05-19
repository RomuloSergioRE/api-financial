import express from 'express';
import type { Application, Request, Response } from 'express';
import cors from 'cors';
import authRouter from './routes/auth.routes.js';

const app: Application = express();

app.use(cors());
app.use(express.json());

app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'success',
    message: 'Servidor rodando perfeitamente!',
    timestamp: new Date().toISOString()
  });
});
app.use('/auth', authRouter);
export default app;