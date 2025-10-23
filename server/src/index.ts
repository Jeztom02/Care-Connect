import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import session from 'express-session';
import { authenticateJwt, authorizeRoles, signToken } from './auth';
import { patientsRouter } from './routes/patients';
import { appointmentsRouter } from './routes/appointments';
import { messagesRouter } from './routes/messages';
import { alertsRouter } from './routes/alerts';
import { medicalRecordsRouter } from './routes/medicalRecords';
import { prescriptionsRouter } from './routes/prescriptions';
import { roundsRouter } from './routes/rounds';
import { usersRouter } from './routes/users';
import { volunteerRouter } from './routes/volunteer';
import nurseRouter from './routes/nurse';
import { patientStatusRouter } from './routes/patientStatus';
import { careUpdatesRouter } from './routes/careUpdates';
import { medicationsRouter } from './routes/medications';
import { adminRouter } from './routes/admin';
import { uploadsRouter } from './routes/uploads';
import { patientCareRouter } from './routes/patientCare';
import { connectMongo } from './db';
import { User, Patient } from './models';
import crypto from 'crypto';
import { sendEmail, verifyTransporter, getEmailConfig } from './email';
import path from 'path';
import bcrypt from 'bcryptjs';
import { passport } from './googleAuth';
import http from 'http';
import { Server } from 'socket.io';
import type { Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { setIO } from './socket';

import { fileURLToPath } from 'url';
import { securityHeaders } from './middleware/securityHeaders';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Config
const PORT = Number(process.env.PORT || 3001);
// Support multiple allowed origins via comma-separated ORIGIN env
const ORIGIN = process.env.ORIGIN || 'http://localhost:5173,http://localhost:3000,http://localhost:8080';
const ALLOWED_ORIGINS = ORIGIN.split(',').map(o => o.trim()).filter(Boolean);
const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/compassion';

// CORS configuration
const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Check if the origin is in the allowed list or if we're in development
    if (
      ALLOWED_ORIGINS.includes(origin) || 
      ALLOWED_ORIGINS.includes('*') ||
      process.env.NODE_ENV === 'development'
    ) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked request from origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  exposedHeaders: ['Content-Range', 'X-Total-Count'],
  credentials: true,
  maxAge: 600, // 10 minutes
  preflightContinue: false,
  optionsSuccessStatus: 204
};

// Apply middleware
app.use(helmet({
  contentSecurityPolicy: false, // We'll handle this in our custom middleware
  crossOriginEmbedderPolicy: false,
  crossOriginOpenerPolicy: false,
  crossOriginResourcePolicy: false,
  dnsPrefetchControl: true,
  frameguard: { action: 'deny' },
  hidePoweredBy: true,
  hsts: process.env.NODE_ENV === 'production',
  ieNoOpen: true,
  noSniff: true,
  permittedCrossDomainPolicies: { permittedPolicies: 'none' },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  xssFilter: true
}));

// Apply security headers
app.use(securityHeaders);

// CORS configuration
// Apply CORS with the configured options
app.use(cors(corsOptions));

// Parse JSON and URL-encoded bodies
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware (more detailed in development)
app.use(morgan(process.env.NODE_ENV === 'development' ? 'dev' : 'combined'));

// Session configuration for Google OAuth
app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-session-secret-change-me',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// HTTP server and Socket.IO
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: ALLOWED_ORIGINS, credentials: true }
});

// Socket auth via JWT and join user room
io.use((socket: Socket, next: (err?: Error) => void) => {
  try {
    const authHeader = (socket.handshake.headers.authorization as string) || '';
    const tokenFromHeader = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
    const token = (socket.handshake.auth && (socket.handshake.auth as any).token) || tokenFromHeader;
    if (!token) return next(new Error('Unauthorized'));
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret-change-me') as any;
    (socket.data as any).user = decoded;
    return next();
  } catch (e) {
    return next(new Error('Unauthorized'));
  }
});

io.on('connection', (socket: Socket) => {
  const user = (socket.data as any).user;
  const userId = user?.sub;
  if (userId) {
    socket.join(String(userId));
  }
});

setIO(io);

// Routes
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ 
    status: 'ok', 
    uptime: process.uptime(),
    googleOAuth: {
      configured: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
      clientId: process.env.GOOGLE_CLIENT_ID ? 'Set' : 'Missing',
      callbackUrl: process.env.GOOGLE_CALLBACK_URL
    }
  });
});

