const router = require('express').Router();
const { getBalance, getDepositAddress, simulateDeposit, syncBalance } = require('../controllers/wallet.controller');
const { protectJWT } = require('../middleware/auth.middleware');

router.use(protectJWT);
router.get('/balance', getBalance);
router.get('/deposit-address', getDepositAddress);
router.post('/simulate-deposit', simulateDeposit);
router.post('/sync', syncBalance);

module.exports = router;
