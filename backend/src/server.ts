import dotenv from 'dotenv';
dotenv.config();

import http from 'http';
import { createApp } from './app';
import { connectDB } from './config/db';
import { initLiveSocket } from './socket/liveSocket';

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // 1. Connect to Database
    await connectDB();

    // 2. Start Express app & HTTP Server with Socket.io
    const app = createApp();
    const server = http.createServer(app);

    // 3. Initialize Real-Time Chat & WebRTC Gateway
    initLiveSocket(server);

    server.listen(PORT, () => {
      console.log(`=========================================`);
      console.log(`🚀 Binary Vidya Server is running on port ${PORT}`);
      console.log(`📡 Real-Time Chat & WebRTC Gateway Initialized`);
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
