import { Order } from '../../shared/types';
import { OrderRepository } from '../repositories/orderRepository';
import { AppValidationError } from '../../shared/errorCatalog';

export class OrderService {
  public static async syncActiveOrder(order: Order) {
    if (!order || !order.id) {
      throw new AppValidationError('ME00002', ['Mã đơn hàng (id)']);
    }

    // Validate table
    if (!order.tableId) {
      throw new AppValidationError('ME00002', ['Mã bàn']);
    }

    OrderRepository.setInMemoryOrder(order);
    await OrderRepository.syncOrderToSupabase(order);

    return {
      success: true,
      order,
      timestamp: OrderRepository.getLastUpdated(),
    };
  }

  public static async getActiveOrders(since: number = 0, tableId?: string | null) {
    const { orders, lastUpdated } = OrderRepository.getActiveOrders(tableId);

    // Warm up if empty
    if (orders.length === 0 && Date.now() - lastUpdated > 10000) {
      await OrderRepository.warmUpCacheFromSupabase();
    }

    const finalResult = OrderRepository.getActiveOrders(tableId);

    return {
      success: true,
      orders: finalResult.orders,
      lastUpdated: finalResult.lastUpdated,
      hasNew: since < finalResult.lastUpdated,
    };
  }
}
