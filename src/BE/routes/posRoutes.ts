import { Router, Request, Response, NextFunction } from 'express';
import { PosService } from '../services/posService';

const router = Router();

router.get('/test', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await PosService.testConnection(req);
    return res.json(result);
  } catch (err) {
    next(err);
  }
});

router.get('/stats', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await PosService.getStats(req);
    return res.json(result);
  } catch (err) {
    next(err);
  }
});

router.get('/data', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await PosService.pullData(req);
    return res.json(result);
  } catch (err) {
    next(err);
  }
});

router.post('/sync', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await PosService.syncData(req.body, req);
    return res.json(result);
  } catch (err) {
    next(err);
  }
});

router.post('/upsert', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { table, rows, conflict } = req.body;
    const result = await PosService.upsert(table, rows, conflict, req);
    return res.json(result);
  } catch (err) {
    next(err);
  }
});

router.post('/update', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { table, values, column = 'id', id, matchColumn, matchValue } = req.body;
    const targetCol = matchColumn || column || 'id';
    const targetVal = matchValue !== undefined ? matchValue : id;
    const result = await PosService.update(table, values, targetCol, targetVal, req);
    return res.json(result);
  } catch (err) {
    next(err);
  }
});

router.post('/delete', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { table, id, column = 'id' } = req.body;
    const result = await PosService.delete(table, column, id, req);
    return res.json(result);
  } catch (err) {
    next(err);
  }
});

router.post('/compress-sales', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { cutoffDate, cutoffMonths = 12, specificMonth } = req.body;
    const result = await PosService.compressSales(cutoffMonths, specificMonth, cutoffDate);
    return res.json(result);
  } catch (err) {
    next(err);
  }
});

export default router;