// Registration - create a new user with hashed password
app.post('/api/auth/register', async (req: Request, res: Response) => {
  try {
    const { name, email, password, role, phone } = req.body ?? {};
    console.log('[REGISTER] Body received', {
      hasName: !!name,
      hasEmail: !!email,
      hasPhone: !!phone,
      hasPassword: typeof password === 'string' && password.length > 0,
      role
    });
    if (!name || !email || !password || !role || !phone) {
      return res.status(400).json({ message: 'name, email, phone, password and role are required' });
    }
    const normalizedEmail = String(email).trim().toLowerCase();
    const normalizedPhone = String(phone).trim();
    console.log('[REGISTER] Attempt', { email: normalizedEmail, role });
    const existing = await User.findOne({ $or: [ { email: normalizedEmail }, { phone: normalizedPhone } ] });
    if (existing) {
      const conflict = existing.email === normalizedEmail ? 'Email' : 'Phone';
      console.warn('[REGISTER] Conflict', { conflict, email: normalizedEmail, phone: normalizedPhone });
      return res.status(409).json({ message: `${conflict} already registered` });
    }
    const passwordHash = await bcrypt.hash(String(password), 10);
    console.log('[REGISTER] Hash created', { hashPresent: !!passwordHash, hashPrefix: String(passwordHash).slice(0, 7) });
    const created = await User.create({ email: normalizedEmail, phone: normalizedPhone, name: String(name), role: String(role), passwordHash });
    console.log('[REGISTER] Success', { id: String(created._id), email: created.email, role: created.role, hasPasswordHash: !!created.passwordHash });

    // Create linked Patient record for patient users
    if (String(role) === 'patient') {
      try {
        const existingPatient = await Patient.findOne({ userId: created._id });
        if (!existingPatient) {
          const patientDoc = await Patient.create({
            name: String(name),
            email: normalizedEmail,
            phone: normalizedPhone,
            userId: created._id,
            status: 'Active'
          });
          console.log('[REGISTER][PATIENT_SYNC] Created patient', { userId: String(created._id), patientId: String(patientDoc._id) });
        } else {
          console.log('[REGISTER][PATIENT_SYNC] Patient already exists for user', { userId: String(created._id) });
        }
      } catch (e) {
        console.error('[REGISTER][PATIENT_SYNC] Failed to create patient', { userId: String(created._id), error: (e as Error).message });
      }
    }

    return res.status(201).json({ id: String(created._id), email: created.email, name: created.name, role: created.role });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Registration error:', err);
    return res.status(500).json({ message: 'Registration failed' });
  }
});

// Availability checks (no auth)
app.get('/api/auth/check-email', async (req: Request, res: Response) => {
  try {
    const email = String(req.query.email || '').trim().toLowerCase();
    if (!email) return res.status(400).json({ message: 'email is required' });
    const exists = await User.exists({ email });
    return res.json({ available: !exists });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to check email' });
  }
});

app.get('/api/auth/check-phone', async (req: Request, res: Response) => {
  try {
    const phone = String(req.query.phone || '').trim();
    if (!phone) return res.status(400).json({ message: 'phone is required' });
    const exists = await User.exists({ phone });
    return res.json({ available: !exists });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to check phone' });
  }
});

