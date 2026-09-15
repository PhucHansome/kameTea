import { Router, Request, Response } from 'express';
import { ErrorRepository } from '../repositories/errorRepository';

const router = Router();

router.get('/catalog', async (_req: Request, res: Response) => {
  const catalog = await ErrorRepository.getAllErrorCodes();
  return res.json({
    success: true,
    catalog,
  });
});

export default router;
