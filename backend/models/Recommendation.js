const mongoose = require('mongoose');

const RecommendationSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ['breathing', 'exercise', 'game', 'article', 'movie', 'meditation', 'podcast', 'music']
  },
  content: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  moodTags: [{
    type: String,
    lowercase: true,
    enum: ['motivated', 'neutral', 'stressed', 'burnt out', 'anxious']
  }],
  duration: {
    type: String,
    default: '5 min'
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'easy'
  },
  link: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for faster mood-based queries
RecommendationSchema.index({ moodTags: 1, type: 1 });

module.exports = mongoose.model('Recommendation', RecommendationSchema);