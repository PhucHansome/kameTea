import { Express } from 'express';
import healthRoutes from './routes/healthRoutes';
import authRoutes from './routes/authRoutes';
import orderRoutes from './routes/orderRoutes';
import paymentRoutes from './routes/paymentRoutes';
import posRoutes from './routes/posRoutes';
import errorRoutes from './routes/errorRoutes';
import { centralErrorHandler } from './middleware/errorHandler';
import { PosService } from './services/posService';

/**
 * ĐĂNG KÝ TẬP TRUNG TOÀN BỘ ROUTE & MIDDLEWARE BACKEND
 */
export function registerBackend(app: Express) {
  // 1. Health check
  app.use('/api/health', healthRoutes);

  // 2. Auth routes
  app.use('/api/auth', authRoutes);

  // 3. Order routes
  app.use('/api/orders', orderRoutes);

  // 4. Payment routes (Bank webhook, check status, simulate)
  app.use('/api/payment', paymentRoutes);

  // 5. Supabase routes (data sync, stats, upsert, update, delete, compress)
  app.use('/api/supabase', posRoutes);

  // 6. Error catalog routes
  app.use('/api/errors', errorRoutes);

  // 7. Central Error Handling Middleware (luôn đặt sau routes)
  app.use(centralErrorHandler);

  // 8. Background schedule (Tự động nén doanh thu lưu trữ cũ sau khi khởi động)
  setTimeout(() => {
    PosService.compressSales(12).catch((err) => {
      console.warn('[Auto-Cron] Lỗi nén dữ liệu cũ tự động:', err?.message);
    });
  }, 30000);

  setInterval(() => {
    PosService.compressSales(12).catch((err) => {
      console.warn('[Auto-Cron] Lỗi nén dữ liệu cũ tự động định kỳ:', err?.message);
    });
  }, 12 * 60 * 60 * 1000);
}
