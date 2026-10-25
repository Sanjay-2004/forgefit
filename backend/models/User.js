const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  supabaseId: { type: String, required: true, unique: true },
  email: { type: String, required: true },
  name: { type: String, default: '' },
  avatar: { type: String, default: null },
  level: { type: Number, default: 1 },
  totalXP: { type: Number, default: 0 },
  rank: { type: String, default: 'E' },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('User', userSchema);
