const User = require('../models/User');
const Challenge = require('../models/Challenge');

exports.createChallenge = async (req, res) => {
  try {
    const user = await User.findOne({ supabaseId: req.supabaseUserId });
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Fail any existing active challenge
    await Challenge.updateMany(
      { userId: user._id, status: 'active' },
      { $set: { status: 'failed' } },
    );

    const { durationDays, startDate, waterTarget, dailyTargets } = req.body;
    const start = new Date(startDate);
    const end = new Date(start);
    end.setDate(end.getDate() + Number(durationDays) - 1);

    const challenge = await Challenge.create({
      userId: user._id,
      durationDays: Number(durationDays),
      startDate: start,
      endDate: end,
      waterTarget: Number(waterTarget),
      dailyTargets: dailyTargets ?? [],
    });

    res.status(201).json(challenge);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getActiveChallenge = async (req, res) => {
  try {
    const user = await User.findOne({ supabaseId: req.supabaseUserId });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const challenge = await Challenge.findOne({ userId: user._id, status: 'active' });
    if (!challenge) return res.status(404).json({ error: 'No active challenge' });
    res.json(challenge);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateChallenge = async (req, res) => {
  try {
    const user = await User.findOne({ supabaseId: req.supabaseUserId });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const challenge = await Challenge.findOne({ _id: req.params.id, userId: user._id, status: 'active' });
    if (!challenge) return res.status(404).json({ error: 'Active challenge not found' });

    const { waterTarget, dailyTargets } = req.body;
    if (waterTarget !== undefined) {
      if (![3, 4].includes(Number(waterTarget))) return res.status(400).json({ error: 'waterTarget must be 3 or 4' });
      challenge.waterTarget = Number(waterTarget);
    }
    if (dailyTargets !== undefined) {
      if (!Array.isArray(dailyTargets) || dailyTargets.length === 0) {
        return res.status(400).json({ error: 'At least one daily target is required' });
      }
      // Items carrying an existing _id keep it, so past logs stay linked
      challenge.dailyTargets = dailyTargets.map((t, i) => ({
        ...(t._id ? { _id: t._id } : {}),
        name: String(t.name).trim(),
        type: t.type ?? 'custom',
        xpValue: Math.max(1, Math.min(100, Number(t.xpValue) || 10)),
        order: i,
      }));
    }
    await challenge.save();

    // Sync today's log: keep progress on retained targets, add new ones,
    // drop removed targets that were not yet completed.
    const DailyLog = require('../models/DailyLog');
    const localToday = typeof req.query.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(req.query.date)
      ? req.query.date : new Date().toISOString().split('T')[0];
    const log = await DailyLog.findOne({ userId: user._id, challengeId: challenge._id, date: localToday });
    if (log) {
      const defs = new Map(challenge.dailyTargets.map((t) => [t._id.toString(), t]));
      const kept = log.targetsCompleted.filter((t) => defs.has(t.targetId.toString()) || t.completed);
      const have = new Set(kept.map((t) => t.targetId.toString()));
      for (const def of challenge.dailyTargets) {
        if (!have.has(def._id.toString())) {
          kept.push({ targetId: def._id, name: def.name, completed: false, xpEarned: 0 });
        }
      }
      kept.forEach((t) => { const d = defs.get(t.targetId.toString()); if (d) t.name = d.name; });
      log.targetsCompleted = kept;
      log.allCompleted = kept.length > 0 && kept.every((t) => t.completed);
      await log.save();
    }

    res.json(challenge);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
