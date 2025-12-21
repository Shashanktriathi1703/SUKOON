const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  username: { 
    type: String, 
    required: true, 
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 30
  },
  email: { 
    type: String, 
    required: true, 
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address']
  },
  password: { 
    type: String, 
    required: true,
    minlength: 6
  },
  moodHistory: [{
    mood: {
      type: String,
      enum: ['Motivated', 'Neutral', 'Stressed', 'Burnt Out', 'Anxious']
    },
    message: String,
    date: { 
      type: Date, 
      default: Date.now 
    }
  }],
  consultations: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Consultation'
  }],
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
}, { 
  timestamps: true 
});

// Index for faster queries
UserSchema.index({ email: 1, username: 1 });

module.exports = mongoose.model('User', UserSchema);