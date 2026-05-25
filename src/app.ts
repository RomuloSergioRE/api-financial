import express from 'express';
import type { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet'; 
import { rateLimit } from 'express-rate-limit'; 
import swaggerUi from 'swagger-ui-express';
import { getSwaggerDocument } from './config/swagger.js'; 
import routes from './routes/index.js'; 

const app: Application = express();

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:"],
    },
  },
}));

const allowedOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',')
  : ['http://localhost:3000', 'http://localhost:*'];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.some(o => {
      if (o.endsWith(':*')) {
        const base = o.slice(0, -2);
        return origin.startsWith(base);
      }
      return o === origin;
    })) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));
app.use(express.json({ limit: '10kb' })); 

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  limit: 100, 
  standardHeaders: 'draft-7', 
  legacyHeaders: false, 
  message: { error: 'Muitas requisições vindas deste IP. Tente novamente em 15 minutos.' }
});
app.use(limiter);

const renderUrl = process.env.RENDER_EXTERNAL_URL || process.env.SWAGGER_SERVER_URL;
const swaggerDoc = getSwaggerDocument(renderUrl);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDoc));

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