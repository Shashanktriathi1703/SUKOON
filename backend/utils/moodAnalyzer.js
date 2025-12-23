const Sentiment = require('sentiment');
const sentiment = new Sentiment();

/**
 * Enhanced NLP-based Mood Detection System
 * More sensitive and accurate emotional recognition
 */
const analyzeMood = (text) => {
  // Convert to lowercase for better matching
  const lowerText = text.toLowerCase();
  
  // Base sentiment analysis
  const result = sentiment.analyze(text);
  
  // Enhanced keyword patterns - MORE SENSITIVE
  const burnoutKeywords = /\b(burnout|burnt out|exhausted|drained|can'?t take|giving up|no energy|overwhelmed|breaking down|can'?t cope|too tired|worn out|depleted|finished)\b/i;
  
  const anxiousKeywords = /\b(anxious|anxiety|worried|nervous|panic|scared|fear|restless|uneasy|tense|afraid|terrified|frightened|paranoid|worried sick|on edge)\b/i;
  
  const stressedKeywords = /\b(stressed|stress|pressure|deadline|too much|overworked|frustrated|struggling|difficult|hard time|under pressure|swamped|overwhelm)\b/i;
  
  const sadKeywords = /\b(sad|unhappy|depressed|down|low|miserable|upset|hurt|crying|tears|lonely|alone|heartbroken|devastated|blue|gloomy|sorrowful)\b/i;
  
  const motivatedKeywords = /\b(motivated|excited|great|awesome|happy|energized|productive|accomplished|proud|confident|fantastic|amazing|wonderful|excellent|thrilled|inspired|pumped|ready)\b/i;
  
  // Default to Neutral
  let detectedMood = 'Neutral';
  
  // Priority-based detection (negative emotions checked first)
  if (burnoutKeywords.test(lowerText)) {
    detectedMood = 'Burnt Out';
  } else if (anxiousKeywords.test(lowerText)) {
    detectedMood = 'Anxious';
  } else if (sadKeywords.test(lowerText)) {
    detectedMood = 'Stressed'; // Map sadness to stressed
  } else if (stressedKeywords.test(lowerText)) {
    detectedMood = 'Stressed';
  } else if (result.score <= -3) {
    // Very negative sentiment
    detectedMood = 'Stressed';
  } else if (result.score < -1) {
    // Moderately negative
    detectedMood = 'Stressed';
  } else if (motivatedKeywords.test(lowerText)) {
    detectedMood = 'Motivated';
  } else if (result.score >= 3) {
    // Very positive sentiment
    detectedMood = 'Motivated';
  } else if (result.score > 1) {
    // Moderately positive
    detectedMood = 'Motivated';
  }
  
  // Log for debugging
  console.log(`🧠 Mood Detection: "${text.substring(0, 50)}..." → ${detectedMood} (sentiment score: ${result.score})`);
  
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