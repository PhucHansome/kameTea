import { clientFetch } from './clientApi';
import { Order } from '../../shared/types';

export const orderApi = {
  syncActiveOrder: async (order: Order): Promise<{ success: boolean; order: Order; timestamp: number }> => {
    return clientFetch<{ success: boolean; order: Order; timestamp: number }>('/api/orders/sync-active', {
      method: 'POST',
      body: JSON.stringify(order),
    });
  },

  getActiveOrders: async (since: number = 0, tableId?: string): Promise<{ success: boolean; orders: Order[]; lastUpdated: number; hasNew: boolean }> => {
    return clientFetch<{ success: boolean; orders: Order[]; lastUpdated: number; hasNew: boolean }>('/api/orders/active', {
      params: { since, tableId },
    });
  },
};
