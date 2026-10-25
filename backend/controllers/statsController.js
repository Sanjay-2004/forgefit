const User = require('../models/User');
const DailyLog = require('../models/DailyLog');
const Challenge = require('../models/Challenge');

exports.getProgress = async (req, res) => {
  try {
    const user = await User.findOne({ supabaseId: req.supabaseUserId });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const challenge = await Challenge.findOne({ userId: user._id, status: 'active' });
    const logs = await DailyLog.find({ userId: user._id }).sort({ date: 1 });

    const calendarDays = logs.map((l) => ({
      date: l.date,
      dayNumber: l.dayNumber,
      allCompleted: l.allCompleted,
    }));

    // Streak = consecutive calendar days with allCompleted, counted back from today.
    // If today isn't finished yet, the streak still counts through yesterday.
    let currentStreak = 0;
    let longestStreak = 0;
    const q = req.query.date;
    const today = typeof q === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(q) ? q : new Date().toISOString().split('T')[0];
    const doneDates = new Set(logs.filter((l) => l.allCompleted).map((l) => l.date));
    const shift = (dateStr, days) => {
      const [y, m, d] = dateStr.split('-').map(Number);
      return new Date(Date.UTC(y, m - 1, d + days)).toISOString().split('T')[0];
    };
    let cursor = doneDates.has(today) ? today : shift(today, -1);
    while (doneDates.has(cursor)) {
      currentStreak++;
      cursor = shift(cursor, -1);
    }

    // Longest streak (consecutive calendar days)
    let tempStreak = 0;
    let prev = null;
    for (const date of [...doneDates].sort()) {
      tempStreak = prev && shift(prev, 1) === date ? tempStreak + 1 : 1;
      longestStreak = Math.max(longestStreak, tempStreak);
      prev = date;
    }

    const totalDaysCompleted = logs.filter((l) => l.allCompleted).length;

    res.json({
      calendarDays,
      currentStreak,
      longestStreak,
      totalDaysCompleted,
      totalXP: user.totalXP,
      level: user.level,
      rank: user.rank,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
