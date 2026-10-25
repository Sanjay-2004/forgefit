const router = require('express').Router();
const { requireAuth } = require('../middleware/auth');
const { generate, complete } = require('../controllers/bonusChallengesController');

router.post('/generate', requireAuth, generate);
router.patch('/:id/complete', requireAuth, complete);

module.exports = router;
