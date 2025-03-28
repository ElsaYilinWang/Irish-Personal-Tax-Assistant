const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationCode: {
    type: String
  },
  verificationCodeExpires: {
    type: Date
  },
  resetPasswordCode: {
    type: String
  },
  resetPasswordExpires: {
    type: Date
  },
  newEmail: {
    type: String,
    trim: true,
    lowercase: true
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('User', UserSchema);
