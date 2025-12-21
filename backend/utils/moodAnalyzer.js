const Sentiment = require('sentiment');
const sentiment = new Sentiment();

/**
 * NLP-based Mood Detection System
 * 
 * Uses sentiment analysis combined with keyword pattern matching
 * to detect emotional states from user text.
 * 
 * @param {string} text - User's message
 * @returns {string} - Detected mood: Motivated, Neutral, Stressed, Burnt Out, or Anxious
 */
const analyzeMood = (text) => {
  // Base sentiment analysis
  const result = sentiment.analyze(text);
  
  // Keyword patterns for specific moods
  const burnoutKeywords = /burnout|burnt out|exhausted|drained|can't take it|giving up|no energy|overwhelmed|breaking down/i;
  const anxiousKeywords = /anxious|anxiety|worried|nervous|panic|scared|fear|restless|uneasy|tense/i;
  const stressedKeywords = /stressed|stress|pressure|deadline|too much|overworked|frustrated|struggling|difficult/i;
  const motivatedKeywords = /motivated|excited|great|awesome|happy|energized|productive|accomplished|proud|confident/i;
  
  // Default to Neutral
  let detectedMood = 'Neutral';
  
  // Check for specific emotional patterns (priority order)
  if (burnoutKeywords.test(text)) {
    detectedMood = 'Burnt Out';
  } else if (anxiousKeywords.test(text)) {
    detectedMood = 'Anxious';
  } else if (stressedKeywords.test(text)) {
    detectedMood = 'Stressed';
  } else if (motivatedKeywords.test(text) || result.score > 2) {
    detectedMood = 'Motivated';
  } else if (result.score < -2) {
    detectedMood = 'Stressed';
  } else if (result.score > 0) {
    detectedMood = 'Motivated';
  }
  
  // Log for debugging (remove in production)
  console.log(`🧠 Mood Detection: "${text.substring(0, 50)}..." → ${detectedMood} (score: ${result.score})`);
  
  return detectedMood;
};

/**
 * Get mood color for visualization
 */
const getMoodColor = (mood) => {
  const colors = {
    'Motivated': '#10b981',
    'Neutral': '#60a5fa',
    'Stressed': '#f59e0b',
    'Burnt Out': '#ef4444',
    'Anxious': '#8b5cf6'
  };
  return colors[mood] || '#94a3b8';
};

/**
 * Get mood score for charting (0-100 scale)
 */
const getMoodScore = (mood) => {
  const scores = {
    'Motivated': 100,
    'Neutral': 60,
    'Anxious': 40,
    'Stressed': 30,
    'Burnt Out': 10
  };
  return scores[mood] || 50;
};

module.exports = { analyzeMood, getMoodColor, getMoodScore };