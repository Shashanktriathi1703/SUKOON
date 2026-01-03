const express = require('express');
const router = express.Router();
const { analyzeMood } = require('../utils/moodAnalyzer');
const User = require('../models/User');
const Recommendation = require('../models/Recommendation');
const nodemailer = require('nodemailer');

/**
 * POST /api/chat
 * Main chat endpoint with mood detection and RAG
 */
router.post('/chat', async (req, res) => {
  try {
    const { userId, message } = req.body;
    
    if (!message || message.trim().length === 0) {
      return res.status(400).json({ error: 'Message cannot be empty' });
    }
    
    // Step 1: Detect mood using NLP
    const detectedMood = analyzeMood(message);
    
    // Step 2: RAG - Retrieve relevant recommendations from MongoDB
    const recommendations = await Recommendation.find({ 
      moodTags: { $in: [detectedMood.toLowerCase()] } 
    }).limit(5);
    
    // Format recommendations for AI prompt
    const recTexts = recommendations.length > 0
      ? recommendations.map(r => `• ${r.content} (${r.type}, ${r.duration})`).join('\n')
      : 'No specific recommendations available right now.';
    
    // Step 3: Generate contextual response based on mood and message
    const moodResponses = {
      'Motivated': [
        `That's wonderful to hear! Your positive energy is inspiring. ${recommendations.length > 0 ? 'I have some great suggestions to maintain this momentum:\n\n' + recTexts + '\n\nWould any of these interest you?' : 'Keep channeling this energy into things that matter to you!'}`,
        `I'm so glad you're feeling motivated! This is a perfect time to set new goals. ${recommendations.length > 0 ? 'Here are some ways to keep the momentum going:\n\n' + recTexts : 'What would you like to accomplish today?'}`,
        `Your motivation is fantastic! ${recommendations.length > 0 ? 'I found some activities that might enhance your positive mood:\n\n' + recTexts : 'How can I help you make the most of this energy?'}`
      ],
      Neutral: [
        `Thank you for checking in. I'm here to support you. ${
          recommendations.length > 0
            ? 'Here are some activities that might interest you:\n\n' + recTexts
            : 'How can I help you today?'
        }`,
        `I appreciate you sharing how you're feeling. ${
          recommendations.length > 0
            ? 'Would any of these activities be helpful?\n\n' + recTexts
            : 'Is there anything specific you'd like to talk about?'
        }`,
        `I am here to listen. ${
          recommendations.length > 0
            ? 'I have some suggestions that might be enjoyable:\n\n' + recTexts
            : 'What is on your mind?'
        }`
      ],
      'Stressed': [
        `I hear that you're feeling stressed. That's completely valid, and you're not alone. ${recommendations.length > 0 ? 'Here are some immediate relief strategies:\n\n' + recTexts + '\n\nWould you like to try any of these?' : 'Would you like to talk about what\'s causing the stress?'}`,
        `Stress can be overwhelming. Remember, it's okay to take breaks. ${recommendations.length > 0 ? 'These techniques might help you feel better:\n\n' + recTexts : 'What would help you most right now?'}`,
        `I understand you're under pressure. ${recommendations.length > 0 ? 'Let me share some proven stress-relief methods:\n\n' + recTexts + '\n\nWhich one sounds most helpful?' : 'Would you like some relaxation guidance?'}`
      ],
      'Burnt Out': [
        `I'm sorry you're experiencing burnout. This is serious, and your wellbeing matters deeply. ${recommendations.length > 0 ? 'Here are some gentle activities that might help:\n\n' + recTexts + '\n\n' : ''}Would you like me to connect you with a human wellness consultant for 1-on-1 support?`,
        `Burnout is exhausting, and I want you to know it's okay to rest. ${recommendations.length > 0 ? 'These might offer some relief:\n\n' + recTexts + '\n\n' : ''}Have you considered taking a break or talking to a professional?`,
        `What you're feeling is valid. Burnout requires care and support. ${recommendations.length > 0 ? 'Here are some restorative options:\n\n' + recTexts + '\n\n' : ''}Would professional guidance be helpful?`
      ],
      'Anxious': [
        `I understand anxiety can feel overwhelming. You're safe here, and we can work through this together. ${recommendations.length > 0 ? 'These grounding techniques might help:\n\n' + recTexts + '\n\nShall we try one together?' : 'Would you like to try a breathing exercise?'}`,
        `Anxiety is tough, but you're taking a positive step by reaching out. ${recommendations.length > 0 ? 'Here are some calming strategies:\n\n' + recTexts : 'Let\'s explore some ways to ease these feelings.'}`,
        `I hear your concerns. ${recommendations.length > 0 ? 'These practices have helped many people with anxiety:\n\n' + recTexts + '\n\nWhich one resonates with you?' : 'Would immediate relief techniques be helpful?'}`
      ]
    };

    // Get a contextual response for the detected mood
    const responses = moodResponses[detectedMood] || moodResponses['Neutral'];
    let aiResponse = responses[Math.floor(Math.random() * responses.length)];

    // Add specific responses for meditation requests
    if (/meditat/i.test(message)) {
      aiResponse = `Here are some meditation techniques that can help you relax:\n\n• **Mindful Breathing**: Focus on your breath for 5-10 minutes. Inhale for 4 counts, hold for 4, exhale for 6.\n\n• **Body Scan**: Lie down and mentally scan your body from toes to head, releasing tension.\n\n• **Guided Visualization**: Imagine a peaceful place - a beach, forest, or garden. Engage all your senses.\n\n• **Loving-Kindness Meditation**: Repeat phrases like "May I be happy, may I be healthy" to yourself and others.\n\n${recommendations.length > 0 ? '\nI also found these resources:\n\n' + recTexts : ''}\n\nWould you like me to guide you through any of these?`;
    }

    // Add specific responses for stress relief
    if (/stress|anxiety|worried|nervous/i.test(message) && !/meditat/i.test(message)) {
      aiResponse = `I understand you're feeling stressed. Here are some quick relief techniques:\n\n• **4-7-8 Breathing**: Breathe in for 4 seconds, hold for 7, exhale for 8. Repeat 3-4 times.\n\n• **Progressive Muscle Relaxation**: Tense and release each muscle group, starting from your toes.\n\n• **Take a Short Walk**: Even 5 minutes of movement can help reset your nervous system.\n\n${recommendations.length > 0 ? '\nI also have these personalized suggestions:\n\n' + recTexts : ''}\n\nWhich would you like to try first?`;
    }

    // Step 4: Save mood to user history (if userId provided)
    if (userId) {
      await User.findByIdAndUpdate(userId, { 
        $push: { 
          moodHistory: { 
            mood: detectedMood,
            message: message.substring(0, 100),
            date: new Date()
          } 
        } 
      });
    }

    // Step 5: Return response with structured data
    res.json({
      mood: detectedMood,
      response: aiResponse,
      suggestedActions: recommendations.map(r => ({
        type: r.type,
        content: r.content,
        duration: r.duration,
        link: r.link || null
      })),
      timestamp: new Date()
    });
    
  } catch (error) {
    console.error('Chat API error:', error);
    res.status(500).json({ 
      error: 'Unable to process your message right now',
      details: error.message 
    });
  }
});

