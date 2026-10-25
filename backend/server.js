require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN ?? '*' }));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch((err) => { console.error('❌ MongoDB error:', err); process.exit(1); });

app.use('/api/user', require('./routes/user'));
app.use('/api/challenge', require('./routes/challenge'));
app.use('/api/daily-log', require('./routes/dailyLog'));
app.use('/api/bonus-challenges', require('./routes/bonusChallenges'));
app.use('/api/stats', require('./routes/stats'));

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: err.message ?? 'Internal server error' });
});

const PORT = process.env.PORT ?? 4000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
