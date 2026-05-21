import app from './app.js';
import sequelize from './config/db.js';
import dotenv from 'dotenv';
import './models/index.js';

dotenv.config();

const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

async function startServer(): Promise<void> {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');
    
    if (NODE_ENV !== 'production') {
      await sequelize.sync({ alter: true });
      console.log('✨ All models and associations synced successfully in development mode.');
    } else {
      await sequelize.sync(); 
      console.log('📦 Database models synced safely for production.');
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