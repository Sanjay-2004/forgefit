const User = require('../models/User');
const { getLevel, getRank } = require('../utils/xp');

exports.getMe = async (req, res) => {
  try {
    let user = await User.findOne({ supabaseId: req.supabaseUserId });
    if (!user) {
      user = await User.create({
        supabaseId: req.supabaseUserId,
        email: req.userEmail,
        name: req.userEmail.split('@')[0],
      });
    }
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateMe = async (req, res) => {
  try {
    const user = await User.findOneAndUpdate(
      { supabaseId: req.supabaseUserId },
      { $set: { name: req.body.name, avatar: req.body.avatar } },
      { new: true },
    );
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
