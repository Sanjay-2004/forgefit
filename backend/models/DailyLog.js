const mongoose = require('mongoose');

const targetLogSchema = new mongoose.Schema({
  targetId: { type: mongoose.Schema.Types.ObjectId },
  name: String,
  completed: { type: Boolean, default: false },
  xpEarned: { type: Number, default: 0 },
  completedAt: Date,
});

const bonusChallengeSchema = new mongoose.Schema({
  title: String,
  description: String,
  xpValue: { type: Number, default: 10 },
  completed: { type: Boolean, default: false },
  completedAt: Date,
});

const dailyLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  challengeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Challenge', required: true },
  date: { type: String, required: true },    // YYYY-MM-DD
  dayNumber: { type: Number, required: true },
  targetsCompleted: [targetLogSchema],
  waterIntake: { type: Number, default: 0 },
  progressPhotoUrl: { type: String, default: null },
  allCompleted: { type: Boolean, default: false },
  bonusChallenges: [bonusChallengeSchema],
  totalXPEarnedToday: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// One log per user per day
dailyLogSchema.index({ userId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('DailyLog', dailyLogSchema);
