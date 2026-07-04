import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config();

export const PORT = process.env.PORT || 5000;
export const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/tracelink';

export const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'tracelink-access-super-secret-key-1234';
export const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'tracelink-refresh-super-secret-key-5678';
export const JWT_ACCESS_EXPIRY = '15m';
export const JWT_REFRESH_EXPIRY = '7d';
export const JWT_REFRESH_COOKIE_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 days in ms

export const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:3000';

export const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
export const RATE_LIMIT_MAX = 100; // limit each IP to 100 requests per windowMs

// Storage config
export const STORAGE_DRIVER = process.env.STORAGE_DRIVER || 'local'; // 'local' or 's3'
export const S3_ACCESS_KEY_ID = process.env.S3_ACCESS_KEY_ID || '';
export const S3_SECRET_ACCESS_KEY = process.env.S3_SECRET_ACCESS_KEY || '';
export const S3_ENDPOINT = process.env.S3_ENDPOINT || ''; // E.g., Cloudflare R2 endpoint
export const S3_BUCKET_NAME = process.env.S3_BUCKET_NAME || 'tracelink-assets';
export const LOCAL_UPLOAD_DIR = path.join(__dirname, '../../uploads');
export const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;