// Auth - validate against MongoDB users
app.post('/api/auth/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body ?? {};
    console.log('[LOGIN] Raw body', { hasEmail: !!email, hasPassword: typeof password === 'string' && password.length > 0 });
    if (!email || !password) {
      console.warn('[LOGIN] Missing email or password');
      return res.status(400).json({ message: 'email and password are required' });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    console.log('[LOGIN] Attempt', { email: normalizedEmail });
    
    // Find user in MongoDB
    const user = await User.findOne({ email: normalizedEmail });
    console.log('[LOGIN] Lookup result', { 
      found: !!user, 
      userId: user ? String(user._id) : undefined, 
      role: user?.role, 
      hasPasswordHash: !!user?.passwordHash, 
      authProvider: (user as any)?.authProvider 
    });
    
    if (!user) {
      console.warn('[LOGIN] User not found', { email: normalizedEmail });
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    
    if (!user.passwordHash) {
      console.warn('[LOGIN] User has no password hash', { email: normalizedEmail, authProvider: (user as any)?.authProvider });
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    
    // Compare password
    const passwordMatch = await bcrypt.compare(String(password), user.passwordHash);
    console.log('[LOGIN] Password compare', { match: passwordMatch, hashPrefix: String(user.passwordHash).slice(0, 7) });
    
    if (!passwordMatch) {
      console.warn('[LOGIN] Invalid password', { email: normalizedEmail });
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = signToken({ sub: String(user._id), role: user.role as any, email: user.email });
    console.log('[LOGIN] Success', { userId: String(user._id), role: user.role });
    return res.json({ token, user: { id: String(user._id), email: user.email, name: user.name, role: user.role } });
  } catch (err) {
    console.error('[LOGIN] Error', err);
    return res.status(500).json({ message: 'Login failed' });
  }
});

app.get('/api/auth/me', authenticateJwt, (req: Request, res: Response) => {
  return res.json({ user: req.user });
});

// Auth debug endpoint to quickly verify environment and connectivity
app.get('/api/auth/debug', async (_req: Request, res: Response) => {
  try {
    const userCount = await User.countDocuments();
    res.json({
      status: 'ok',
      mongo: 'connected',
      users: userCount,
      env: {
        MONGODB_URI: !!process.env.MONGODB_URI || !!process.env.MONGO_URI ? 'Set' : 'Missing',
        ORIGIN,
        GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ? 'Set' : 'Missing',
        GOOGLE_CALLBACK_URL: process.env.GOOGLE_CALLBACK_URL || null,
        SMTP_CONFIGURED: (process.env.SMTP_HOST || process.env.EMAIL_HOST) ? 'Yes' : 'No'
      }
    });
  } catch (e) {
    res.status(500).json({ status: 'error', error: (e as Error).message });
  }
});

// Forgot Password - send reset link (generic response)
app.post('/api/auth/forgot-password', async (req: Request, res: Response) => {
  try {
    const { email } = req.body ?? {};
    const normalizedEmail = String(email || '').trim().toLowerCase();
    if (!normalizedEmail) {
      return res.status(400).json({ message: 'email is required' });
    }

    const user = await User.findOne({ email: normalizedEmail });

    // Always respond success to avoid email enumeration
    const genericResponse = { message: 'If the email exists, a reset link has been sent.' };

    if (!user) {
      return res.json(genericResponse);
    }

    // Generate token and store hash + expiry
    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const expires = new Date(Date.now() + 1000 * 60 * 15); // 15 minutes

    user.resetPasswordTokenHash = tokenHash as any;
    user.resetPasswordExpires = expires as any;
    await user.save();

    const resetUrl = `${ORIGIN}/reset-password/${token}`;
    // eslint-disable-next-line no-console
    console.log('[FORGOT PASSWORD] Email function reached', { email: normalizedEmail, resetUrl });

    await sendEmail({
      to: normalizedEmail,
      subject: 'Password Reset Instructions',
      html: `<p>You requested to reset your password.</p>
             <p>Click the link below to set a new password (valid for 15 minutes):</p>
             <p><a href="${resetUrl}">${resetUrl}</a></p>
             <p>If you did not request this, you can safely ignore this email.</p>`
    });

    return res.json(genericResponse);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[FORGOT PASSWORD] Error:', (err as Error).message);
    return res.status(200).json({ message: 'If the email exists, a reset link has been sent.' });
  }
});

// Reset Password - verify token and set new password
app.post('/api/auth/reset-password', async (req: Request, res: Response) => {
  try {
    const { token, password } = req.body ?? {};
    if (!token || !password) {
      return res.status(400).json({ message: 'token and password are required' });
    }

    const tokenHash = crypto.createHash('sha256').update(String(token)).digest('hex');
    const user = await User.findOne({
      resetPasswordTokenHash: tokenHash,
      resetPasswordExpires: { $gt: new Date() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    user.passwordHash = await bcrypt.hash(String(password), 10);
    user.resetPasswordTokenHash = undefined as any;
    user.resetPasswordExpires = undefined as any;
    await user.save();

    return res.json({ message: 'Password updated successfully' });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[RESET PASSWORD] Error:', err);
    return res.status(500).json({ message: 'Failed to reset password' });
  }
});

// Non-production helpers for email testing & verification
if (process.env.NODE_ENV !== 'production') {
  app.get('/api/auth/email/verify', async (_req: Request, res: Response) => {
    const result = await verifyTransporter();
    const cfg = getEmailConfig();
    res.json({ ...result, config: { host: cfg.host, port: cfg.port, from: cfg.from, secure: cfg.secure } });
  });

  app.post('/api/auth/email/test', async (req: Request, res: Response) => {
    try {
      const { to } = req.body ?? {};
      if (!to) return res.status(400).json({ message: 'to is required' });
      await sendEmail({ to, subject: 'Test Email from Care Connect', text: 'This is a test email. If you received this, SMTP works.' });
      res.json({ message: 'Test email sent' });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[EMAIL TEST] Error:', (err as Error).message);
      res.status(500).json({ message: 'Failed to send test email', error: (err as Error).message });
    }
  });
}

// Google OAuth Routes
app.get('/api/auth/google', (req: Request, res: Response, next: NextFunction) => {
  console.log('Google OAuth initiation requested');
  console.log('Environment check:', {
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ? 'Set' : 'Missing',
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET ? 'Set' : 'Missing',
    GOOGLE_CALLBACK_URL: process.env.GOOGLE_CALLBACK_URL
  });
  
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    console.error('Google OAuth credentials not configured');
    return res.status(500).json({ 
      message: 'Google OAuth not configured. Please check server configuration.',
      error: 'Missing Google OAuth credentials'
    });
  }
  
  try {
    passport.authenticate('google', {
      scope: ['profile', 'email']
    })(req, res, next);
  } catch (error) {
    console.error('Google OAuth initiation error:', error);
    return res.status(500).json({ 
      message: 'Failed to initiate Google OAuth',
      error: (error as Error).message
    });
  }
});

app.get('/api/auth/google/callback', 
  (req: Request, res: Response, next: NextFunction) => {
    console.log('Google OAuth callback received');
    passport.authenticate('google', { 
      failureRedirect: `${ORIGIN}/login?error=google_auth_failed`,
      session: false // We don't need sessions for JWT-based auth
    })(req, res, next);
  },
  async (req: Request, res: Response) => {
    try {
      console.log('Google OAuth callback processing');
      const user = req.user as any;
      
      if (!user) {
        console.error('No user found in OAuth callback');
        return res.redirect(`${ORIGIN}/login?error=no_user_found`);
      }

      console.log('User authenticated:', {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role
      });

      // Generate JWT token for the user
      const token = signToken({ 
        sub: String(user._id), 
        role: user.role, 
        email: user.email 
      });

      // Redirect to frontend with token
      const redirectUrl = `${ORIGIN}/auth/google/callback?token=${token}&user=${encodeURIComponent(JSON.stringify({
        id: String(user._id),
        email: user.email,
        name: user.name,
        role: user.role,
        profilePicture: user.profilePicture
      }))}`;
      
      console.log('Redirecting to:', redirectUrl);
      res.redirect(redirectUrl);
    } catch (error) {
      console.error('Google OAuth callback error:', error);
      res.redirect(`${ORIGIN}/login?error=callback_error&details=${encodeURIComponent((error as Error).message || 'Unknown error')}`);
    }
  }
);

app.use('/api/patients', patientsRouter);
app.use('/api/patient-care', patientCareRouter);  
app.use('/api/appointments', appointmentsRouter);
app.use('/api/messages', messagesRouter);
app.use('/api/alerts', alertsRouter);
app.use('/api/medical-records', medicalRecordsRouter);
app.use('/api/prescriptions', prescriptionsRouter);
app.use('/api/rounds', roundsRouter);
app.use('/api/users', usersRouter);
app.use('/api/volunteer', volunteerRouter);
app.use('/api/nurse', nurseRouter);
app.use('/api/patient-status', patientStatusRouter);
app.use('/api/care-updates', careUpdatesRouter);
app.use('/api/medications', medicationsRouter);
app.use('/api/admin', adminRouter);
app.use('/api/uploads', uploadsRouter);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Error handler
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  res.status(500).json({ message: err.message || 'Internal Server Error' });
});

connectMongo(MONGODB_URI).then(() => {
  console.log('MongoDB connected', { uri: MONGODB_URI.split('@').pop() });
  const maxAttempts = 5;
  let started = false;
  const start = (p: number, attempt: number) => {
    if (started) return;
    const onListening = () => {
      if (started) return;
      started = true;
      console.log(`API listening on http://localhost:${p}`);
    };
    const onError = (e: any) => {
      if (started) return;
      if (e?.code === 'EADDRINUSE' && attempt < maxAttempts) {
        const next = p + 1;
        start(next, attempt + 1);
      } else {
        throw e;
      }
    };
    server.once('listening', onListening);
    server.once('error', onError);
    try {
      server.listen(p);
    } catch (e: any) {
      onError(e);
    }
  };
  start(PORT, 1);
}).catch((err) => {
  // eslint-disable-next-line no-console
  console.error('MongoDB connection error', err);
  process.exit(1);
});


