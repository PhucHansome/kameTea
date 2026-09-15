import { Router, Request, Response, NextFunction } from 'express';
import { BankPaymentService } from '../services/bankPaymentService';
import { SERVER_CONFIG } from '../config/env';

const router = Router();

router.post('/bank-webhook', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = (req.headers['authorization'] || req.headers['x-api-key']) as string | undefined;
    const webhookSecret = SERVER_CONFIG.BANK_WEBHOOK_KEY;
    const result = BankPaymentService.processWebhook(req.body, authHeader, webhookSecret);
    return res.json(result);
  } catch (err) {
    next(err);
  }
});

router.get('/check-status', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orderCode = req.query.orderCode ? String(req.query.orderCode) : '';
    const orderId = req.query.orderId ? String(req.query.orderId) : '';
    const expectedAmount = Number(req.query.amount || 0);
    const apiKey = String(req.query.apiKey || SERVER_CONFIG.BANK_API_KEY || '');
    const result = await BankPaymentService.checkStatus(orderCode, orderId, expectedAmount, apiKey);
    return res.json(result);
  } catch (err) {
    next(err);
  }
});

router.post('/simulate-bank-transfer', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { orderCode, orderId, amount, tableName } = req.body || {};
    const result = BankPaymentService.simulateBankTransfer(orderCode, orderId, amount, tableName);
    return res.json(result);
  } catch (err) {
    next(err);
  }
});

router.get('/recent-transactions', (_req: Request, res: Response, next: NextFunction) => {
  try {
    const result = BankPaymentService.getRecentTransactions(30);
    return res.json(result);
  } catch (err) {
    next(err);
  }
});

export default router;
