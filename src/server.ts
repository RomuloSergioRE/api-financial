import app from './app.js';
import sequelize from './config/db.js';
import dotenv from 'dotenv';
import './models/index.js';

dotenv.config();

const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

function validateRequiredEnvs(): void {
  const required = ['DB_NAME', 'DB_USER', 'DB_PASS', 'DB_HOST', 'JWT_SECRET'];
  const missing = required.filter(env => !process.env[env]);
  if (missing.length > 0) {
    console.error(`❌ Missing required environment variables: ${missing.join(', ')}`);
    process.exit(1);
  }
}

async function startServer(): Promise<void> {
  try {
    validateRequiredEnvs();
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');
    
    if (NODE_ENV !== 'production') {
      await sequelize.sync({ alter: true });
      console.log('✨ All models and associations synced successfully in development mode.');
    } else {
      await sequelize.sync();
      console.log('📦 Database tables synced successfully.');
    }

    app.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}`);
      console.log(`📄 Swagger UI available at http://localhost:${PORT}/api-docs`);
    });
  } catch (error) {
    console.error('❌ Unable to connect to the database:', error);
    process.exit(1);
  }
}

void startServer();