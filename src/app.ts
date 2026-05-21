import express from 'express';
import type { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import { swaggerDocument } from './config/swagger.js'; 
import routes from './routes/index.js'; 

const app: Application = express();
app.use(cors());
app.use(express.json());

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