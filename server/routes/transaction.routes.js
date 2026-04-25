const router = require('express').Router();
const { getTransactions } = require('../controllers/transaction.controller');
const { protectJWT } = require('../middleware/auth.middleware');

router.use(protectJWT);
router.get('/', getTransactions);

module.exports = router;