/**
 * POST /api/send-report
 * Send mood report to user's email
 * ✅ FIXED VERSION with better error handling
 */
router.post('/send-report', async (req, res) => {
  try {
    const { userId } = req.body;
    
    console.log('📧 Send report requested for userId:', userId);
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    
    const user = await User.findById(userId).select('-password');
    if (!user) {
      console.log('❌ User not found:', userId);
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.moodHistory || user.moodHistory.length === 0) {
      console.log('❌ No mood data for user:', user.email);
      return res.status(400).json({ error: 'No mood data available to generate report' });
    }

    // Calculate mood statistics
    const moodCounts = user.moodHistory.reduce((acc, entry) => {
      acc[entry.mood] = (acc[entry.mood] || 0) + 1;
      return acc;
    }, {});

    const totalEntries = user.moodHistory.length;
    const mostCommonMood = Object.keys(moodCounts).reduce((a, b) => 
      moodCounts[a] > moodCounts[b] ? a : b, 'Neutral'
    );

    // Get last 7 days of data
    const last7Days = user.moodHistory.filter(entry => 
      new Date(entry.date) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    );

    // ✅ CHECK if email is configured
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.log('⚠️ Email not configured, sending report data without email');
      return res.json({
        success: true,
        message: 'Report generated! (Email service not configured)',
        emailSent: false,
        stats: {
          totalEntries,
          mostCommonMood,
          last7DaysCount: last7Days.length,
          moodBreakdown: moodCounts
        }
      });
    }

    // Send email
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const wellnessTip = mostCommonMood === 'Stressed' || mostCommonMood === 'Burnt Out' 
      ? 'We notice you\'ve been experiencing stress. Consider booking a 1-on-1 consultation with our wellness experts, or try the 4-7-8 breathing technique daily.'
      : mostCommonMood === 'Anxious'
      ? 'Anxiety can be managed with regular practice. Try daily meditation for just 5 minutes, and consider speaking with a professional if feelings persist.'
      : mostCommonMood === 'Motivated'
      ? 'You\'re doing great! Keep up the positive momentum. Consider setting new wellness goals to maintain this energy.'
      : 'Consistency is key in wellness. Try to check in with your emotions daily and practice self-care regularly.';

    const mailOptions = {
      from: `"MoodAI Reports 📊" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: `Your Weekly Wellness Report - ${new Date().toLocaleDateString()}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f0f9ff; margin: 0; padding: 40px; }
            .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px; text-align: center; }
            .header h1 { color: white; margin: 0; font-size: 32px; }
            .content { padding: 40px; }
            .stat-card { background: linear-gradient(135deg, #f0fdfa 0%, #ccfbf1 100%); padding: 20px; border-radius: 16px; margin: 16px 0; border-left: 4px solid #10b981; }
            .stat-card h3 { margin: 0 0 8px 0; color: #047857; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; }
            .stat-card p { margin: 0; color: #065f46; font-size: 28px; font-weight: bold; }
            .mood-list { margin: 20px 0; }
            .mood-item { display: flex; justify-content: space-between; align-items: center; padding: 12px; background: #f9fafb; border-radius: 8px; margin: 8px 0; }
            .footer { text-align: center; padding: 24px; background: #f9fafb; color: #6b7280; }
            .tip-box { background: #fffbeb; border: 2px solid #fbbf24; border-radius: 16px; padding: 20px; margin-top: 32px; }
            .cta-button { display: inline-block; background: #10b981; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-top: 16px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📊 Your Wellness Report</h1>
              <p style="color: #d1fae5; margin: 8px 0 0 0;">Generated on ${new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}</p>
            </div>
            <div class="content">
              <h2 style="color: #1f2937;">Hello ${user.username}! 👋</h2>
              <p style="color: #6b7280; line-height: 1.6;">Here's your personalized wellness summary based on your recent mood check-ins.</p>

              <div class="stat-card">
                <h3>Total Check-ins</h3>
                <p>${totalEntries}</p>
              </div>

              <div class="stat-card">
                <h3>Most Common Mood</h3>
                <p>${mostCommonMood}</p>
              </div>

              <div class="stat-card">
                <h3>Last 7 Days Activity</h3>
                <p>${last7Days.length} check-ins</p>
              </div>

              <h3 style="color: #1f2937; margin-top: 32px;">📈 Mood Breakdown</h3>
              <div class="mood-list">
                ${Object.entries(moodCounts).map(([mood, count]) => `
                  <div class="mood-item">
                    <span style="font-weight: 600; color: #374151;">${mood}</span>
                    <span style="color: #10b981; font-weight: bold;">${count} times (${Math.round(count/totalEntries*100)}%)</span>
                  </div>
                `).join('')}
              </div>

              <h3 style="color: #1f2937; margin-top: 32px;">🕐 Recent Activity</h3>
              <div class="mood-list">
                ${user.moodHistory.slice(-5).reverse().map(entry => `
                  <div class="mood-item" style="flex-direction: column; align-items: flex-start;">
                    <div style="display: flex; justify-content: space-between; width: 100%; margin-bottom: 8px;">
                      <strong style="color: #047857;">${entry.mood}</strong>
                      <span style="color: #9ca3af; font-size: 12px;">${new Date(entry.date).toLocaleDateString()}</span>
                    </div>
                    <p style="margin: 0; color: #6b7280; font-size: 14px;">${entry.message ? entry.message.substring(0, 80) + '...' : 'No message'}</p>
                  </div>
                `).join('')}
              </div>

              <div class="tip-box">
                <h3 style="color: #92400e; margin-top: 0;">💡 Your Personalized Wellness Tip</h3>
                <p style="color: #78350f; margin: 0; line-height: 1.6;">
                  ${wellnessTip}
                </p>
                <a href="https://sukoon-omega.vercel.app" class="cta-button">Open MoodAI Dashboard</a>
              </div>

              <div style="margin-top: 32px; padding: 20px; background: #f0f9ff; border-radius: 12px;">
                <h4 style="margin: 0 0 12px 0; color: #1e40af;">📅 Need More Support?</h4>
                <p style="margin: 0; color: #1e3a8a; font-size: 14px;">
                  Book a 1-on-1 consultation with our certified wellness experts. 60-minute personalized sessions available.
                </p>
              </div>
            </div>
            <div class="footer">
              <p style="margin: 0;">SukoonAI - Your Partner in Wellness 🌿</p>
              <p style="margin: 8px 0 0 0; font-size: 12px;">Keep checking in daily for the best insights!</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log(`✉️ Report email sent to ${user.email}`);

      res.json({
        success: true,
        message: 'Report sent successfully to your email!',
        emailSent: true,
        stats: {
          totalEntries,
          mostCommonMood,
          last7DaysCount: last7Days.length,
          moodBreakdown: moodCounts
        }
      });
    } catch (emailError) {
      console.error('❌ Email send failed:', emailError.message);
      
      // Still return success with stats, but note email failed
      res.json({
        success: true,
        message: 'Report generated! (Email delivery failed - check email configuration)',
        emailSent: false,
        emailError: emailError.message,
        stats: {
          totalEntries,
          mostCommonMood,
          last7DaysCount: last7Days.length,
          moodBreakdown: moodCounts
        }
      });
    }
    
  } catch (error) {
    console.error('❌ Send report error:', error);
    res.status(500).json({ 
      error: 'Failed to generate report',
      details: error.message 
    });
  }
});

/**
 * GET /api/recommendations
 * Get all wellness recommendations
 */
router.get('/recommendations', async (req, res) => {
  try {
    const { mood, type } = req.query;
    
    let query = {};
    if (mood) query.moodTags = mood.toLowerCase();
    if (type) query.type = type;
    
    const recommendations = await Recommendation.find(query);
    res.json(recommendations);
    
  } catch (error) {
    console.error('Recommendations fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch recommendations' });
  }
});

/**
 * GET /api/mood-history/:userId
 * Get user's mood history
 */
router.get('/mood-history/:userId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select('moodHistory');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(user.moodHistory);
    
  } catch (error) {
    console.error('Mood history fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch mood history' });
  }
});

module.exports = router;