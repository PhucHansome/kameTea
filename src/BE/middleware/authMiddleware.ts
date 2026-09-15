import { Request, Response, NextFunction } from 'express';
import { AppValidationError } from '../../shared/errorCatalog';

export function optionalAuthMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction
) {
  // Có thể bổ sung decode JWT hoặc API token nếu có
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    (req as any).token = authHeader.split(' ')[1];
  }
  next();
}

export function requireAdminRole(
  req: Request,
  _res: Response,
  next: NextFunction
) {
  const userRole = (req as any).user?.role || req.headers['x-user-role'];
  if (userRole !== 'ADMIN') {
    throw new AppValidationError('ME00013', ['Thao tác của Quản trị viên (Admin)']);
  }
  next();
}
