import express from 'express';
import http from 'http';
import { Server as IOServer } from 'socket.io';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

import { PORT, CLIENT_URL } from './config/env';
import { connectDB } from './config/db';
import { logger, morganStream } from './utils/logger';

import authRoutes from './routes/authRoutes';
import deviceRoutes from './routes/deviceRoutes';
import networkRoutes from './routes/networkRoutes';
import securityRoutes from './routes/securityRoutes';
import exportRoutes from './routes/exportRoutes';
import { initWebsocket } from './websocket/wsServer';
import { errorHandler } from './middleware/errorHandler';

const app = express();
const server = http.createServer(app);

// Use only your frontend port
app.use(cors({ origin: 'http://localhost:8080', credentials: true }));

// Middleware
app.use(helmet());
app.use(express.json());
app.use(morgan('combined', { stream: morganStream }));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 200 }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/devices', deviceRoutes);
app.use('/api/network', networkRoutes);
app.use('/api/security', securityRoutes);
app.use('/api/export', exportRoutes);

// Error handler
app.use(errorHandler);

// Socket.IO
const io = new IOServer(server, {
  cors: { origin: 'http://localhost:8080', methods: ['GET', 'POST'], credentials: true },
});

initWebsocket(io);

// Start server
const start = async () => {
  try {
    await connectDB();
    server.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
    });
  } catch (err) {
    logger.error('Failed to start server', err);
    process.exit(1);
  }
};

start();
