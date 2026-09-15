import dotenv from 'dotenv';
dotenv.config();

import { createApp } from './app';
import { connectDB } from './config/db';

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // 1. Connect to Database
    await connectDB();

    // 2. Start Express app
    const app = createApp();
    app.listen(PORT, () => {
      console.log(`=========================================`);
      console.log(`🚀 Binary Vidya Server is running on port ${PORT}`);
      console.log(`🌐 Health check: http://localhost:${PORT}/api/health`);
      console.log(`🔐 Auth API: http://localhost:${PORT}/api/auth`);
      console.log(`=========================================`);
    });
  } catch (error) {
    console.error('[Fatal Server Startup Error]:', error);
    process.exit(1);
  }
};

startServer();
