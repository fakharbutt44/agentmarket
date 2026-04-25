const router = require('express').Router();
const { runSession, getSessions, getSession, getStats } = require('../controllers/job.controller');
const { protectJWT } = require('../middleware/auth.middleware');

router.use(protectJWT);
router.post('/run', runSession);
router.get('/sessions', getSessions);
router.get('/sessions/:id', getSession);
router.get('/stats', getStats);

module.exports = router;
