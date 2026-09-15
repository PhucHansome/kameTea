import { Router, Request, Response, NextFunction } from 'express';
import { OrderService } from '../services/orderService';

const router = Router();

router.post('/sync-active', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const order = req.body;
    const result = await OrderService.syncActiveOrder(order);
    return res.json(result);
  } catch (err) {
    next(err);
  }
});

router.get('/active', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const since = Number(req.query.since || 0);
    const tableId = req.query.tableId ? String(req.query.tableId) : null;
    const result = await OrderService.getActiveOrders(since, tableId);
    return res.json(result);
  } catch (err) {
    next(err);
  }
});

export default router;
