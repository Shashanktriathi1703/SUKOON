const express = require('express');
const router = express.Router();
const { analyzeMood } = require('../utils/moodAnalyzer');
const User = require('../models/User');
const Recommendation = require('../models/Recommendation');

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
    
    // Step 3: Generate AI Response (MOCK VERSION - NO API KEY NEEDED)
    const moodResponses = {
      'Motivated': [
        "That's wonderful to hear! Your positive energy is inspiring. Would you like some suggestions to maintain this momentum?",
        "I'm so glad you're feeling motivated! This is a great time to set new goals or tackle challenging tasks.",
        "Your motivation is fantastic! Keep channeling this energy into things that matter to you."
      ],
      'Neutral': [
        "Thank you for checking in. I'm here whenever you need support. How can I help you today?",
        "I appreciate you sharing how you're feeling. Is there anything specific you'd like to talk about?",
        "I'm here to listen. Sometimes neutral moments are opportunities for reflection. What's on your mind?"
      ],
      'Stressed': [
        "I hear that you're feeling stressed. That's completely valid, and you're not alone. Would you like to try a quick breathing exercise?",
        "Stress can be overwhelming. Remember, it's okay to take breaks. Would some relaxation techniques help?",
        "I understand you're under pressure. Let's explore some ways to help you manage this stress."
      ],
      'Burnt Out': [
        "I'm sorry you're experiencing burnout. This is serious, and your wellbeing matters. Would you like me to connect you with a human wellness consultant for 1-on-1 support?",
        "Burnout is exhausting. Please know it's okay to rest and seek help. Have you considered taking a break or talking to someone?",
        "What you're feeling is valid. Burnout requires care and support. Would professional guidance be helpful?"
      ],
      'Anxious': [
        "I understand anxiety can feel overwhelming. You're safe here, and we can work through this together. Would grounding exercises help?",
        "Anxiety is tough, but you're taking a positive step by reaching out. Let's explore some calming strategies together.",
        "I hear your concerns. Anxiety can be managed with the right support. Would you like some immediate relief techniques?"
      ]
    };

    // Get a random response for the detected mood
    const responses = moodResponses[detectedMood];
    const aiResponse = responses[Math.floor(Math.random() * responses.length)];

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