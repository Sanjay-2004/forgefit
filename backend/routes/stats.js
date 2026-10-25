const router = require('express').Router();
const { requireAuth } = require('../middleware/auth');
const { getProgress } = require('../controllers/statsController');

router.get('/progress', requireAuth, getProgress);

module.exports = router;
