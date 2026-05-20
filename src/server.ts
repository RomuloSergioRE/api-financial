import app from './app.js';
import sequelize from './config/db.js';
import dotenv from 'dotenv';
import './models/index.js';

dotenv.config();

const PORT = process.env.PORT || 3000;

async function startServer(): Promise<void> {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');

    await sequelize.sync({ alter: true});
    //await sequelize.sync({force: true});
    console.log('✨ All models and associations synced successfully.');

    app.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('❌ Unable to connect to the database:', error);
    process.exit(1);
  }
}

void startServer();