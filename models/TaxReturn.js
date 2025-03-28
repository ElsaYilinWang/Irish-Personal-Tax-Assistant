const mongoose = require('mongoose');

const taxReturnSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  income: {
    type: Number,
    required: true
  },
  deductions: {
    type: Number,
    default: 0
  },
  taxCredits: {
    type: Number,
    default: 0
  },
  year: {
    type: Number,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('TaxReturn', taxReturnSchema);
