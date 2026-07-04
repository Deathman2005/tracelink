import rateLimit from 'express-rate-limit';
import { RATE_LIMIT_WINDOW_MS, RATE_LIMIT_MAX } from '../config/constants';

const isDev = process.env.NODE_ENV !== 'production';

// Rate limiter for general API routes
export const apiLimiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: isDev ? 100000 : RATE_LIMIT_MAX,
  message: {
    message: 'Too many requests from this IP, please try again after 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter rate limiter for authentication routes (login, signup)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 mins
  max: isDev ? 1000 : 15, // limit to 15 auth attempts
  message: {
    message: 'Too many login or signup attempts. Please try again after 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Relaxed rate limiter for redirection tracking links
export const redirectLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 mins
  max: isDev ? 50000 : 500, // allow up to 500 redirection opens per IP
  message: {
    message: 'Redirection request limits exceeded. Please slow down.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
