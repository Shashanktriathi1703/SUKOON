const express = require('express');
const router = express.Router();
const { analyzeMood } = require('../utils/moodAnalyzer');
const User = require('../models/User');
const Recommendation = require('../models/Recommendation');
const nodemailer = require('nodemailer');

/**
 * POST /api/chat
 * Main chat endpoint
 */
router.post('/chat', async (req, res) => {
  try {
    const { userId, message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message cannot be empty' });
    }

    // 1️⃣ Detect mood
    const detectedMood = analyzeMood(message);

    // 2️⃣ Fetch recommendations
    const recommendations = await Recommendation.find({
      moodTags: { $in: [detectedMood.toLowerCase()] }
    }).limit(5);

    const recTexts = recommendations.length
      ? recommendations.map(r => `• ${r.content} (${r.type}, ${r.duration})`).join('\n')
      : 'No recommendations available.';

    // 3️⃣ Mood-based responses
    const moodResponses = {
      Motivated: [
        `Great to hear! Keep the momentum going.\n\n${recTexts}`,
        `You're feeling motivated! Here are some ideas:\n\n${recTexts}`
      ],
      Stressed: [
        `I hear you. Stress is tough.\n\n${recTexts}`,
        `Take a breath. These may help:\n\n${recTexts}`
      ],
      Anxious: [
        `You're not alone. Let's calm things down.\n\n${recTexts}`
      ],
      'Burnt Out': [
        `Burnout is serious. Please rest.\n\n${recTexts}`
      ],
      Neutral: [
        `Thanks for checking in.\n\n${recTexts}`
      ]
    };

    const responses = moodResponses[detectedMood] || moodResponses.Neutral;
    let aiResponse = responses[Math.floor(Math.random() * responses.length)];

    // Meditation override
    if (/meditat/i.test(message)) {
      aiResponse = `Here are some meditation techniques:

• Mindful Breathing
• Body Scan
• Loving-Kindness Meditation

${recTexts}`;
    }

    // Save mood history
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

    res.json({
      mood: detectedMood,
      response: aiResponse,
      suggestedActions: recommendations,
      timestamp: new Date()
    });

  } catch (err) {
    console.error('Chat error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/send-report
 * Send wellness report
 */
router.post('/send-report', async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID required' });
    }

    const user = await User.findById(userId).select('-password');
    if (!user || !user.moodHistory.length) {
      return res.status(404).json({ error: 'No mood history found' });
    }

    // Stats
    const moodCounts = {};
    user.moodHistory.forEach(m => {
      moodCounts[m.mood] = (moodCounts[m.mood] || 0) + 1;
    });

    const totalEntries = user.moodHistory.length;
    const mostCommonMood = Object.keys(moodCounts).reduce((a, b) =>
      moodCounts[a] > moodCounts[b] ? a : b
    );

    // ⚠️ FIXED DATE ISSUE
    const formattedDate = new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      return res.json({
        success: true,
        emailSent: false,
        stats: { totalEntries, mostCommonMood, moodCounts }
      });
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    const mailOptions = {
      from: `"SukoonAI 📊" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: 'Your Wellness Report',
      html: `
        <h2>Hello ${user.username}</h2>
        <p>Generated on ${formattedDate}</p>
        <p>Total check-ins: <b>${totalEntries}</b></p>
        <p>Most common mood: <b>${mostCommonMood}</b></p>

        <h3>Mood Breakdown</h3>
        <ul>
          ${Object.entries(moodCounts)
            .map(([mood, count]) => `<li>${mood}: ${count}</li>`)
            .join('')}
        </ul>

        <p>Stay consistent. Your wellbeing matters 🌿</p>
      `
    };

    await transporter.sendMail(mailOptions);

    res.json({
      success: true,
      emailSent: true,
      stats: { totalEntries, mostCommonMood, moodCounts }
    });

  } catch (err) {
    console.error('Send report error:', err);
    res.status(500).json({ error: 'Failed to send report' });
  }
});

/**
 * GET /api/recommendations
 */
router.get('/recommendations', async (req, res) => {
  try {
    const recommendations = await Recommendation.find({});
    res.json(recommendations);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch recommendations' });
  }
});

/**
 * GET /api/mood-history/:userId
 */
router.get('/mood-history/:userId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select('moodHistory');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user.moodHistory);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch mood history' });
  }
});

module.exports = router;
