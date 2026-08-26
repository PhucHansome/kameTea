// Supabase Client and Database Service
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  User,
  Category,
  Product,
  Order,
  ShiftRecord,
  PayrollRecord,
  StoreSettings,
  Zone,
  TableItem,
  ExpenseRecord,
} from '../types/pos';

// Project credentials provided by user
export const DEFAULT_SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://juottdlmnzbkydlgnoqs.supabase.co';
export const DEFAULT_SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
export const DEFAULT_SUPABASE_SECRET_KEY = '';
export const DEFAULT_SUPABASE_JWKS_URL = 'https://juottdlmnzbkydlgnoqs.supabase.co/auth/v1/.well-known/jwks.json';

// Backward compatibility alias
export const DEFAULT_SUPABASE_KEY = DEFAULT_SUPABASE_PUBLISHABLE_KEY;

let supabaseClient: SupabaseClient | null = null;

export const sanitizeSupabaseUrl = (input?: string | null): string => {
  if (!input || typeof input !== 'string') return DEFAULT_SUPABASE_URL;
  let trimmed = input.trim();
  if (!trimmed) return DEFAULT_SUPABASE_URL;

  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
    trimmed = 'https://' + trimmed;
  }

  try {
    const urlObj = new URL(trimmed);
    if (urlObj.protocol === 'http:' || urlObj.protocol === 'https:') {
      return trimmed.replace(/\/+$/, '');
    }
  } catch {
    // Malformed URL
  }
  return DEFAULT_SUPABASE_URL;
};

export const sanitizeSupabaseKey = (input?: string | null, fallbackKey = DEFAULT_SUPABASE_PUBLISHABLE_KEY): string => {
  if (!input || typeof input !== 'string') return fallbackKey;
  const trimmed = input.trim();
  return trimmed || fallbackKey;
};

export const getSupabaseConfig = () => {
  // Check localStorage first in case user updated in UI modal
  let localUrl = '';
  let localKey = '';
  try {
    const saved = localStorage.getItem('kame_supabase_config');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.url && typeof parsed.url === 'string' && parsed.url.trim()) {
        localUrl = parsed.url.trim();
      }
      if (parsed.anonKey && typeof parsed.anonKey === 'string' && parsed.anonKey.trim()) {
        localKey = parsed.anonKey.trim();
      }
    }
  } catch {
    // ignore
  }

  const rawUrl = (
    localUrl ||
    (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_SUPABASE_URL) ||
    (typeof import.meta !== 'undefined' && (import.meta as any).env?.NEXT_PUBLIC_SUPABASE_URL) ||
    (typeof import.meta !== 'undefined' && (import.meta as any).env?.SUPABASE_URL) ||
    DEFAULT_SUPABASE_URL
  );

  const rawAnonKey = (
    localKey ||
    (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_SUPABASE_ANON_KEY) ||
    (typeof import.meta !== 'undefined' && (import.meta as any).env?.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) ||
    (typeof import.meta !== 'undefined' && (import.meta as any).env?.SUPABASE_PUBLISHABLE_KEY) ||
    DEFAULT_SUPABASE_PUBLISHABLE_KEY
  );

  const rawSecretKey = (
    (typeof import.meta !== 'undefined' && (import.meta as any).env?.SUPABASE_SECRET_KEY) ||
    DEFAULT_SUPABASE_SECRET_KEY
  );

  const url = sanitizeSupabaseUrl(rawUrl);
  const anonKey = sanitizeSupabaseKey(rawAnonKey, DEFAULT_SUPABASE_PUBLISHABLE_KEY);
  const secretKey = sanitizeSupabaseKey(rawSecretKey, DEFAULT_SUPABASE_SECRET_KEY);

  return {
    url,
    anonKey,
    secretKey,
    isConfigured: Boolean(url && anonKey && url.startsWith('http')),
  };
};

