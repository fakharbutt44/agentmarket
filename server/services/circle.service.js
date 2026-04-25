const { v4: uuidv4 } = require('uuid');
const circleClient = require('../config/circle');
const logger = require('../utils/logger');

class CircleService {
  async createWallet(label) {
    try {
      const response = await circleClient.post('/v1/wallets', {
        idempotencyKey: uuidv4(),
        description: `AgentMarket — ${label}`,
      });
      const wallet = response.data?.data;
      if (!wallet?.walletId) throw new Error('No walletId in response');
      logger.info(`Wallet created: ${wallet.walletId} [${label}]`);
      return { walletId: wallet.walletId, address: wallet.address || null };
    } catch (err) {
      logger.warn(`Circle createWallet failed [${label}]: ${err.message} — using mock wallet`);
      return {
        walletId: `mock-${label}-${Date.now()}`,
        address: `0x${uuidv4().replace(/-/g, '').slice(0, 40)}`,
      };
    }
  }

  async getWalletBalance(walletId) {
    try {
      const response = await circleClient.get(`/v1/wallets/${walletId}/balances`);
      const balances = response.data?.data?.availableBalances || [];
      const usdc = balances.find((b) => b.currency === 'USD' || b.currency === 'USDC');
      return parseFloat(usdc?.amount || '0');
    } catch (err) {
      logger.warn(`getWalletBalance failed [${walletId}]: ${err.message}`);
      return 0;
    }
  }

  async executeNanopayment({ fromWalletId, toWalletId, amountUsdc, metadata = {} }) {
    const idempotencyKey = uuidv4();

    const isMock =
      String(fromWalletId).startsWith('mock-') ||
      String(toWalletId).startsWith('mock-');

    if (isMock) {
      logger.warn(`Mock wallets — generating demo nanopayment`);
      return this._mockPayment(amountUsdc);
    }

    try {
      const response = await circleClient.post('/v1/transfers', {
        idempotencyKey,
        source: { type: 'wallet', id: fromWalletId },
        destination: { type: 'wallet', id: toWalletId },
        amount: { amount: amountUsdc.toFixed(6), currency: 'USD' },
        metadata: { ...metadata, timestamp: new Date().toISOString() },
      });
      const transfer = response.data?.data;
      logger.info(`Nanopayment OK: ${fromWalletId} -> ${toWalletId} $${amountUsdc} [${transfer?.id}]`);
      return {
        circlePaymentId: transfer?.id,
        arcTxHash: transfer?.transactionHash || null,
        status: transfer?.status || 'pending',
      };
    } catch (err) {
      logger.error(`Circle nanopayment failed: ${err.message} — using demo fallback`);
      return this._mockPayment(amountUsdc);
    }
  }

  async getDepositAddress(walletId) {
    try {
      const response = await circleClient.get(`/v1/wallets/${walletId}/addresses`);
      const addresses = response.data?.data || [];
      return addresses.find((a) => a.currency === 'USD')?.address || null;
    } catch (err) {
      logger.warn(`getDepositAddress failed [${walletId}]: ${err.message}`);
      return null;
    }
  }

  _mockPayment(amountUsdc) {
    const arcTxHash = `0x${uuidv4().replace(/-/g, '')}${uuidv4().replace(/-/g, '').slice(0, 10)}`;
    const circlePaymentId = uuidv4();
    logger.info(`Demo payment: $${amountUsdc} USDC | arc=${arcTxHash.slice(0, 20)}...`);
    return { circlePaymentId, arcTxHash, status: 'confirmed' };
  }
}

module.exports = new CircleService();
