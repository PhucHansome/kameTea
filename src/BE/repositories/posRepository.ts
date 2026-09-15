import { Request } from 'express';
import { getServerSupabaseClient } from '../config/supabase';

export class PosRepository {
  public static async testConnection(req?: Request): Promise<{ success: boolean; message: string; latencyMs: number }> {
    const startTime = Date.now();
    const supabase = getServerSupabaseClient(req);
    if (!supabase) {
      return {
        success: false,
        message: 'Chưa cấu hình Supabase Project URL hoặc Anon Public Key.',
        latencyMs: 0,
      };
    }

    try {
      const { error } = await supabase.from('pos_categories').select('id').limit(1);
      const latency = Date.now() - startTime;
      if (error) {
        const isNetworkErr =
          error.message?.toLowerCase().includes('fetch failed') ||
          error.message?.toLowerCase().includes('network');
        return {
          success: false,
          message: isNetworkErr
            ? 'Không thể kết nối đến máy chủ Supabase. Vui lòng kiểm tra lại URL dự án và Anon Key.'
            : error.message,
          latencyMs: latency,
        };
      }
      return {
        success: true,
        message: `Kết nối máy chủ Supabase thành công! (${latency}ms)`,
        latencyMs: latency,
      };
    } catch {
      return {
        success: false,
        message: 'Không thể kết nối máy chủ Supabase (URL hoặc Key không hợp lệ).',
        latencyMs: Date.now() - startTime,
      };
    }
  }

  public static async getStats(req?: Request) {
    const supabase = getServerSupabaseClient(req);
    if (!supabase) {
      return { categories: 0, products: 0, users: 0, shifts: 0, payrolls: 0, orders: 0, settings: 0 };
    }

    const [cRes, pRes, uRes, sRes, prRes, oRes, setRes] = await Promise.all([
      supabase.from('pos_categories').select('id', { count: 'exact', head: true }),
      supabase.from('pos_products').select('id', { count: 'exact', head: true }),
      supabase.from('pos_users').select('id', { count: 'exact', head: true }),
      supabase.from('pos_shifts').select('id', { count: 'exact', head: true }),
      supabase.from('pos_payrolls').select('id', { count: 'exact', head: true }),
      supabase.from('pos_orders').select('id', { count: 'exact', head: true }),
      supabase.from('pos_settings').select('id', { count: 'exact', head: true }),
    ]);

    return {
      categories: cRes.count || 0,
      products: pRes.count || 0,
      users: uRes.count || 0,
      shifts: sRes.count || 0,
      payrolls: prRes.count || 0,
      orders: oRes.count || 0,
      settings: setRes.count || 0,
    };
  }

  public static async pullAllData(req?: Request) {
    const supabase = getServerSupabaseClient(req);
    if (!supabase) return null;

    const [cRes, pRes, uRes, sRes, prRes, oRes, setRes, summRes] = await Promise.all([
      supabase.from('pos_categories').select('*').order('sort_order', { ascending: true }),
      supabase.from('pos_products').select('*'),
      supabase.from('pos_users').select('*'),
      supabase.from('pos_shifts').select('*').order('date', { ascending: false }),
      supabase.from('pos_payrolls').select('*').order('month', { ascending: false }),
      supabase.from('pos_orders').select('*').order('created_at', { ascending: false }).limit(200),
      supabase.from('pos_settings').select('*').limit(1),
      (supabase.from('pos_daily_sales_summary' as any) as any).select('*').order('date', { ascending: false }).catch(() => ({ data: [] })),
    ]);

    return { cRes, pRes, uRes, sRes, prRes, oRes, setRes, summRes };
  }

  public static async upsertGeneric(table: string, rows: any[], conflict?: string, req?: Request) {
    const supabase = getServerSupabaseClient(req);
    if (!supabase) throw new Error('Chưa cấu hình Supabase Client');
    const options: any = conflict ? { onConflict: conflict } : undefined;
    return (supabase.from(table as any) as any).upsert(rows, options).select();
  }

  public static async updateGeneric(table: string, values: any, column: string, val: any, req?: Request) {
    const supabase = getServerSupabaseClient(req);
    if (!supabase) throw new Error('Chưa cấu hình Supabase Client');
    return (supabase.from(table as any) as any).update(values).eq(column, val).select();
  }

  public static async deleteGeneric(table: string, column: string, val: any, req?: Request) {
    const supabase = getServerSupabaseClient(req);
    if (!supabase) throw new Error('Chưa cấu hình Supabase Client');
    return (supabase.from(table as any) as any).delete().eq(column, val);
  }

  public static async getOrdersBeforeDate(targetDate: string, req?: Request) {
    const supabase = getServerSupabaseClient(req);
    if (!supabase) return [];
    const { data } = await supabase.from('pos_orders').select('*').lte('created_at', targetDate);
    return data || [];
  }

  public static async deleteOrdersByIds(ids: string[], req?: Request) {
    const supabase = getServerSupabaseClient(req);
    if (!supabase || ids.length === 0) return;
    await supabase.from('pos_orders').delete().in('id', ids);
  }
}
