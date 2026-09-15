import { Order } from '../../shared/types';
import { getServerSupabaseClient } from '../config/supabase';

export class OrderRepository {
  private static inMemoryActiveOrders = new Map<string, Order>();
  private static lastOrderUpdateTimestamp = Date.now();

  public static getActiveOrders(tableId?: string | null): { orders: Order[]; lastUpdated: number } {
    let list = Array.from(this.inMemoryActiveOrders.values()).filter(
      (o) => o.status === 'ACTIVE' || o.status === 'PENDING_PAYMENT'
    );
    if (tableId) {
      list = list.filter((o) => o.tableId === tableId);
    }
    return { orders: list, lastUpdated: this.lastOrderUpdateTimestamp };
  }

  public static setInMemoryOrder(order: Order): void {
    if (order.status === 'PAID' || order.status === 'CANCELLED') {
      this.inMemoryActiveOrders.delete(order.id);
    } else {
      this.inMemoryActiveOrders.set(order.id, {
        ...order,
      });
    }
    this.lastOrderUpdateTimestamp = Date.now();
  }

  public static getLastUpdated(): number {
    return this.lastOrderUpdateTimestamp;
  }

  public static async syncOrderToSupabase(order: Order): Promise<void> {
    try {
      const supabase = getServerSupabaseClient();
      if (!supabase) return;

      const row = {
        id: order.id,
        table_id: order.tableId,
        table_name: order.tableName || order.tableId,
        order_type: order.orderType || 'DINE_IN',
        status: order.status,
        total_amount: order.totalAmount || 0,
        final_total: order.finalTotal || order.totalAmount || 0,
        discount_percent: order.discountPercent || 0,
        shipping_fee: order.shippingFee || 0,
        guest_count: order.guestCount || 1,
        customer_name: order.customerNote || null,
        customer_phone: order.customerPhone || null,
        delivery_address: order.deliveryAddress || null,
        items: JSON.stringify(order.items || []),
        created_at: order.createdAt || new Date().toISOString(),
        paid_at: order.paidAt || null,
      };
      await supabase.from('pos_orders').upsert([row], { onConflict: 'id' });
    } catch (err: any) {
      console.warn('[OrderRepository] Supabase order upsert note:', err?.message);
    }
  }

  public static async warmUpCacheFromSupabase(): Promise<void> {
    try {
      const supabase = getServerSupabaseClient();
      if (!supabase) return;

      const { data: dbOrders } = await supabase
        .from('pos_orders')
        .select('*')
        .in('status', ['ACTIVE', 'PENDING_PAYMENT'])
        .order('created_at', { ascending: false });

      if (dbOrders && dbOrders.length > 0) {
        dbOrders.forEach((o: any) => {
          let items = [];
          try {
            if (o.items) items = typeof o.items === 'string' ? JSON.parse(o.items) : o.items;
          } catch { /* ignore */ }

          const parsedOrder: Order = {
            id: o.id,
            orderCode: o.id.startsWith('ord-qr-') ? `#QR-${o.id.slice(-4)}` : `#KAME-${o.id.slice(-6).toUpperCase()}`,
            tableId: o.table_id,
            tableName: o.table_name || o.table_id,
            zone: 'Khu vực chung',
            orderType: o.order_type || 'DINE_IN',
            serverName: o.id.startsWith('ord-qr-') ? 'Khách tự quét QR' : 'Thu ngân KAME',
            serverId: o.id.startsWith('ord-qr-') ? 'QR_SELF_ORDER' : 'u-1',
            guestCount: Number(o.guest_count || 1),
            status: o.status,
            items,
            subtotal: Number(o.total_amount || 0),
            discountPercent: Number(o.discount_percent || 0),
            discountAmount: 0,
            taxAmount: 0,
            totalAmount: Number(o.total_amount || 0),
            finalTotal: Number(o.final_total || o.total_amount || 0),
            shippingFee: Number(o.shipping_fee || 0),
            deliveryAddress: o.delivery_address || undefined,
            deliveryPhone: o.customer_phone || undefined,
            customerPhone: o.customer_phone || undefined,
            customerNote: o.customer_name || undefined,
            createdAt: o.created_at || new Date().toISOString(),
            updatedAt: o.created_at || new Date().toISOString(),
            paidAt: o.paid_at || undefined,
          };
          this.inMemoryActiveOrders.set(parsedOrder.id, parsedOrder);
        });
      }
    } catch {
      // ignore
    }
  }

  public static getAllInMemoryOrders(): Order[] {
    return Array.from(this.inMemoryActiveOrders.values());
  }
}
