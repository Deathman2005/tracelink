import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { connectDB } from './config/db';
import { PORT, CORS_ORIGIN, LOCAL_UPLOAD_DIR } from './config/constants';
import routes from './routes';
import { errorHandler } from './middlewares/error.middleware';
import { apiLimiter } from './middlewares/rate-limiter';

const app = express();

// Connect to Database
connectDB();

// Security Headers with Helmet
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }, // Allow frontend to read static local files/images
  })
);

// Enable CORS with support for cookie-based credentials
app.use(
  cors({
    origin: CORS_ORIGIN,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
  })
);

// Body Parser Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Manual Cookie Parser Middleware (Extract cookies from Cookie header to req.cookies)
app.use((req: Request, _res: Response, next: NextFunction) => {
  const cookieHeader = req.headers.cookie;
  req.cookies = {};
  if (cookieHeader) {
    const list: Record<string, string> = {};
    cookieHeader.split(';').forEach((cookie) => {
      const parts = cookie.split('=');
      if (parts.length >= 2) {
        const key = parts[0].trim();
        const value = decodeURIComponent(parts.slice(1).join('=')).trim();
        list[key] = value;
      }
    });
    req.cookies = list;
  }
  next();
});

// Serve local upload files statically
app.use('/uploads', express.static(LOCAL_UPLOAD_DIR));

// General API request rate-limiting
app.use('/api/', apiLimiter);

// Bind main routes (Auth, Link/File CRUD, Tracking, Analytics)
app.use(routes);

// Default status health-check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'healthy', timestamp: new Date() });
});

// Global Error Handler Middleware
app.use(errorHandler);

// Start listening
app.listen(PORT, () => {
  console.log(`TraceLink Monolithic Server running on port ${PORT}`);
});

export default app;
// Server trigger comment to force nodemon restart after freeing port 5000

