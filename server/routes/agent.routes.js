const router = require('express').Router();
const { getAgents, getAgent } = require('../controllers/agent.controller');
const { protectJWT } = require('../middleware/auth.middleware');

router.use(protectJWT);
router.get('/', getAgents);
router.get('/:id', getAgent);

module.exports = router;
