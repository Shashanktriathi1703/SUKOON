const express = require('express');
const router = express.Router();
const Razorpay = require('razorpay');
const crypto = require('crypto');
const Consultation = require('../models/Consultation');
const User = require('../models/User');
const { sendConsultationEmail } = require('../config/nodemailer');

// Initialize Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

/**
 * POST /api/payment/create-order
 * Create Razorpay order for consultation booking
 */
router.post('/create-order', async (req, res) => {
  try {
    const { amount, currency } = req.body;
    
    const options = {
      amount: amount * 100, // Convert to paise (INR)
      currency: currency || 'INR',
      receipt: `receipt_${Date.now()}`,
      notes: {
        description: 'MoodAI 1-on-1 Wellness Consultation'
      }
    };
    
    const order = await razorpay.orders.create(options);
    
    res.json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      key: process.env.RAZORPAY_KEY_ID
    });
    
  } catch (error) {
    console.error('Razorpay order creation error:', error);
    res.status(500).json({ 
      error: 'Failed to create payment order',
      details: error.message 
    });
  }
});

/**
 * POST /api/payment/verify
 * Verify Razorpay payment signature and save consultation
 */
router.post('/verify', async (req, res) => {
  try {
    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature,
      userId,
      username,
      email,
      amount
    } = req.body;
    
    // Verify signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');
    
    const isAuthentic = expectedSignature === razorpay_signature;
    
    if (!isAuthentic) {
      return res.status(400).json({ 
        error: 'Payment verification failed',
        success: false 
      });
    }
    
    // Create consultation record
    const consultation = await Consultation.create({
      userId,
      username,
      email,
      amount: amount / 100, // Convert from paise
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id,
      status: 'confirmed',
      createdAt: new Date()
    });
    
    // Update user's consultation list
    await User.findByIdAndUpdate(userId, {
      $push: { consultations: consultation._id }
    });
    
    // Send confirmation email
    sendConsultationEmail(email, username, {
      bookingId: consultation._id,
      paymentId: razorpay_payment_id,
      amount: amount / 100,
      date: new Date()
    }).catch(err => console.error('Email error:', err));
    
    res.json({
      success: true,
      message: 'Payment verified and consultation booked',
      consultationId: consultation._id,
      bookingDetails: {
        id: consultation._id,
        paymentId: razorpay_payment_id,
        amount: amount / 100,
        status: 'confirmed'
      }
    });
    
  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({ 
      error: 'Payment verification failed',
      details: error.message,
      success: false
    });
  }
});

/**
 * GET /api/payment/consultations/:userId
 * Get user's consultation booking history
 */
router.get('/consultations/:userId', async (req, res) => {
  try {
    const consultations = await Consultation.find({ 
      userId: req.params.userId 
    }).sort({ createdAt: -1 });
    
    res.json(consultations);
    
  } catch (error) {
    console.error('Consultations fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch consultations' });
  }
});

module.exports = router;