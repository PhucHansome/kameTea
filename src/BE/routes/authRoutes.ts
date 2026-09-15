import { Router, Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/authService';

const router = Router();

router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { username, password } = req.body;
    const result = await AuthService.login(username, password, req);
    return res.json(result);
  } catch (err) {
    next(err);
  }
});

export default router;
