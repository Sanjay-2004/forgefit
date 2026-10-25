const router = require('express').Router();
const { requireAuth } = require('../middleware/auth');
const { getMe, updateMe } = require('../controllers/userController');

router.get('/me', requireAuth, getMe);
router.patch('/me', requireAuth, updateMe);

module.exports = router;
