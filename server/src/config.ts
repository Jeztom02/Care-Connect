import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Validate required environment variables
const requiredEnvVars = [
  'JWT_SECRET',
  'MONGODB_URI',
  'NODE_ENV'
];

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error(`Missing required environment variables: ${missingVars.join(', ')}`);
  process.exit(1);
}

// Configuration object
export const config = {
  // Server configuration
  port: parseInt(process.env.PORT || '3001', 10),
  env: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
  isDevelopment: process.env.NODE_ENV !== 'production',
  
  // JWT configuration
  jwt: {
    secret: process.env.JWT_SECRET!,
    expiresIn: process.env.JWT_EXPIRES_IN || '7d', // 7 days
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d', // 30 days
  },
  
  // Database configuration
  database: {
    uri: process.env.MONGODB_URI!,
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    },
  },
  
  // Email configuration
  email: {
    enabled: process.env.EMAIL_ENABLED === 'true',
    from: process.env.EMAIL_FROM || 'noreply@compassioncare.com',
    smtp: {
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    },
  },
  
  // WebSocket configuration
  websocket: {
    pingTimeout: 30000, // 30 seconds
    pingInterval: 25000, // 25 seconds
    maxHttpBufferSize: 1e8, // 100MB
    cors: {
      origin: process.env.ALLOWED_ORIGINS?.split(',').map(o => o.trim()) || '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      credentials: true,
    },
  },
  
  // Rate limiting
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
  },
  
  // Upload configuration
  uploads: {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedMimeTypes: [
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ],
    uploadDir: process.env.UPLOAD_DIR || 'uploads',
  },
};

// Export individual configs for easier imports
export const {
  port,
  env,
  isProduction,
  isDevelopment,
  jwt,
  database,
  email,
  websocket,
  rateLimit,
  uploads,
} = config;

// JWT secret getter
export const JWT_SECRET = jwt.secret;

export default config;
