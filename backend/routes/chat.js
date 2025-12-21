// backend/routes/chat.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { OpenAI } = require('openai');
const analyzeMood = require('../utils/moodAnalyzer');
const User = require('../models/User');
const Recommendation = require('../models/Recommendation');
const { sendSessionSummary } = require('../utils/mailer');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// This route is now PROTECTED
router.post('/chat', protect, async (req, res) => {
  try {
    const { message } = req.body;
    const userId = req.user.userId; // from middleware

    const mood = analyzeMood(message);
    const recs = await Recommendation.find({ moodTags: { $in: [mood.toLowerCase()] } }).limit(5);
    const recTexts = recs.map(r => `• ${r.content}`).join('\n');

    const systemPrompt = `
You are MoodAI, a gentle wellness companion.
Detected mood: ${mood}
Never diagnose. Be supportive and warm.
Suggestions: ${recTexts || 'None'}
If highly stressed, offer human consultant.
Keep response short and kind.
    `.trim();

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.7,
      max_tokens: 300,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message }
      ],
    });

    const aiResponse = completion.choices[0].message.content.trim();

    // Save mood to user's history
    await User.findByIdAndUpdate(userId, { $push: { moodHistory: { mood } } });
    sendSessionSummary("user@example.com", "User", mood, aiResponse);
    res.json({
      mood,
      response: aiResponse,
      suggestedActions: recs.map(r => ({ type: r.type, content: r.content }))
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Something went wrong" });
  }
});

module.exports = router;