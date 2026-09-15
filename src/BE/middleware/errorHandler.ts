import { Request, Response, NextFunction } from 'express';
import { AppValidationError } from '../../shared/errorCatalog';

/**
 * TẬP TRUNG XỬ LÝ LỖI TOÀN HỆ THỐNG BACKEND
 * Chuẩn hóa output: { error: true, code: 'ME0000x', message: '...' }
 */
export function centralErrorHandler(
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  if (err instanceof AppValidationError) {
    return res.status(err.statusCode).json(err.toJSON());
  }

  const statusCode = err.status || err.statusCode || 500;
  const message = err.message || 'Lỗi xử lý yêu cầu phía máy chủ';

  return res.status(statusCode).json({
    error: true,
    code: 'ME00020',
    message: `[ME00020] ${message}`,
    details: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
}
