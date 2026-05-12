const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv').config();
const connectDB = require('./config/db');
const rateLimit = require('express-rate-limit');
const errorHandler = require('./middleware/errorHandler');

// Validate required environment variables
const requiredEnvVars = ['MONGO_URI', 'JWT_SECRET'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);
if (missingEnvVars.length > 0) {
  console.error(`❌ Missing required environment variables: ${missingEnvVars.join(', ')}`);
  console.error('Please check your .env file');
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting to all routes
app.use(limiter);

// Stricter rate limit for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10, // 10 requests per 15 minutes
  message: 'Too many login/registration attempts, please try again later.',
});

// Middlewares
app.use(cors({
  origin: ['https://placementsflow.vercel.app', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'x-auth-token'],
}));
app.use(express.json());

// Routes
app.use('/api/auth', authLimiter, require('./routes/auth'));
app.use('/api/posts', require('./routes/posts'));
app.use('/api/users', require('./routes/users'));
app.use('/api/stats', require('./routes/stats'));
app.use('/api/ai', require('./routes/ai'));

// Health Check Route
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Global error handler — must be registered AFTER all routes
app.use(errorHandler);

// Self-ping to keep alive (Render free tier)
const keepAliveInterval = 14 * 60 * 1000; // 14 minutes
setInterval(() => {
  const http = require('http');
  http.get(`http://localhost:${PORT}/health`, (res) => {
    console.log(`Health check triggered: Status ${res.statusCode}`);
  }).on('error', (err) => {
    console.error('Health check failed:', err.message);
  });
}, keepAliveInterval);

// Catch unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

// Catch uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  process.exit(1);
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});