export const getSupabaseClient = (): SupabaseClient => {
  if (supabaseClient) {
    return supabaseClient;
  }

  const { url, anonKey, secretKey } = getSupabaseConfig();
  const effectiveKey = sanitizeSupabaseKey(
    secretKey || anonKey || DEFAULT_SUPABASE_SECRET_KEY,
    DEFAULT_SUPABASE_SECRET_KEY
  );
  const effectiveUrl = sanitizeSupabaseUrl(url);

  try {
    supabaseClient = createClient(effectiveUrl, effectiveKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  } catch (err) {
    supabaseClient = createClient(DEFAULT_SUPABASE_URL, DEFAULT_SUPABASE_SECRET_KEY, {
      auth: { persistSession: false },
    });
  }

  return supabaseClient;
};

export interface TableStats {
  categories: number;
  products: number;
  users: number;
  shifts: number;
  payrolls: number;
  orders: number;
  settings: number;
  zones?: number;
  tables?: number;
  expenses?: number;
}

export const getSupabaseTableStats = async (): Promise<{ success: boolean; stats: TableStats; message?: string }> => {
  // 1. Try Server API Proxy first
  try {
    const res = await fetch('/api/supabase/stats');
    if (res.ok) {
      const json = await res.json();
      if (json.success && json.stats) {
        return json;
      }
    }
  } catch {
    // ignore, fall back
  }

  // 2. Direct Supabase client fallback
  const client = getSupabaseClient();
  if (!client) {
    return {
      success: false,
      stats: { categories: 0, products: 0, users: 0, shifts: 0, payrolls: 0, orders: 0, settings: 0 },
      message: 'Chưa cấu hình Supabase.',
    };
  }

  try {
    const [cRes, pRes, uRes, sRes, prRes, oRes, setRes] = await Promise.all([
      client.from('pos_categories').select('id', { count: 'exact', head: true }),
      client.from('pos_products').select('id', { count: 'exact', head: true }),
      client.from('pos_users').select('id', { count: 'exact', head: true }),
      client.from('pos_shifts').select('id', { count: 'exact', head: true }),
      client.from('pos_payrolls').select('id', { count: 'exact', head: true }),
      client.from('pos_orders').select('id', { count: 'exact', head: true }),
      client.from('pos_settings').select('id', { count: 'exact', head: true }),
    ]);

    return {
      success: true,
      stats: {
        categories: cRes.count || 0,
        products: pRes.count || 0,
        users: uRes.count || 0,
        shifts: sRes.count || 0,
        payrolls: prRes.count || 0,
        orders: oRes.count || 0,
        settings: setRes.count || 0,
      },
    };
  } catch (err: any) {
    return {
      success: false,
      stats: { categories: 0, products: 0, users: 0, shifts: 0, payrolls: 0, orders: 0, settings: 0 },
      message: err?.message || 'Lỗi đọc dữ liệu.',
    };
  }
};

export const testSupabaseConnection = async (): Promise<{ success: boolean; message: string; latencyMs?: number }> => {
  // 1. Try Server API Proxy first
  try {
    const res = await fetch('/api/supabase/test');
    if (res.ok) {
      const json = await res.json();
      if (json.success) return json;
    }
  } catch {
    // fallback
  }

  // 2. Direct Supabase client fallback
  const client = getSupabaseClient();
  if (!client) {
    return {
      success: false,
      message: 'Chưa cấu hình Supabase URL và Key.',
    };
  }

  try {
    const startTime = Date.now();
    const { error } = await client.from('pos_categories').select('*').limit(1);
    const latency = Date.now() - startTime;
    if (error) {
      if (error.message.includes('relation') || error.message.includes('does not exist') || error.code === '42P01') {
        return {
          success: true,
          message: 'Kết nối máy chủ Supabase thành công! Hãy chạy đoạn mã SQL để tạo bảng.',
          latencyMs: latency,
        };
      }
      return {
        success: false,
        message: `Lỗi truy vấn: ${error.message} (Mã: ${error.code || 'N/A'})`,
        latencyMs: latency,
      };
    }
    return {
      success: true,
      message: `Kết nối máy chủ Supabase hoạt động chính xác 100%! (${latency}ms)`,
      latencyMs: latency,
    };
  } catch (err: any) {
    return {
      success: false,
      message: err?.message || 'Không thể kết nối đến máy chủ Supabase.',
    };
  }
};

export interface SyncPayload {
  categories: Category[];
  products: Product[];
  users: User[];
  shifts: ShiftRecord[];
  payrolls: PayrollRecord[];
  orders: Order[];
  settings: StoreSettings;
  zones?: Zone[];
  tables?: TableItem[];
  expenses?: ExpenseRecord[];
}

export interface SyncResult {
  success: boolean;
  message: string;
  counts: {
    categories: number;
    products: number;
    users: number;
    shifts: number;
    payrolls: number;
    orders: number;
    settings: number;
  };
  errors?: string[];
}

/**
 * Upload and synchronize all local data up to Supabase server
 */
export const pushAllDataToSupabase = async (data: SyncPayload): Promise<SyncResult> => {
  // 1. Try Express Server Proxy API First (Zero CORS / Zero AdBlock issues)
  try {
    const res = await fetch('/api/supabase/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      const json = await res.json();
      return json;
    }
  } catch {
    // If backend proxy unreachable, fallback to client Supabase SDK
  }

  // 2. Direct client fallback
  const client = getSupabaseClient();
  if (!client) {
    return {
      success: false,
      message: 'Supabase client chưa sẵn sàng.',
      counts: { categories: 0, products: 0, users: 0, shifts: 0, payrolls: 0, orders: 0, settings: 0 },
    };
  }

  const errors: string[] = [];
  const counts = {
    categories: 0,
    products: 0,
    users: 0,
    shifts: 0,
    payrolls: 0,
    orders: 0,
    settings: 0,
  };

  try {
    // 1. Categories
    if (data.categories && data.categories.length > 0) {
      const categoryRows = data.categories.map((c, idx) => ({
        id: c.id,
        name: c.name,
        station: c.station || 'BAR',
        icon: c.icon || 'Coffee',
        sort_order: idx,
      }));
      const { error: cErr } = await client.from('pos_categories').upsert(categoryRows, { onConflict: 'id' });
      if (cErr) errors.push(`Danh mục: ${cErr.message}`);
      else counts.categories = categoryRows.length;
    }

    // 2. Products
    if (data.products && data.products.length > 0) {
      const productRows = data.products.map((p) => ({
        id: p.id,
        category_id: p.categoryId,
        name: p.name,
        price: p.basePrice,
        station: p.station || 'BAR',
        unit: p.unit || 'phần',
        is_available: p.isAvailable !== false,
        is_popular: Boolean(p.isPopular),
        allowed_toppings: Boolean(p.allowedToppings),
        sizes: p.sizes ? JSON.stringify(p.sizes) : null,
        cooking_methods: p.cookingMethods ? JSON.stringify(p.cookingMethods) : null,
      }));
      const { error: pErr } = await client.from('pos_products').upsert(productRows, { onConflict: 'id' });
      if (pErr) errors.push(`Món ăn / đồ uống: ${pErr.message}`);
      else counts.products = productRows.length;
    }

    // 3. Users (Staff)
    if (data.users && data.users.length > 0) {
      const userRows = data.users.map((u) => ({
        id: u.id,
        name: u.name,
        phone: u.phone,
        role: u.role,
        salary_type: u.salaryType || 'COMBINED',
        base_salary: u.baseSalary || 0,
        hourly_rate: u.hourlyRate || 0,
        status: u.status || 'ACTIVE',
        joined_date: u.joinedDate || new Date().toISOString().split('T')[0],
      }));
      const { error: uErr } = await client.from('pos_users').upsert(userRows, { onConflict: 'id' });
      if (uErr) errors.push(`Nhân viên: ${uErr.message}`);
      else counts.users = userRows.length;
    }

    // 4. Shifts
    if (data.shifts && data.shifts.length > 0) {
      const shiftRows = data.shifts.map((s) => ({
        id: s.id,
        user_id: s.userId,
        user_name: s.userName || null,
        user_phone: s.userPhone || null,
        user_role: s.userRole || null,
        date: s.date,
        shift_type: s.shiftType,
        hours_worked: s.hoursWorked || 0,
        check_in: s.checkIn || null,
        check_out: s.checkOut || null,
        status: s.status || 'ATTENDED',
      }));
      const { error: sErr } = await client.from('pos_shifts').upsert(shiftRows, { onConflict: 'id' });
      if (sErr) errors.push(`Ca làm việc: ${sErr.message}`);
      else counts.shifts = shiftRows.length;
    }

    // 5. Payrolls
    if (data.payrolls && data.payrolls.length > 0) {
      const payrollRows = data.payrolls.map((pr) => ({
        id: pr.id,
        user_id: pr.userId,
        user_name: pr.userName || pr.userId,
        user_phone: pr.userPhone || null,
        user_role: pr.userRole || 'SERVER',
        salary_type: pr.salaryType || 'COMBINED',
        month: pr.month,
        total_hours: pr.totalHours || 0,
        total_shifts: pr.totalShifts || 0,
        base_salary: pr.baseSalary || 0,
        hourly_rate: pr.hourlyRate || 0,
        hourly_pay: pr.hourlyPay || 0,
        bonus: pr.bonus || 0,
        bonus_reason: pr.bonusReason || null,
        deduction: pr.deduction || 0,
        deduction_reason: pr.deductionReason || null,
        net_salary: pr.netSalary || 0,
        status: pr.status || 'DRAFT',
        paid_date: pr.paidDate || null,
      }));
      const { error: prErr } = await client.from('pos_payrolls').upsert(payrollRows, { onConflict: 'id' });
      if (prErr) errors.push(`Bảng lương: ${prErr.message}`);
      else counts.payrolls = payrollRows.length;
    }

    // 6. Orders
    if (data.orders && data.orders.length > 0) {
      const orderRows = data.orders.map((o) => ({
        id: o.id,
        table_id: o.tableId,
        table_name: o.tableName || o.tableId,
        order_type: o.orderType || 'DINE_IN',
        status: o.status,
        payment_method: o.paymentMethod || null,
        total_amount: o.totalAmount,
        final_total: o.finalTotal || o.totalAmount,
        discount_percent: o.discountPercent || 0,
        tax_percent: 0,
        shipping_fee: o.shippingFee || 0,
        cash_amount_paid: o.cashAmountPaid || 0,
        transfer_amount_paid: o.transferAmountPaid || 0,
        guest_count: o.guestCount || 1,
        customer_name: o.customerNote || null,
        customer_phone: o.customerPhone || null,
        delivery_address: o.deliveryAddress || null,
        items: JSON.stringify(o.items || []),
        created_at: o.createdAt || new Date().toISOString(),
        paid_at: o.paidAt || null,
      }));
      const { error: oErr } = await client.from('pos_orders').upsert(orderRows, { onConflict: 'id' });
      if (oErr) errors.push(`Hóa đơn: ${oErr.message}`);
      else counts.orders = orderRows.length;
    }

    // 7. Settings
    if (data.settings) {
      const settingRow = {
        id: 'current_store',
        store_name: data.settings.storeName || 'KAME TEA & FOOD',
        phone: data.settings.phone || '',
        address: data.settings.address || '',
        bank_name: data.settings.bankName || 'Sacombank',
        bank_account: data.settings.bankAccount || '',
        account_holder: data.settings.accountHolder || '',
        tax_percent: data.settings.taxPercent || 0,
        receipt_footer: data.settings.receiptFooter || '',
        updated_at: new Date().toISOString(),
      };
      const { error: setErr } = await client.from('pos_settings').upsert(settingRow, { onConflict: 'id' });
      if (setErr) errors.push(`Cài đặt quán: ${setErr.message}`);
      else counts.settings = 1;
    }

    if (errors.length > 0) {
      return {
        success: false,
        message: `Đồng bộ hoàn tất một phần (${errors.length} lỗi): ${errors.join(', ')}`,
        counts,
        errors,
      };
    }

    return {
      success: true,
      message: `Đã đưa toàn bộ dữ liệu lên máy chủ Supabase thành công! (${counts.products} món, ${counts.categories} danh mục, ${counts.users} nhân viên, ${counts.shifts} ca làm, ${counts.orders} hóa đơn).`,
      counts,
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Lỗi kết nối khi tải dữ liệu lên: ${err?.message || 'Không xác định'}`,
      counts,
      errors: [err?.message || 'Unknown error'],
    };
  }
};

/**
 * Fetch all data from Supabase down to local application
 */
export const pullAllDataFromSupabase = async (): Promise<{
  success: boolean;
  data?: {
    categories: Category[];
    products: Product[];
    users: User[];
    shifts: ShiftRecord[];
    payrolls: PayrollRecord[];
    orders: Order[];
    settings?: StoreSettings;
  };
  message: string;
}> => {
  // 1. Try Express Server Proxy API First
  try {
    const res = await fetch('/api/supabase/data');
    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data) {
        return {
          success: true,
          data: json.data,
          message: `Đã tải về thành công ${json.data.products?.length || 0} món, ${json.data.categories?.length || 0} danh mục, ${json.data.users?.length || 0} nhân viên từ Supabase.`,
        };
      }
    }
  } catch {
    // fallback
  }

  // 2. Direct client fallback
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, message: 'Supabase client chưa sẵn sàng.' };
  }

  try {
    const [cRes, pRes, uRes, sRes, prRes, oRes, setRes] = await Promise.all([
      client.from('pos_categories').select('*').order('sort_order', { ascending: true }),
      client.from('pos_products').select('*'),
      client.from('pos_users').select('*'),
      client.from('pos_shifts').select('*').order('date', { ascending: false }),
      client.from('pos_payrolls').select('*').order('month', { ascending: false }),
      client.from('pos_orders').select('*').order('created_at', { ascending: false }),
      client.from('pos_settings').select('*').eq('id', 'current_store').single(),
    ]);

    const categories: Category[] = (cRes.data || []).map((c: any) => ({
      id: c.id,
      name: c.name,
      icon: c.icon || 'Coffee',
      station: c.station || 'BAR',
    }));

    const products: Product[] = (pRes.data || []).map((p: any) => ({
      id: p.id,
      categoryId: p.category_id,
      name: p.name,
      basePrice: Number(p.price || 0),
      station: p.station || 'BAR',
      unit: p.unit || 'phần',
      isAvailable: p.is_available !== false,
      isPopular: Boolean(p.is_popular),
      allowedToppings: Boolean(p.allowedToppings),
      sizes: typeof p.sizes === 'string' ? JSON.parse(p.sizes) : p.sizes || undefined,
      cookingMethods: typeof p.cooking_methods === 'string' ? JSON.parse(p.cooking_methods) : p.cooking_methods || undefined,
    }));

    const users: User[] = (uRes.data || []).map((u: any) => ({
      id: u.id,
      name: u.name,
      phone: u.phone,
      role: u.role,
      salaryType: u.salary_type || 'COMBINED',
      baseSalary: Number(u.base_salary || 0),
      hourlyRate: Number(u.hourly_rate || 0),
      status: u.status || 'ACTIVE',
      joinedDate: u.joined_date || '',
    }));

    const shifts: ShiftRecord[] = (sRes.data || []).map((s: any) => ({
      id: s.id,
      userId: s.user_id,
      userName: s.user_name || undefined,
      userPhone: s.user_phone || undefined,
      userRole: s.user_role || undefined,
      date: s.date,
      shiftType: s.shift_type,
      hoursWorked: Number(s.hours_worked || 0),
      checkIn: s.check_in || undefined,
      checkOut: s.check_out || undefined,
      status: s.status || 'ATTENDED',
    }));

    const payrolls: PayrollRecord[] = (prRes.data || []).map((pr: any) => ({
      id: pr.id,
      userId: pr.user_id,
      userName: pr.user_name || pr.user_id,
      userPhone: pr.user_phone || undefined,
      userRole: pr.user_role || 'SERVER',
      salaryType: pr.salary_type || 'COMBINED',
      month: pr.month,
      totalHours: Number(pr.total_hours || 0),
      totalShifts: Number(pr.total_shifts || 0),
      baseSalary: Number(pr.base_salary || 0),
      hourlyRate: Number(pr.hourly_rate || 0),
      hourlyPay: Number(pr.hourly_pay || 0),
      bonus: Number(pr.bonus || 0),
      bonusReason: pr.bonus_reason || undefined,
      deduction: Number(pr.deduction || 0),
      deductionReason: pr.deduction_reason || undefined,
      netSalary: Number(pr.net_salary || 0),
      status: pr.status || 'DRAFT',
      paidDate: pr.paid_date || undefined,
    }));

    const orders: Order[] = (oRes.data || []).map((o: any) => {
      const items = typeof o.items === 'string' ? JSON.parse(o.items) : o.items || [];
      const subtotal = items.reduce((sum: number, it: any) => sum + (it.unitPrice || 0) * (it.quantity || 1), 0);
      const totalAmount = Number(o.total_amount || subtotal);
      const discountPercent = Number(o.discount_percent || 0);
      const discountAmount = Math.round((subtotal * discountPercent) / 100);
      const shippingFee = Number(o.shipping_fee || 0);

      return {
        id: o.id,
        orderCode: `#KAME-${o.id.slice(-6).toUpperCase()}`,
        tableId: o.table_id,
        tableName: o.table_name || o.table_id,
        zone: 'Khu vực chung',
        orderType: o.order_type || 'DINE_IN',
        serverName: 'Thu ngân KAME',
        serverId: 'u-1',
        guestCount: Number(o.guest_count || 1),
        status: o.status,
        items,
        subtotal,
        discountPercent,
        discountAmount,
        taxAmount: 0,
        totalAmount,
        finalTotal: Number(o.final_total || totalAmount),
        paymentMethod: o.payment_method || undefined,
        cashAmountPaid: Number(o.cash_amount_paid || 0),
        transferAmountPaid: Number(o.transfer_amount_paid || 0),
        shippingFee,
        deliveryAddress: o.delivery_address || undefined,
        deliveryPhone: o.customer_phone || undefined,
        customerPhone: o.customer_phone || undefined,
        customerNote: o.customer_name || undefined,
        createdAt: o.created_at || '',
        updatedAt: o.created_at || '',
        paidAt: o.paid_at || undefined,
      };
    });

    let settings: StoreSettings | undefined = undefined;
    if (setRes.data) {
      settings = {
        storeName: setRes.data.store_name || 'KAME TEA & FOOD',
        slogan: 'Ốc, Ăn Vặt & Trà Sữa Chuẩn Vị',
        address: setRes.data.address || '123 Đường Ốc Ngon, Quận Bình Thạnh, TP.HCM',
        phone: setRes.data.phone || '0901234567',
        ownerName: 'Chủ Quán KAME',
        bankName: setRes.data.bank_name || 'Sacombank',
        bankAccount: setRes.data.bank_account || '060123456789',
        accountHolder: setRes.data.account_holder || 'NGUYEN VAN A',
        qrTemplate: 'compact2',
        receiptFooter: setRes.data.receipt_footer || 'Cảm ơn quý khách & Hẹn gặp lại!',
        taxPercent: Number(setRes.data.tax_percent || 0),
        printerPaperSize: '80mm',
        soundEnabled: true,
        useSacombankQR: true,
        defaultShippingFee: 0,
      };
    }

    return {
      success: true,
      data: { categories, products, users, shifts, payrolls, orders, settings },
      message: `Đã tải về thành công ${products.length} món, ${categories.length} danh mục, ${users.length} nhân viên từ Supabase.`,
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Lỗi tải dữ liệu từ Supabase: ${err?.message || 'Không xác định'}`,
    };
  }
};

/**
 * Generic Upsert Helper with Server-first and Client-fallback execution
 */
export const dbUpsert = async (table: string, rows: any | any[], conflict = 'id'): Promise<{ success: boolean; data?: any; error?: string }> => {
  // 1. Try Server API Proxy
  try {
    const res = await fetch('/api/supabase/upsert', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ table, rows, conflict }),
    });
    if (res.ok) {
      const json = await res.json();
      if (json.success) return { success: true, data: json.data };
    }
  } catch {
    // Fallback to client SDK
  }

  // 2. Direct client fallback
  try {
    const client = getSupabaseClient();
    if (!client) return { success: false, error: 'Chưa khởi tạo client Supabase' };
    const { data, error } = await client.from(table).upsert(rows, { onConflict: conflict }).select();
    if (error) return { success: false, error: error.message };
    return { success: true, data };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Lỗi thao tác dữ liệu' };
  }
};

/**
 * Generic Update Helper with Server-first and Client-fallback execution
 */
export const dbUpdate = async (
  table: string,
  values: any,
  matchColumn = 'id',
  matchValue?: any
): Promise<{ success: boolean; data?: any; error?: string }> => {
  // 1. Try Server API Proxy
  try {
    const res = await fetch('/api/supabase/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ table, values, column: matchColumn, id: matchValue }),
    });
    if (res.ok) {
      const json = await res.json();
      if (json.success) return { success: true, data: json.data };
    }
  } catch {
    // Fallback to client SDK
  }

  // 2. Direct client fallback
  try {
    const client = getSupabaseClient();
    if (!client) return { success: false, error: 'Chưa khởi tạo client Supabase' };
    const { data, error } = await client.from(table).update(values).eq(matchColumn, matchValue).select();
    if (error) return { success: false, error: error.message };
    return { success: true, data };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Lỗi cập nhật dữ liệu' };
  }
};

/**
 * Generic Delete Helper with Server-first and Client-fallback execution
 */
export const dbDelete = async (table: string, id: string, column = 'id'): Promise<{ success: boolean; error?: string }> => {
  // 1. Try Server API Proxy
  try {
    const res = await fetch('/api/supabase/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ table, id, column }),
    });
    if (res.ok) {
      const json = await res.json();
      if (json.success) return { success: true };
    }
  } catch {
    // Fallback to client SDK
  }

  // 2. Direct client fallback
  try {
    const client = getSupabaseClient();
    if (!client) return { success: false, error: 'Chưa khởi tạo client Supabase' };
    const { error } = await client.from(table).delete().eq(column, id);
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Lỗi xóa dữ liệu' };
  }
};

/**
 * Sales Archival and Data Compression Engine
 * Summarizes old orders into daily_sales_summary and prunes historical raw order records to conserve Supabase quota.
 */
export const compressSalesData = async (options: {
  cutoffMonths?: number;
  cutoffDate?: string;
  specificMonth?: string;
}): Promise<{
  success: boolean;
  message: string;
  compressedOrdersCount?: number;
  daysSummarized?: number;
  totalRevenuePreserved?: number;
  summaries?: any[];
}> => {
  try {
    const res = await fetch('/api/supabase/compress-sales', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(options),
    });
    if (res.ok) {
      const json = await res.json();
      return json;
    }
    const errJson = await res.json().catch(() => ({}));
    return {
      success: false,
      message: errJson.message || `Lỗi máy chủ (${res.status})`,
    };
  } catch (err: any) {
    return {
      success: false,
      message: err?.message || 'Không thể kết nối máy chủ nén dữ liệu.',
    };
  }
};

/**
 * SQL Schema migration script for Supabase SQL Editor
 */
export const SUPABASE_SQL_SCHEMA = `-- SCHEMA CHO HỆ THỐNG KAME POS TRÊN SUPABASE
-- Bấm 'New query' trong Supabase Dashboard -> SQL Editor và dán đoạn mã này rồi bấm Run

-- 1. Bảng nhân viên (Users / Staff)
CREATE TABLE IF NOT EXISTS pos_users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'SERVER',
  salary_type TEXT NOT NULL DEFAULT 'COMBINED',
  base_salary NUMERIC DEFAULT 0,
  hourly_rate NUMERIC DEFAULT 0,
  hourly_pay NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'ACTIVE',
  joined_date TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Bảng ca làm & chấm công (Shifts)
CREATE TABLE IF NOT EXISTS pos_shifts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  user_name TEXT,
  user_phone TEXT,
  user_role TEXT,
  date TEXT NOT NULL,
  shift_type TEXT NOT NULL,
  hours_worked NUMERIC NOT NULL DEFAULT 0,
  check_in TEXT,
  check_out TEXT,
  status TEXT DEFAULT 'ATTENDED',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Bảng quyết toán lương tháng (Payrolls)
CREATE TABLE IF NOT EXISTS pos_payrolls (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  user_phone TEXT,
  user_role TEXT,
  salary_type TEXT DEFAULT 'COMBINED',
  month TEXT NOT NULL,
  total_hours NUMERIC DEFAULT 0,
  total_shifts NUMERIC DEFAULT 0,
  base_salary NUMERIC DEFAULT 0,
  hourly_rate NUMERIC DEFAULT 0,
  hourly_pay NUMERIC DEFAULT 0,
  bonus NUMERIC DEFAULT 0,
  bonus_reason TEXT,
  deduction NUMERIC DEFAULT 0,
  deduction_reason TEXT,
  net_salary NUMERIC NOT NULL,
  status TEXT DEFAULT 'DRAFT',
  paid_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Bảng danh mục món (Categories)
CREATE TABLE IF NOT EXISTS pos_categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  station TEXT NOT NULL DEFAULT 'BAR',
  icon TEXT,
  sort_order NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Bảng món ăn & đồ uống (Products)
CREATE TABLE IF NOT EXISTS pos_products (
  id TEXT PRIMARY KEY,
  category_id TEXT NOT NULL,
  name TEXT NOT NULL,
  price NUMERIC NOT NULL,
  station TEXT NOT NULL DEFAULT 'BAR',
  unit TEXT NOT NULL DEFAULT 'phần',
  is_available BOOLEAN DEFAULT TRUE,
  is_popular BOOLEAN DEFAULT FALSE,
  allowed_toppings BOOLEAN DEFAULT FALSE,
  sizes JSONB,
  cooking_methods JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Bảng đơn hàng (Orders)
CREATE TABLE IF NOT EXISTS pos_orders (
  id TEXT PRIMARY KEY,
  table_id TEXT NOT NULL,
  table_name TEXT,
  order_type TEXT DEFAULT 'DINE_IN',
  status TEXT NOT NULL,
  payment_method TEXT,
  total_amount NUMERIC NOT NULL,
  final_total NUMERIC NOT NULL,
  discount_percent NUMERIC DEFAULT 0,
  tax_percent NUMERIC DEFAULT 0,
  shipping_fee NUMERIC DEFAULT 0,
  cash_amount_paid NUMERIC DEFAULT 0,
  transfer_amount_paid NUMERIC DEFAULT 0,
  guest_count NUMERIC DEFAULT 1,
  customer_name TEXT,
  customer_phone TEXT,
  delivery_address TEXT,
  items JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  paid_at TIMESTAMPTZ
);

-- 7. Bảng cài đặt quán (Settings)
CREATE TABLE IF NOT EXISTS pos_settings (
  id TEXT PRIMARY KEY DEFAULT 'current_store',
  store_name TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  bank_name TEXT,
  bank_account TEXT,
  account_holder TEXT,
  tax_percent NUMERIC DEFAULT 0,
  receipt_footer TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Bảng tổng hợp nén doanh thu ngày (Daily Sales Summary - Tiết kiệm dung lượng 500MB)
CREATE TABLE IF NOT EXISTS pos_daily_sales_summary (
  id TEXT PRIMARY KEY, -- Định dạng: YYYY-MM-DD
  date TEXT NOT NULL UNIQUE,
  month TEXT NOT NULL,
  total_revenue NUMERIC NOT NULL DEFAULT 0,
  total_cost NUMERIC NOT NULL DEFAULT 0,
  total_discount NUMERIC NOT NULL DEFAULT 0,
  total_orders NUMERIC NOT NULL DEFAULT 0,
  cash_revenue NUMERIC DEFAULT 0,
  transfer_revenue NUMERIC DEFAULT 0,
  shipping_revenue NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================================================
-- MỞ KHÓA TOÀN BỘ QUYỀN TRUY CẬP (RLS PERMISSIVE POLICIES & DISABLE RLS)
-- Cho phép cả Anon Key & Service Key đều đọc/ghi thoải mái mà không bị chặn
-- =========================================================================
ALTER TABLE IF EXISTS pos_users DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS pos_shifts DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS pos_payrolls DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS pos_categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS pos_products DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS pos_orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS pos_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS pos_daily_sales_summary DISABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  DROP POLICY IF EXISTS "pos_users_all" ON pos_users;
  CREATE POLICY "pos_users_all" ON pos_users FOR ALL USING (true) WITH CHECK (true);

  DROP POLICY IF EXISTS "pos_shifts_all" ON pos_shifts;
  CREATE POLICY "pos_shifts_all" ON pos_shifts FOR ALL USING (true) WITH CHECK (true);

  DROP POLICY IF EXISTS "pos_payrolls_all" ON pos_payrolls;
  CREATE POLICY "pos_payrolls_all" ON pos_payrolls FOR ALL USING (true) WITH CHECK (true);

  DROP POLICY IF EXISTS "pos_categories_all" ON pos_categories;
  CREATE POLICY "pos_categories_all" ON pos_categories FOR ALL USING (true) WITH CHECK (true);

  DROP POLICY IF EXISTS "pos_products_all" ON pos_products;
  CREATE POLICY "pos_products_all" ON pos_products FOR ALL USING (true) WITH CHECK (true);

  DROP POLICY IF EXISTS "pos_orders_all" ON pos_orders;
  CREATE POLICY "pos_orders_all" ON pos_orders FOR ALL USING (true) WITH CHECK (true);

  DROP POLICY IF EXISTS "pos_settings_all" ON pos_settings;
  CREATE POLICY "pos_settings_all" ON pos_settings FOR ALL USING (true) WITH CHECK (true);

  DROP POLICY IF EXISTS "pos_daily_sales_all" ON pos_daily_sales_summary;
  CREATE POLICY "pos_daily_sales_all" ON pos_daily_sales_summary FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;
`;
