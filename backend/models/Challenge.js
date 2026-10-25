const mongoose = require('mongoose');

const targetSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, default: 'custom' },
  xpValue: { type: Number, default: 10 },
  order: { type: Number, default: 0 },
});

const challengeSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  durationDays: { type: Number, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  waterTarget: { type: Number, enum: [3, 4], default: 3 },
  dailyTargets: [targetSchema],
  status: { type: String, enum: ['active', 'completed', 'failed'], default: 'active' },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Challenge', challengeSchema);
