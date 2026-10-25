const User = require('../models/User');
const Challenge = require('../models/Challenge');
const DailyLog = require('../models/DailyLog');
const { getLevel, getRank } = require('../utils/xp');
const { generateBonusChallenges } = require('../utils/openai');

exports.generate = async (req, res) => {
  try {
    const user = await User.findOne({ supabaseId: req.supabaseUserId });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const log = await DailyLog.findOne({ _id: req.body.logId, userId: user._id });
    if (!log) return res.status(404).json({ error: 'Log not found' });

    if (log.bonusChallenges.length > 0) return res.json(log);

    const challenge = await Challenge.findById(log.challengeId);
    const targetNames = challenge?.dailyTargets.map((t) => t.name) ?? [];

    const generated = await generateBonusChallenges(log.dayNumber, challenge?.durationDays ?? 75, targetNames);

    log.bonusChallenges = generated;
    log.updatedAt = new Date();
    await log.save();

    res.json(log);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.complete = async (req, res) => {
  try {
    const user = await User.findOne({ supabaseId: req.supabaseUserId });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const log = await DailyLog.findOne({ _id: req.body.logId, userId: user._id });
    if (!log) return res.status(404).json({ error: 'Log not found' });

    const bonus = log.bonusChallenges.id(req.params.id);
    if (!bonus) return res.status(404).json({ error: 'Bonus challenge not found' });
    if (bonus.completed) {
      return res.json({ log, leveledUp: false, newLevel: user.level, newRank: user.rank, newXP: user.totalXP });
    }

    bonus.completed = true;
    bonus.completedAt = new Date();

    const allTargetXP = log.targetsCompleted.reduce((sum, t) => sum + t.xpEarned, 0);
    const allBonusXP = log.bonusChallenges.filter((b) => b.completed).reduce((sum, b) => sum + b.xpValue, 0);
    log.totalXPEarnedToday = allTargetXP + allBonusXP;
    log.updatedAt = new Date();
    await log.save();

    const newXP = Math.max(0, user.totalXP + bonus.xpValue);
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
