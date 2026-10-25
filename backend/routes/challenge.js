const router = require('express').Router();
const { requireAuth } = require('../middleware/auth');
const { createChallenge, getActiveChallenge, updateChallenge } = require('../controllers/challengeController');

router.post('/', requireAuth, createChallenge);
router.get('/active', requireAuth, getActiveChallenge);

router.patch('/:id', requireAuth, updateChallenge);

module.exports = router;
