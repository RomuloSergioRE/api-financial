import express from 'express';
import type { Application, Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { asyncHandler } from './utils/async-handler.js';
import cors from 'cors';
import helmet from 'helmet'; 
import { rateLimit } from 'express-rate-limit'; 
import swaggerUi from 'swagger-ui-express';
import { getSwaggerDocument } from './config/swagger.js'; 
import routes from './routes/index.js'; 
import { requestIdMiddleware } from './middlewares/requestId.middleware.js';
import { metricsMiddleware } from './middlewares/metrics.middleware.js';
import { z } from 'zod';
import multer from 'multer';
import { BusinessError } from './utils/errors.js';
import { logger, getRequestId } from './utils/logger.js';
import sequelize from './config/db.js';
import cookieParser from 'cookie-parser';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
logger.info(`Serving static files from ${uploadsDir}`);

const app: Application = express();

app.use(requestIdMiddleware);
app.use(cookieParser());

const allowedOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',')
  : ['http://localhost:3000', 'http://localhost:*'];

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      connectSrc: ["'self'", ...allowedOrigins],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:"],
    },
  },
}));

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.some(o => {
      if (o.endsWith(':*')) {
        const base = o.slice(0, -2);
        try {
          const url = new URL(origin);
          return url.hostname === 'localhost' && (url.port !== '' || origin === base);
        } catch {
          return false;
        }
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

const skipOptions = (req: Request) => req.method === 'OPTIONS';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  limit: 100, 
  skip: skipOptions,
  standardHeaders: 'draft-7', 
  legacyHeaders: false, 
  message: { error: 'Too many requests from this IP. Please try again in 15 minutes.' }
});
app.use(limiter);

app.use(metricsMiddleware);

const renderUrl = process.env.RENDER_EXTERNAL_URL || process.env.SWAGGER_SERVER_URL;
const swaggerDoc = getSwaggerDocument(renderUrl);
if (process.env.NODE_ENV !== 'production') {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDoc));
}

app.use('/uploads', express.static(uploadsDir));

app.get('/health', async (req: Request, res: Response) => {
  try {
    await sequelize.authenticate();
    res.status(200).json({
      status: 'success',
      message: 'Server is running!',
      timestamp: new Date().toISOString()
    });
  } catch {
    res.status(503).json({
      status: 'error',
      message: 'Database connection failed',
      timestamp: new Date().toISOString()
    });
  }
});

app.use(routes);

app.use((req: Request, res: Response) => {
  res.status(404).json({ error: `Route ${req.originalUrl} not found` });
});

app.use((error: unknown, req: Request, res: Response, next: NextFunction) => {
  if (error instanceof BusinessError) {
    res.status(error.statusCode).json({ error: error.message });
    return;
  }
  if (error instanceof z.ZodError) {
    res.status(400).json({ error: 'Validation Error', details: error.issues });
    return;
  }
  if (error instanceof multer.MulterError) {
    const messages: Record<string, string> = {
      LIMIT_FILE_SIZE: 'Arquivo muito grande. O tamanho máximo é 2MB.',
      LIMIT_UNEXPECTED_FILE: 'Campo de arquivo inválido.',
    };
    res.status(400).json({ error: messages[error.code] || 'Erro no upload do arquivo' });
    return;
  }
  const requestId = getRequestId();
  logger.error('Unhandled error in global middleware', error);
  if (process.env.NODE_ENV === 'development') {
    res.status(500).json({ error: 'Internal Server Error', requestId, detail: String(error) });
    return;
  }
  res.status(500).json({ error: 'Internal Server Error', requestId });
});

export default app;