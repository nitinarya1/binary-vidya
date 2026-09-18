import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.routes';
import courseRoutes from './routes/course.routes';
import paymentRoutes from './routes/payment.routes';
import enrollmentRoutes from './routes/enrollment.routes';
import certificateRoutes from './routes/certificate.routes';
import uploadRoutes from './routes/upload.routes';
import trainingRoutes from './routes/training.routes';

export const createApp = (): Application => {
  const app = express();

  // Middleware
  app.use(
    cors({
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      credentials: true,
    })
  );
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Health Check
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'Binary Vidya Backend',
    });
  });

  // Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/courses', courseRoutes);
  app.use('/api/payment', paymentRoutes);
  app.use('/api/enrollments', enrollmentRoutes);
  app.use('/api/certificates', certificateRoutes);
  app.use('/api/upload', uploadRoutes);
  app.use('/api/training-internship', trainingRoutes);

  // 404 Handler
  app.use((req: Request, res: Response) => {
    res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
  });

  // Global Error Handler
  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error('[Unhandled Server Error]:', err);
    res.status(err.status || 500).json({
      success: false,
      message: err.message || 'Internal Server Error',
    });
  });

  return app;
};
