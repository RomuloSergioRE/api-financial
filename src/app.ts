import express from 'express';
import type { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet'; 
import { rateLimit } from 'express-rate-limit'; 
import swaggerUi from 'swagger-ui-express';
import { swaggerDocument } from './config/swagger.js'; 
import routes from './routes/index.js'; 

const app: Application = express();

app.use(helmet({
  contentSecurityPolicy: false,
}));

app.use(cors());
app.use(express.json({ limit: '10kb' })); 

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  limit: 100, 
  standardHeaders: 'draft-7', 
  legacyHeaders: false, 
  message: { error: 'Muitas requisições vindas deste IP. Tente novamente em 15 minutos.' }
});
app.use(limiter);

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'success',
    message: 'Servidor rodando perfeitamente!',
    timestamp: new Date().toISOString()
  });
});

app.use(routes);

app.use((req: Request, res: Response) => {
  res.status(404).json({ error: `Route ${req.originalUrl} not found` });
});

app.use((error: any, req: Request, res: Response, next: NextFunction) => {
  console.error('🚨 Global Error Intercepted:', error);
  
  res.status(error.status || 500).json({
    error: error.message || 'Internal Server Error'
  });
});

export default app;