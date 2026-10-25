const User = require('../models/User');
const Challenge = require('../models/Challenge');
const DailyLog = require('../models/DailyLog');
const { getLevel, getRank } = require('../utils/xp');

function toDateString(date = new Date()) {
  return date.toISOString().split('T')[0];
}

function calcDayNumber(startDate, todayStr) {
  const start = new Date(startDate);
  const startUTC = Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate());
  const [y, m, d] = todayStr.split('-').map(Number);
  const todayUTC = Date.UTC(y, m - 1, d);
  return Math.max(1, Math.round((todayUTC - startUTC) / 86400000) + 1);
}

function resolveToday(req) {
  const q = req.query.date;
  return typeof q === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(q) ? q : toDateString();
}

exports.getToday = async (req, res) => {
  try {
    const user = await User.findOne({ supabaseId: req.supabaseUserId });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const challenge = await Challenge.findOne({ userId: user._id, status: 'active' });
    if (!challenge) return res.status(404).json({ error: 'No active challenge' });

    const today = resolveToday(req);
    let log = await DailyLog.findOne({ userId: user._id, date: today });

    if (!log) {
      const targets = challenge.dailyTargets.map((t) => ({
        targetId: t._id,
        name: t.name,
        completed: false,
        xpEarned: 0,
      }));
      log = await DailyLog.create({
        userId: user._id,
        challengeId: challenge._id,
        date: today,
        dayNumber: calcDayNumber(challenge.startDate, today),
        targetsCompleted: targets,
        waterIntake: 0,
        bonusChallenges: [],
      });
    }

    res.json(log);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.toggleTarget = async (req, res) => {
  try {
    const user = await User.findOne({ supabaseId: req.supabaseUserId });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const log = await DailyLog.findOne({ _id: req.params.id, userId: user._id });
    if (!log) return res.status(404).json({ error: 'Log not found' });

    const challenge = await Challenge.findById(log.challengeId);
    const targetDef = challenge?.dailyTargets.id(req.params.targetId);

    const target = log.targetsCompleted.find(
      (t) => t.targetId.toString() === req.params.targetId,
    );
    if (!target) return res.status(404).json({ error: 'Target not found in log' });

    const wasCompleted = target.completed;
    target.completed = !wasCompleted;
    target.xpEarned = target.completed ? (targetDef?.xpValue ?? 10) : 0;
    target.completedAt = target.completed ? new Date() : undefined;

    // Recalculate total XP for the day
    const allTargetXP = log.targetsCompleted.reduce((sum, t) => sum + t.xpEarned, 0);
    const allBonusXP = log.bonusChallenges
      .filter((b) => b.completed)
      .reduce((sum, b) => sum + b.xpValue, 0);
    log.totalXPEarnedToday = allTargetXP + allBonusXP;
    log.allCompleted = log.targetsCompleted.every((t) => t.completed);
    log.updatedAt = new Date();
    await log.save();

    // Award XP delta to user
    const delta = target.completed ? (targetDef?.xpValue ?? 10) : -(targetDef?.xpValue ?? 10);
    const newXP = Math.max(0, user.totalXP + delta);
    const newLevel = getLevel(newXP);
    const newRank = getRank(newXP);
    const leveledUp = newLevel > user.level;

    await User.findByIdAndUpdate(user._id, {
      $set: { totalXP: newXP, level: newLevel, rank: newRank },
    });

    res.json({ log, leveledUp, newLevel, newRank, newXP });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateWater = async (req, res) => {
  try {
    const user = await User.findOne({ supabaseId: req.supabaseUserId });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const log = await DailyLog.findOneAndUpdate(
      { _id: req.params.id, userId: user._id },
      { $set: { waterIntake: Number(req.body.waterIntake ?? 0), updatedAt: new Date() } },
      { new: true },
    );
    if (!log) return res.status(404).json({ error: 'Log not found' });
    res.json(log);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.uploadPhoto = async (req, res) => {
  try {
    const user = await User.findOne({ supabaseId: req.supabaseUserId });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const { photoUrl } = req.body;
    if (!photoUrl) return res.status(400).json({ error: 'photoUrl required' });

    const log = await DailyLog.findOneAndUpdate(
      { _id: req.params.id, userId: user._id },
      { $set: { progressPhotoUrl: photoUrl, updatedAt: new Date() } },
      { new: true },
    );
    if (!log) return res.status(404).json({ error: 'Log not found' });
    res.json(log);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
