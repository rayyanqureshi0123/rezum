import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
dotenv.config();

import authRoutes from './routes/authRoutes.js';
import resumeRoutes from './routes/resumeRoutes.js';
import userRoutes from './routes/userRoutes.js';

const app = express();

// ─── SECURITY: Helmet sets 11 HTTP security headers in one line ───
// Protects against XSS, Clickjacking, MIME-sniffing, and more
app.use(helmet());

// ─── SECURITY: Tightened CORS ───
// Only allows requests from your frontend, blocks everything else
const allowedOrigins = [
  'http://localhost:5173',
  process.env.CLIENT_URL,
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, server-to-server)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'DELETE', 'PUT'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ─── SECURITY: Body size limit to prevent payload attacks ───
app.use(express.json({ limit: '1mb' }));

// ─── RATE LIMITING: General API limiter ───
// 100 requests per 15 minutes per IP
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests, please try again later.' },
});

// ─── RATE LIMITING: Strict limiter for auth routes ───
// Prevents brute-force login attempts: 15 attempts per 15 min
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many login attempts. Please wait 15 minutes.' },
});

// ─── RATE LIMITING: AI analysis limiter ───
// AI calls are expensive — 10 analyses per 15 minutes per IP
const analysisLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Analysis limit reached. Please wait before trying again.' },
});

// Apply general limiter to all routes
app.use('/api', generalLimiter);

// Health check
app.get('/', (req, res) => {
  res.send('Rezum AI Resume Analyzer API is running...');
});

// ─── DATABASE ───
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.error('MongoDB Connection Error:', err));

// ─── ROUTES with specific rate limiters ───
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/resume/analyze', analysisLimiter);
app.use('/api/resume', resumeRoutes);
app.use('/api/users', userRoutes);

// ─── GLOBAL ERROR HANDLER ───
// Catches unhandled errors so the server never crashes silently
app.use((err, req, res, next) => {
  console.error('UNHANDLED ERROR:', err.stack || err.message);
  res.status(err.status || 500).json({
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
