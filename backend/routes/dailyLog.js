const router = require('express').Router();
const { requireAuth } = require('../middleware/auth');
const { getToday, toggleTarget, updateWater, uploadPhoto } = require('../controllers/dailyLogController');

router.get('/today', requireAuth, getToday);
router.patch('/:id/target/:targetId', requireAuth, toggleTarget);
router.patch('/:id/water', requireAuth, updateWater);
router.post('/:id/photo', requireAuth, uploadPhoto);

module.exports = router;
