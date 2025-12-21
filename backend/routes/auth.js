const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { sendWelcomeEmail } = require('../config/nodemailer');

const JWT_SECRET = process.env.JWT_SECRET;

/**
 * POST /api/auth/signup
 * Create new user account and send welcome email
 */
router.post('/signup', async (req, res) => {
  const { username, email, password } = req.body;
  
  try {
    // Validation
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }
    
    // Check if user exists
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ 
        error: existingUser.email === email ? 'Email already registered' : 'Username taken' 
      });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create user
    const user = await User.create({ 
      username, 
      email,
      password: hashedPassword, 
      moodHistory: [] 
    });
    
    // Send welcome email asynchronously
    sendWelcomeEmail(email, username).catch(err => 
      console.error('Welcome email failed:', err)
    );
    
    res.status(201).json({ 
      message: 'Account created successfully! Check your email for welcome message.',
      userId: user._id 
    });
    
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ error: 'Server error during signup' });
  }
});

/**
 * POST /api/auth/login
 * Authenticate user and set JWT cookie
 */
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  
  try {
    // Validation
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }
    
    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    // Create JWT token
    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '7d' });
    
    // Set HTTP-only cookie
    res.cookie('token', token, { 
      httpOnly: true, 
      secure: false, // Set to true in production with HTTPS
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });
    
    res.json({ 
      message: 'Login successful',
      userId: user._id,
      username: user.username,
      email: user.email
    });
    
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error during login' });
  }
});

/**
 * GET /api/auth/me
 * Get current authenticated user
 */
router.get('/me', async (req, res) => {
  const token = req.cookies.token;
  
  if (!token) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.userId)
      .select('-password')
      .populate('consultations');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(user);
    
  } catch (err) {
    console.error('Auth verification error:', err);
    res.status(401).json({ error: 'Invalid or expired token' });
  }
});

/**
 * POST /api/auth/logout
 * Clear authentication cookie
 */
router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Logged out successfully' });
});

module.exports = router;