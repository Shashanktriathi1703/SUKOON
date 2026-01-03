const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');
const apiRoutes = require('./routes/api');
const authRoutes = require('./routes/auth');
const paymentRoutes = require('./routes/payment');
require('dotenv').config({ quiet: true });

// Connect to MongoDB
connectDB();

const app = express();

// 🔥 CRITICAL: Add your Vercel URL here!
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "https://sukoon-omega.vercel.app", // ✅ Your Vercel frontend
];

// 🔥 CORS Configuration - MUST come before routes
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, curl)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      console.log('✅ CORS allowed for:', origin);
      callback(null, true);
    } else {
      console.log('❌ CORS blocked origin:', origin);
      callback(new Error(`CORS blocked: ${origin}`));
    }
  },
  credentials: true, // ✅ Allow cookies
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
  exposedHeaders: ['Set-Cookie'],
  optionsSuccessStatus: 200
}));

// ✅ Middleware
app.use(express.json());
app.use(cookieParser());

// ✅ Add request logger
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path} from ${req.get('origin') || 'no-origin'}`);
  next();
});

// ✅ Routes
app.use('/api/auth', authRoutes);
app.use('/api', apiRoutes);
app.use('/api/payment', paymentRoutes);

// ✅ Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'MoodAI Backend Running',
    timestamp: new Date(),
    env: process.env.NODE_ENV || 'development',
    allowedOrigins: allowedOrigins
  });
});

// ✅ Root route
app.get('/', (req, res) => {
  res.json({ 
    message: 'MoodAI API Server',
    endpoints: {
      health: '/health',
      auth: '/api/auth/*',
      chat: '/api/chat',
      payment: '/api/payment/*'
    }
  });
});

// ✅ 404 handler
app.use((req, res) => {
  console.log('❌ 404:', req.method, req.path);
  res.status(404).json({ 
    error: 'Route not found',
    path: req.path,
    method: req.method,
    availableRoutes: ['/health', '/api/auth/*', '/api/chat', '/api/payment/*']
  });
});

// ✅ Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Server error:', err.message);
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!', 
    message: err.message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log('=================================================');
  console.log(`🌿 MoodAI Backend RUNNING on port ${PORT}`);
  console.log(`📊 Health check: https://sukoon-vzwh.onrender.com/health`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`✅ Allowed origins:`, allowedOrigins);
  console.log('=================================================');
});