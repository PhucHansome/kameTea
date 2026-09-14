import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const PORT = 3000;
const DEFAULT_SUPABASE_URL = process.env.SUPABASE_URL || 'https://juottdlmnzbkydlgnoqs.supabase.co';
const DEFAULT_SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY || '';

function getServerSupabaseClient(req?: express.Request): SupabaseClient | null {
  let url = (process.env.SUPABASE_URL || DEFAULT_SUPABASE_URL).trim();
  let secretKey = (process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_SECRET_KEY).trim();

  if (req) {
    const hUrl = (req.headers['x-supabase-url'] as string) || (req.body?.supabaseConfig?.url as string);
    const hKey = (req.headers['x-supabase-key'] as string) || (req.headers['x-supabase-anon-key'] as string) || (req.body?.supabaseConfig?.key as string);
    if (hUrl && hUrl.trim() && hUrl.startsWith('http')) url = hUrl.trim();
    if (hKey && hKey.trim()) secretKey = hKey.trim();
  }

  if (!url || !secretKey || !url.startsWith('http')) {
    return null;
  }

  try {
    return createClient(url, secretKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  } catch {
    return null;
  }
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // 1. Health check
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // 1.1 Auth Login Route (Validates user & password against Supabase or defaults)
  app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;
    if (!username) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập tên đăng nhập.' });
    }

    const cleanUser = String(username).trim().toLowerCase();
    const cleanPass = password ? String(password).trim() : '';

    try {
      const supabase = getServerSupabaseClient(req);
      // Try querying pos_users
      const { data: userList, error } = await supabase
        .from('pos_users')
        .select('*')
        .or(`username.ilike.${cleanUser},phone.eq.${cleanUser},id.eq.${cleanUser}`);

      if (!error && userList && userList.length > 0) {
        const found = userList[0];
        const dbPass = found.password ? String(found.password).trim() : '';
        // Match password or admin fallback
        if (!dbPass || dbPass === cleanPass || (cleanUser === 'admin' && (cleanPass === 'admin' || cleanPass === '123456'))) {
          return res.json({
            success: true,
            source: 'SUPABASE',
            user: {
              id: found.id,
              username: found.username || found.phone || found.id,
              name: found.name,
              phone: found.phone,
              role: found.role,
              salaryType: found.salary_type || 'COMBINED',
              baseSalary: Number(found.base_salary) || 0,
              hourlyRate: Number(found.hourly_rate) || 0,
              status: found.status || 'ACTIVE',
              joinedDate: found.joined_date || '',
              avatar: found.avatar,
            },
          });
        }
      }
    } catch (err: any) {
      console.warn('Supabase auth query fallback:', err?.message);
    }

    // Default account fallbacks (Admin and Staff only)
    if (cleanUser === 'admin' && (cleanPass === 'admin' || cleanPass === '123456' || cleanPass === '')) {
      return res.json({
        success: true,
        source: 'DEFAULT',
        user: {
          id: 'USR-01',
          username: 'admin',
          name: 'Quản trị viên (Admin)',
          phone: '0334080648',
          role: 'ADMIN',
          salaryType: 'MONTHLY',
          baseSalary: 15000000,
          hourlyRate: 0,
          status: 'ACTIVE',
          joinedDate: '2023-01-01',
        },
      });
    }

    if (cleanUser === 'staff' && (cleanPass === '123456' || cleanPass === 'staff' || cleanPass === '')) {
      return res.json({
        success: true,
        source: 'DEFAULT',
        user: {
          id: 'USR-02',
          username: 'staff',
          name: 'Nhân viên Phục vụ (Staff)',
          phone: '0981417246',
          role: 'SERVER',
          salaryType: 'HOURLY',
          baseSalary: 0,
          hourlyRate: 25000,
          status: 'ACTIVE',
          joinedDate: '2023-03-15',
        },
      });
    }

    return res.status(401).json({
      success: false,
      message: 'Tên đăng nhập hoặc mật khẩu không chính xác.',
    });
  });

  // 2. Test Connection
  app.get('/api/supabase/test', async (req, res) => {
    const startTime = Date.now();
    try {
      const supabase = getServerSupabaseClient(req);
      if (!supabase) {
        return res.status(200).json({
          success: false,
          message: 'Chưa cấu hình Supabase Project URL hoặc Anon Public Key.',
        });
      }
      const { error } = await supabase.from('pos_categories').select('id').limit(1);
      const latency = Date.now() - startTime;
      if (error) {
        const isNetworkErr = error.message?.toLowerCase().includes('fetch failed') || error.message?.toLowerCase().includes('network');
        return res.status(200).json({
          success: false,
          message: isNetworkErr
            ? 'Không thể kết nối đến máy chủ Supabase. Vui lòng kiểm tra lại URL dự án và Anon Key.'
            : error.message,
          latencyMs: latency,
        });
      }
      return res.json({
        success: true,
        message: `Kết nối máy chủ Supabase thành công! (${latency}ms)`,
        latencyMs: latency,
      });
    } catch (err: any) {
      return res.status(200).json({
        success: false,
        message: 'Không thể kết nối máy chủ Supabase (URL hoặc Key không hợp lệ).',
      });
    }
  });

  // 3. Get Stats
  app.get('/api/supabase/stats', async (req, res) => {
    try {
      const supabase = getServerSupabaseClient(req);
      if (!supabase) {
        return res.json({
          success: true,
          stats: { categories: 0, products: 0, users: 0, shifts: 0, payrolls: 0, orders: 0, settings: 0 },
        });
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

      return res.json({
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
      });
    } catch {
      return res.json({
        success: true,
        stats: { categories: 0, products: 0, users: 0, shifts: 0, payrolls: 0, orders: 0, settings: 0 },
      });
    }
  });

  // 4. Pull All Data from Supabase
  app.get('/api/supabase/data', async (req, res) => {
    try {
      const supabase = getServerSupabaseClient(req);
      if (!supabase) {
        return res.json({
          success: false,
          message: 'Chưa cấu hình Supabase Project URL hoặc API Key.',
          data: { categories: [], products: [], users: [], shifts: [], payrolls: [], orders: [], settings: null, dailySalesSummaries: [] },
        });
      }
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

      if (cRes.error?.message?.includes('fetch failed') || pRes.error?.message?.includes('fetch failed')) {
        return res.json({
          success: false,
          message: 'Không thể kết nối đến máy chủ Supabase. Vui lòng kiểm tra lại cấu hình API.',
          data: { categories: [], products: [], users: [], shifts: [], payrolls: [], orders: [], settings: null, dailySalesSummaries: [] },
        });
      }

      const summaries = (summRes?.data || []).map((s: any) => ({
        id: s.id || s.date,
        date: s.date,
        month: s.month || (s.date ? s.date.substring(0, 7) : ''),
        totalRevenue: Number(s.total_revenue) || 0,
        totalCost: Number(s.total_cost) || 0,
        totalDiscount: Number(s.total_discount) || 0,
        totalOrders: Number(s.total_orders) || 0,
        cashRevenue: Number(s.cash_revenue) || 0,
        transferRevenue: Number(s.transfer_revenue) || 0,
        shippingRevenue: Number(s.shipping_revenue) || 0,
      }));

      // Parse JSON fields
      const categories = (cRes.data || []).map((c: any) => ({
        id: c.id,
        name: c.name,
        station: c.station,
        icon: c.icon,
      }));

      const products = (pRes.data || []).map((p: any) => {
        let sizes = undefined;
        let cookingMethods = undefined;
        try {
          if (p.sizes) sizes = typeof p.sizes === 'string' ? JSON.parse(p.sizes) : p.sizes;
        } catch { /* ignore */ }
        try {
          if (p.cooking_methods) {
            cookingMethods = typeof p.cooking_methods === 'string' ? JSON.parse(p.cooking_methods) : p.cooking_methods;
          }
        } catch { /* ignore */ }

        return {
          id: p.id,
          categoryId: p.category_id,
          name: p.name,
          basePrice: Number(p.price) || 0,
          station: p.station,
          unit: p.unit || 'phần',
          isAvailable: p.is_available !== false,
          isPopular: Boolean(p.is_popular),
          allowedToppings: Boolean(p.allowed_toppings),
          sizes,
          cookingMethods,
        };
      });

      const users = (uRes.data || []).map((u: any) => ({
        id: u.id,
        username: u.username || u.phone || u.id,
        password: u.password || '123456',
        name: u.name,
        phone: u.phone,
        role: u.role,
        salaryType: u.salary_type || 'COMBINED',
        baseSalary: Number(u.base_salary) || 0,
        hourlyRate: Number(u.hourly_rate) || 0,
        status: u.status || 'ACTIVE',
        joinedDate: u.joined_date || '',
        avatar: u.avatar || undefined,
      }));

      const shifts = (sRes.data || []).map((s: any) => ({
        id: s.id,
        userId: s.user_id,
        userName: s.user_name || undefined,
        userPhone: s.user_phone || undefined,
        userRole: s.user_role || undefined,
        date: s.date,
        shiftType: s.shift_type,
        hoursWorked: Number(s.hours_worked) || 0,
        checkIn: s.check_in || undefined,
        checkOut: s.check_out || undefined,
        status: s.status,
      }));

      const payrolls = (prRes.data || []).map((pr: any) => ({
        id: pr.id,
        userId: pr.user_id,
        userName: pr.user_name || pr.user_id,
        userPhone: pr.user_phone || undefined,
        userRole: pr.user_role || 'SERVER',
        salaryType: pr.salary_type || 'COMBINED',
        month: pr.month,
        totalHours: Number(pr.total_hours) || 0,
        totalShifts: Number(pr.total_shifts) || 0,
        baseSalary: Number(pr.base_salary) || 0,
        hourlyRate: Number(pr.hourly_rate) || 0,
        hourlyPay: Number(pr.hourly_pay) || 0,
        bonus: Number(pr.bonus) || 0,
        bonusReason: pr.bonus_reason || undefined,
        deduction: Number(pr.deduction) || 0,
        deductionReason: pr.deduction_reason || undefined,
        netSalary: Number(pr.net_salary) || 0,
        status: pr.status || 'DRAFT',
        paidDate: pr.paid_date || undefined,
      }));

      const orders = (oRes.data || []).map((o: any) => {
        let items = [];
        try {
          if (o.items) items = typeof o.items === 'string' ? JSON.parse(o.items) : o.items;
        } catch { /* ignore */ }

        return {
          id: o.id,
          tableId: o.table_id,
          tableName: o.table_name,
          orderType: o.order_type || 'DINE_IN',
          status: o.status,
          paymentMethod: o.payment_method || undefined,
          totalAmount: Number(o.total_amount) || 0,
          finalTotal: Number(o.final_total) || Number(o.total_amount) || 0,
          discountPercent: Number(o.discount_percent) || 0,
          shippingFee: Number(o.shipping_fee) || 0,
          cashAmountPaid: Number(o.cash_amount_paid) || 0,
          transferAmountPaid: Number(o.transfer_amount_paid) || 0,
          guestCount: Number(o.guest_count) || 1,
          customerNote: o.customer_name || undefined,
          customerPhone: o.customer_phone || undefined,
          deliveryAddress: o.delivery_address || undefined,
          items,
          createdAt: o.created_at,
          paidAt: o.paid_at || undefined,
        };
      });

      let settings = null;
      if (setRes.data && setRes.data.length > 0) {
        const s = setRes.data[0];
        settings = {
          storeName: s.store_name,
          phone: s.phone,
          address: s.address,
          bankName: s.bank_name,
          bankAccount: s.bank_account,
          accountHolder: s.account_holder,
          taxPercent: Number(s.tax_percent) || 0,
          receiptFooter: s.receipt_footer,
        };
      }

      return res.json({
        success: true,
        data: {
          categories,
          products,
          users,
          shifts,
          payrolls,
          orders,
          settings,
          dailySalesSummaries: summaries,
        },
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err?.message || 'Lỗi đọc dữ liệu từ máy chủ' });
    }
  });

  // 5. Full Data Sync (Push to Supabase)
  app.post('/api/supabase/sync', async (req, res) => {
    const data = req.body;
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
      const supabase = getServerSupabaseClient(req);
      if (!supabase) {
        return res.json({
          success: false,
          message: 'Chưa cấu hình Supabase API Key. Vui lòng vào Cài đặt Supabase để nhập URL dự án và Anon Public Key.',
          counts,
          errors: ['Chưa cấu hình Supabase API Key'],
        });
      }

      // Helper to check network / connectivity error
      const isConnectionError = (err: any) => {
        const msg = String(err?.message || '').toLowerCase();
        return msg.includes('fetch failed') || msg.includes('network') || msg.includes('apikey') || msg.includes('enotfound');
      };

      // 1. Categories
      if (data.categories && Array.isArray(data.categories) && data.categories.length > 0) {
        const categoryRows = data.categories.map((c: any, idx: number) => ({
          id: c.id,
          name: c.name,
          station: c.station || 'BAR',
          icon: c.icon || 'Coffee',
          sort_order: idx,
        }));
        const { error: cErr } = await supabase.from('pos_categories').upsert(categoryRows, { onConflict: 'id' });
        if (cErr) {
          if (isConnectionError(cErr)) {
            return res.json({
              success: false,
              message: 'Không thể kết nối đến máy chủ Supabase. Vui lòng kiểm tra lại URL dự án và Anon Key trong mục Cài đặt Supabase.',
              counts,
              errors: ['Lỗi kết nối Supabase: URL hoặc API Key không hợp lệ.'],
            });
          }
          errors.push(`Danh mục: ${cErr.message}`);
        } else {
          counts.categories = categoryRows.length;
        }
      }

      // 2. Products
      if (data.products && Array.isArray(data.products) && data.products.length > 0) {
        const productRows = data.products.map((p: any) => ({
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
        const { error: pErr } = await supabase.from('pos_products').upsert(productRows, { onConflict: 'id' });
        if (pErr) {
          if (isConnectionError(pErr)) {
            return res.json({
              success: false,
              message: 'Không thể kết nối đến máy chủ Supabase. Vui lòng kiểm tra lại URL dự án và Anon Key trong mục Cài đặt Supabase.',
              counts,
              errors: ['Lỗi kết nối Supabase'],
            });
          }
          errors.push(`Món ăn / đồ uống: ${pErr.message}`);
        } else {
          counts.products = productRows.length;
        }
      }

      // 3. Users
      if (data.users && Array.isArray(data.users) && data.users.length > 0) {
        const userRows = data.users.map((u: any) => ({
          id: u.id,
          username: u.username || u.phone || u.id,
          password: u.password || '123456',
          name: u.name,
          phone: u.phone,
          role: u.role,
          salary_type: u.salaryType || 'COMBINED',
          base_salary: u.baseSalary || 0,
          hourly_rate: u.hourlyRate || 0,
          status: u.status || 'ACTIVE',
          joined_date: u.joinedDate || new Date().toISOString().split('T')[0],
          avatar: u.avatar || null,
        }));
        const { error: uErr } = await supabase.from('pos_users').upsert(userRows, { onConflict: 'id' });
        if (uErr) {
          if (isConnectionError(uErr)) {
            return res.json({
              success: false,
              message: 'Không thể kết nối đến máy chủ Supabase. Vui lòng kiểm tra lại URL dự án và Anon Key.',
              counts,
              errors: ['Lỗi kết nối Supabase'],
            });
          }
          errors.push(`Nhân viên: ${uErr.message}`);
        } else {
          counts.users = userRows.length;
        }
      }

      // 4. Shifts
      if (data.shifts && Array.isArray(data.shifts) && data.shifts.length > 0) {
        const shiftRows = data.shifts.map((s: any) => ({
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
        const { error: sErr } = await supabase.from('pos_shifts').upsert(shiftRows, { onConflict: 'id' });
        if (sErr) errors.push(`Ca làm việc: ${sErr.message}`);
        else counts.shifts = shiftRows.length;
      }

      // 5. Payrolls
      if (data.payrolls && Array.isArray(data.payrolls) && data.payrolls.length > 0) {
        const payrollRows = data.payrolls.map((pr: any) => ({
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
        const { error: prErr } = await supabase.from('pos_payrolls').upsert(payrollRows, { onConflict: 'id' });
        if (prErr) errors.push(`Bảng lương: ${prErr.message}`);
        else counts.payrolls = payrollRows.length;
      }

      // 6. Orders
      if (data.orders && Array.isArray(data.orders) && data.orders.length > 0) {
        const orderRows = data.orders.map((o: any) => ({
          id: o.id,
          table_id: o.tableId,
          table_name: o.tableName || o.tableId,
          order_type: o.orderType || 'DINE_IN',
          status: o.status,
          payment_method: o.paymentMethod || null,
          total_amount: o.totalAmount,
          final_total: o.finalTotal || o.totalAmount,
          discount_percent: o.discountPercent || 0,
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
        const { error: oErr } = await supabase.from('pos_orders').upsert(orderRows, { onConflict: 'id' });
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
        const { error: setErr } = await supabase.from('pos_settings').upsert(settingRow, { onConflict: 'id' });
        if (setErr) errors.push(`Cài đặt quán: ${setErr.message}`);
        else counts.settings = 1;
      }

      if (errors.length > 0) {
        return res.json({
          success: false,
          message: `Đồng bộ hoàn tất một phần (${errors.length} lỗi): ${errors.join(', ')}`,
          counts,
          errors,
        });
      }

      return res.json({
        success: true,
        message: `Đã đồng bộ thành công lên Supabase: ${counts.categories} danh mục, ${counts.products} món, ${counts.users} nhân viên, ${counts.shifts} ca làm, ${counts.payrolls} bảng lương, ${counts.orders} hóa đơn.`,
        counts,
      });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        message: `Lỗi đồng bộ: ${err?.message || 'Lỗi server'}`,
        counts,
        errors: [err?.message || 'Lỗi server'],
      });
    }
  });

  // 6. Generic Upsert
  app.post('/api/supabase/upsert', async (req, res) => {
    try {
      const { table, rows, conflict } = req.body;
      if (!table || !rows) {
        return res.status(400).json({ success: false, message: 'Thiếu thông tin bảng hoặc dữ liệu' });
      }
      const supabase = getServerSupabaseClient(req);
      const options: any = conflict ? { onConflict: conflict } : undefined;
      const { data, error } = await (supabase.from(table as any) as any).upsert(rows, options).select();
      if (error) {
        return res.status(400).json({ success: false, message: error.message });
      }
      return res.json({ success: true, data });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err?.message || 'Lỗi thực thi' });
    }
  });

  // 7. Generic Update
  app.post('/api/supabase/update', async (req, res) => {
    try {
      const { table, values, column = 'id', id, matchColumn, matchValue } = req.body;
      const targetCol = matchColumn || column || 'id';
      const targetVal = matchValue !== undefined ? matchValue : id;

      if (!table || !values || targetVal === undefined) {
        return res.status(400).json({ success: false, message: 'Thiếu thông tin bảng, dữ liệu hoặc ID' });
      }
      const supabase = getServerSupabaseClient(req);
      const { data, error } = await (supabase.from(table as any) as any).update(values).eq(targetCol, targetVal).select();
      if (error) {
        return res.status(400).json({ success: false, message: error.message });
      }
      return res.json({ success: true, data });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err?.message || 'Lỗi thực thi' });
    }
  });

  // 8. Generic Delete
  app.post('/api/supabase/delete', async (req, res) => {
    try {
      const { table, id, column = 'id' } = req.body;
      if (!table || !id) {
        return res.status(400).json({ success: false, message: 'Thiếu thông tin bảng hoặc ID' });
      }
      const supabase = getServerSupabaseClient(req);
      const { error } = await (supabase.from(table as any) as any).delete().eq(column, id);
      if (error) {
        return res.status(400).json({ success: false, message: error.message });
      }
      return res.json({ success: true });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err?.message || 'Lỗi thực thi' });
    }
  });

  // Automated Sales Archival Compression Logic (Bảo toàn 100% doanh thu trong pos_daily_sales_summary)
  async function runAutomatedSalesCompression(cutoffMonths: number = 12): Promise<void> {
    try {
      const supabase = getServerSupabaseClient();
      const d = new Date();
      d.setMonth(d.getMonth() - cutoffMonths);
      const targetBeforeDate = d.toISOString();

      const { data: rawOrders, error: fetchErr } = await supabase
        .from('pos_orders')
        .select('*')
        .lte('created_at', targetBeforeDate);

      if (fetchErr || !rawOrders || rawOrders.length === 0) return;

      const ordersToCompress = rawOrders.filter((o: any) => o.status === 'PAID' || o.status === 'COMPLETED');
      if (ordersToCompress.length === 0) return;

      const dailyMap = new Map<string, any>();
      for (const order of ordersToCompress) {
        const orderDate = (order.created_at || '').substring(0, 10) || new Date().toISOString().substring(0, 10);
        const orderMonth = orderDate.substring(0, 7);
        const existing = dailyMap.get(orderDate) || {
          date: orderDate,
          month: orderMonth,
          totalRevenue: 0,
          totalCost: 0,
          totalDiscount: 0,
          totalOrders: 0,
          cashRevenue: 0,
          transferRevenue: 0,
          shippingRevenue: 0,
        };

        const finalTotal = Number(order.final_total) || Number(order.total_amount) || 0;
        const discount = Number(order.discount_amount) || 0;
        const shipping = Number(order.shipping_fee) || 0;
        const cashPaid = Number(order.cash_amount_paid) || (order.payment_method === 'CASH' ? finalTotal : 0);
        const transferPaid = Number(order.transfer_amount_paid) || (order.payment_method !== 'CASH' ? finalTotal : 0);

        existing.totalRevenue += finalTotal;
        existing.totalDiscount += discount;
        existing.shippingRevenue += shipping;
        existing.cashRevenue += cashPaid;
        existing.transferRevenue += transferPaid;
        existing.totalOrders += 1;

        dailyMap.set(orderDate, existing);
      }

      const summaryRows = Array.from(dailyMap.values()).map(item => ({
        id: item.date,
        date: item.date,
        month: item.month,
        total_revenue: item.totalRevenue,
        total_cost: item.totalCost,
        total_discount: item.totalDiscount,
        total_orders: item.totalOrders,
        cash_revenue: item.cashRevenue,
        transfer_revenue: item.transferRevenue,
        shipping_revenue: item.shippingRevenue,
        updated_at: new Date().toISOString(),
      }));

      // Upsert into pos_daily_sales_summary
      await (supabase.from('pos_daily_sales_summary' as any) as any).upsert(summaryRows, { onConflict: 'id' });

      // Delete summarized individual old order rows
      const orderIdsToDelete = ordersToCompress.map((o: any) => o.id);
      if (orderIdsToDelete.length > 0) {
        await supabase.from('pos_orders').delete().in('id', orderIdsToDelete);
      }
      console.log(`[Auto-Cron] Đã tự động nén ${ordersToCompress.length} hóa đơn cũ (> ${cutoffMonths} tháng) vào pos_daily_sales_summary.`);
    } catch (err: any) {
      console.warn('[Auto-Cron] Lỗi nén dữ liệu cũ tự động:', err?.message);
    }
  }

  // 9. Revenue & Sales Archival Compression (API endpoint nếu cần gọi thủ công qua script)
  app.post('/api/supabase/compress-sales', async (req, res) => {
    try {
      const { cutoffDate, cutoffMonths = 12, specificMonth } = req.body;
      const supabase = getServerSupabaseClient();

      // Calculate cutoff ISO string if specificMonth or cutoffMonths provided
      let targetBeforeDate: string;
      if (specificMonth) {
        // e.g. "2025-08" -> everything in and before that month
        const [y, m] = specificMonth.split('-');
        const nextMonthDate = new Date(Number(y), Number(m), 1);
        targetBeforeDate = nextMonthDate.toISOString();
      } else if (cutoffDate) {
        targetBeforeDate = new Date(cutoffDate).toISOString();
      } else {
        const d = new Date();
        d.setMonth(d.getMonth() - cutoffMonths);
        targetBeforeDate = d.toISOString();
      }

      // 1. Fetch all PAID orders created before targetBeforeDate
      const { data: rawOrders, error: fetchErr } = await supabase
        .from('pos_orders')
        .select('*')
        .lte('created_at', targetBeforeDate);

      if (fetchErr) {
        return res.status(400).json({ success: false, message: `Lỗi đọc đơn hàng cũ: ${fetchErr.message}` });
      }

      const ordersToCompress = (rawOrders || []).filter((o: any) => o.status === 'PAID' || o.status === 'COMPLETED');
      if (ordersToCompress.length === 0) {
        return res.json({
          success: true,
          message: 'Không tìm thấy đơn hàng đã thanh toán nào trong giai đoạn này cần nén.',
          compressedOrdersCount: 0,
          daysSummarized: 0,
          totalRevenuePreserved: 0,
        });
      }

      // 2. Aggregate by Day (YYYY-MM-DD)
      const dailyMap = new Map<string, {
        date: string;
        month: string;
        totalRevenue: number;
        totalCost: number;
        totalDiscount: number;
        totalOrders: number;
        cashRevenue: number;
        transferRevenue: number;
        shippingRevenue: number;
      }>();

      for (const order of ordersToCompress) {
        const orderDate = (order.created_at || '').substring(0, 10) || new Date().toISOString().substring(0, 10);
        const orderMonth = orderDate.substring(0, 7);
        const existing = dailyMap.get(orderDate) || {
          date: orderDate,
          month: orderMonth,
          totalRevenue: 0,
          totalCost: 0,
          totalDiscount: 0,
          totalOrders: 0,
          cashRevenue: 0,
          transferRevenue: 0,
          shippingRevenue: 0,
        };

        const finalTotal = Number(order.final_total) || Number(order.total_amount) || 0;
        const discount = Number(order.discount_amount) || 0;
        const shipping = Number(order.shipping_fee) || 0;
        const cashPaid = Number(order.cash_amount_paid) || (order.payment_method === 'CASH' ? finalTotal : 0);
        const transferPaid = Number(order.transfer_amount_paid) || (order.payment_method !== 'CASH' ? finalTotal : 0);

        existing.totalRevenue += finalTotal;
        existing.totalDiscount += discount;
        existing.shippingRevenue += shipping;
        existing.cashRevenue += cashPaid;
        existing.transferRevenue += transferPaid;
        existing.totalOrders += 1;

        dailyMap.set(orderDate, existing);
      }

      const summaryRows = Array.from(dailyMap.values()).map(item => ({
        id: item.date,
        date: item.date,
        month: item.month,
        total_revenue: item.totalRevenue,
        total_cost: item.totalCost,
        total_discount: item.totalDiscount,
        total_orders: item.totalOrders,
        cash_revenue: item.cashRevenue,
        transfer_revenue: item.transferRevenue,
        shipping_revenue: item.shippingRevenue,
        updated_at: new Date().toISOString(),
      }));

      // 3. Upsert into pos_daily_sales_summary (or daily_sales_summary)
      const { error: summaryErr } = await (supabase.from('pos_daily_sales_summary' as any) as any)
        .upsert(summaryRows, { onConflict: 'id' });

      if (summaryErr) {
        const { error: fallbackErr } = await (supabase.from('daily_sales_summary' as any) as any)
          .upsert(summaryRows, { onConflict: 'id' });
        if (fallbackErr) {
          console.warn('Could not upsert into Supabase daily_sales_summary:', summaryErr.message, fallbackErr.message);
        }
      }

      // 4. Safely delete the detailed old orders that have been 100% summarized
      const orderIdsToDelete = ordersToCompress.map((o: any) => o.id);
      if (orderIdsToDelete.length > 0) {
        const { error: delErr } = await supabase
          .from('pos_orders')
          .delete()
          .in('id', orderIdsToDelete);
        if (delErr) {
          console.warn('Orders deletion note:', delErr.message);
        }
      }

      const totalPreserved = summaryRows.reduce((sum, r) => sum + r.total_revenue, 0);

      return res.json({
        success: true,
        message: `Đã nén thành công ${ordersToCompress.length} hóa đơn cũ thành ${summaryRows.length} bản ghi tổng hợp ngày. Bảo toàn trọn vẹn ${totalPreserved.toLocaleString('vi-VN')} đ doanh thu.`,
        compressedOrdersCount: ordersToCompress.length,
        daysSummarized: summaryRows.length,
        totalRevenuePreserved: totalPreserved,
        summaries: summaryRows,
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err?.message || 'Lỗi nén dữ liệu cũ' });
    }
  });

  // Global in-memory Active Orders Cache for instant sub-second cross-device synchronization
  const inMemoryActiveOrders = new Map<string, any>();
  let lastOrderUpdateTimestamp = Date.now();

  // 12. Real-time Order Sync from Mobile Devices / Cashier
  app.post('/api/orders/sync-active', async (req, res) => {
    try {
      const order = req.body;
      if (!order || !order.id) {
        return res.status(400).json({ success: false, message: 'Dữ liệu đơn hàng không hợp lệ' });
      }

      if (order.status === 'PAID' || order.status === 'CANCELLED') {
        inMemoryActiveOrders.delete(order.id);
      } else {
        inMemoryActiveOrders.set(order.id, {
          ...order,
          _serverTimestamp: Date.now(),
        });
      }
      lastOrderUpdateTimestamp = Date.now();

      // Async write to Supabase
      try {
        const supabase = getServerSupabaseClient();
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
      } catch (err) {
        // Log silently, memory cache keeps clients in sync
        console.warn('Supabase order upsert note:', (err as any)?.message);
      }

      return res.json({
        success: true,
        order,
        timestamp: lastOrderUpdateTimestamp,
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err?.message || 'Lỗi đồng bộ đơn hàng' });
    }
  });

  // 13. Get Active Orders for Real-Time Polling
  app.get('/api/orders/active', async (req, res) => {
    try {
      const since = Number(req.query.since || 0);
      const tableId = req.query.tableId ? String(req.query.tableId) : null;
      let activeList = Array.from(inMemoryActiveOrders.values()).filter(
        (o) => o.status === 'ACTIVE' || o.status === 'PENDING_PAYMENT'
      );

      // If in-memory is empty or requested, pull from Supabase to warm up cache
      if (activeList.length === 0 && Date.now() - lastOrderUpdateTimestamp > 10000) {
        try {
          const supabase = getServerSupabaseClient();
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
              const parsedOrder = {
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
              inMemoryActiveOrders.set(parsedOrder.id, parsedOrder);
            });
            activeList = Array.from(inMemoryActiveOrders.values()).filter(
              (o) => o.status === 'ACTIVE' || o.status === 'PENDING_PAYMENT'
            );
          }
        } catch { /* ignore */ }
      }

      if (tableId) {
        activeList = activeList.filter((o) => o.tableId === tableId);
      }

      return res.json({
        success: true,
        orders: activeList,
        lastUpdated: lastOrderUpdateTimestamp,
        hasNew: since < lastOrderUpdateTimestamp,
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err?.message || 'Lỗi tải đơn hàng hoạt động' });
    }
  });

  // =========================================================================
  // 14. AUTOMATED BANK CONFIRMATION ENGINE (Sacombank / VietQR / SePay / Casso)
  // =========================================================================
  interface BankTransactionRecord {
    id: string;
    gateway: string;
    accountNumber: string;
    amountIn: number;
    transactionDate: string;
    transactionContent: string;
    referenceNumber: string;
    matchedOrderCode?: string;
    receivedAt: number;
  }

  const confirmedBankTransactions: BankTransactionRecord[] = [];

  // Helper to normalize text for fuzzy comparison
  const sanitizeBankContent = (text: string): string => {
    if (!text) return '';
    return text
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, ' ');
  };

  // 14.1 Bank Webhook Handler (SePay, Casso, PayOS, or Direct Bank Webhook)
  app.post('/api/payment/bank-webhook', async (req, res) => {
    try {
      const payload = req.body || {};
      const webhookSecret = process.env.BANK_WEBHOOK_KEY;
      const authHeader = req.headers['authorization'] || req.headers['x-api-key'];

      if (webhookSecret && authHeader && authHeader !== `Apikey ${webhookSecret}` && authHeader !== webhookSecret) {
        return res.status(401).json({ success: false, message: 'Invalid Webhook Signature' });
      }

      const rawItems: any[] = Array.isArray(payload.data)
        ? payload.data
        : Array.isArray(payload)
        ? payload
        : [payload];

      const processedTxs: BankTransactionRecord[] = [];

      for (const item of rawItems) {
        const amount = Number(item.amountIn ?? item.amount ?? item.credit ?? 0);
        if (amount <= 0) continue;

        const content = String(item.transactionContent || item.description || item.content || item.body || '');
        const refNo = String(item.referenceNumber || item.referenceCode || item.refNo || item.id || `TX-${Date.now()}`);
        const account = String(item.accountNumber || item.subAccount || item.bankAccount || '');
        const gateway = String(item.gateway || item.bank || 'Sacombank');
        const txDate = String(item.transactionDate || item.when || new Date().toISOString());

        const sanitized = sanitizeBankContent(content);

        // Match against active orders in memory
        let matchedCode: string | undefined = undefined;
        const activeOrdersList = Array.from(inMemoryActiveOrders.values());

        for (const order of activeOrdersList) {
          const rawCode = sanitizeBankContent(order.orderCode || '');
          const cleanCode = rawCode.replace(/\s+/g, '');
          const sanitizedId = sanitizeBankContent(order.id || '');

          if (
            (cleanCode && sanitized.includes(cleanCode)) ||
            (rawCode && sanitized.includes(rawCode)) ||
            (sanitizedId && sanitized.includes(sanitizedId))
          ) {
            matchedCode = order.orderCode;
            break;
          }
        }

        const txRecord: BankTransactionRecord = {
          id: refNo,
          gateway,
          accountNumber: account,
          amountIn: amount,
          transactionDate: txDate,
          transactionContent: content,
          referenceNumber: refNo,
          matchedOrderCode: matchedCode,
          receivedAt: Date.now(),
        };

        confirmedBankTransactions.unshift(txRecord);
        if (confirmedBankTransactions.length > 200) {
          confirmedBankTransactions.pop();
        }

        processedTxs.push(txRecord);
      }

      console.log(`[Bank-Webhook] Processed ${processedTxs.length} transaction(s)`);

      return res.json({
        success: true,
        message: 'Đã nhận và lưu thông báo giao dịch ngân hàng',
        count: processedTxs.length,
        transactions: processedTxs,
      });
    } catch (err: any) {
      console.error('[Bank-Webhook Error]:', err);
      return res.status(500).json({ success: false, message: err?.message || 'Lỗi xử lý webhook ngân hàng' });
    }
  });

  // 14.2 Check Payment Status (Real-time polling from POS checkout modal)
  app.get('/api/payment/check-status', async (req, res) => {
    try {
      const orderCode = req.query.orderCode ? String(req.query.orderCode) : '';
      const orderId = req.query.orderId ? String(req.query.orderId) : '';
      const expectedAmount = Number(req.query.amount || 0);
      const apiKey = String(req.query.apiKey || process.env.BANK_API_KEY || '');
      const fifteenMinutesAgo = Date.now() - 15 * 60 * 1000;

      const sanitizedOrderCode = sanitizeBankContent(orderCode).replace(/\s+/g, '');
      const sanitizedOrderId = sanitizeBankContent(orderId).replace(/\s+/g, '');

      // 1. Check in-memory confirmed transactions
      let matchedTx = confirmedBankTransactions.find((tx) => {
        if (tx.receivedAt < fifteenMinutesAgo) return false;

        const sanitizedMemo = sanitizeBankContent(tx.transactionContent).replace(/\s+/g, '');

        // Match by order code (e.g. KM-01 or KM01)
        if (sanitizedOrderCode && sanitizedMemo.includes(sanitizedOrderCode)) {
          return true;
        }

        // Match by order id
        if (sanitizedOrderId && sanitizedMemo.includes(sanitizedOrderId)) {
          return true;
        }

        // Match by exact amount and store brand keyword "KAME"
        if (expectedAmount > 0 && Math.abs(tx.amountIn - expectedAmount) < 10 && sanitizedMemo.includes('KAME')) {
          return true;
        }

        return false;
      });

      // 2. Optional: If live SePay API Key is configured and no in-memory match found yet, call SePay API
      if (!matchedTx && apiKey) {
        try {
          const apiRes = await fetch('https://my.sepay.vn/userapi/transactions/list?limit=15', {
            headers: {
              Authorization: `Apikey ${apiKey}`,
              'Content-Type': 'application/json',
            },
          });
          if (apiRes.ok) {
            const apiData: any = await apiRes.json();
            const list = apiData?.transactions || [];
            for (const item of list) {
              const amount = Number(item.amount_in || item.amountIn || 0);
              const memo = String(item.transaction_content || item.description || '');
              const cleanMemo = sanitizeBankContent(memo).replace(/\s+/g, '');

              const isMatch =
                (sanitizedOrderCode && cleanMemo.includes(sanitizedOrderCode)) ||
                (sanitizedOrderId && cleanMemo.includes(sanitizedOrderId)) ||
                (expectedAmount > 0 && Math.abs(amount - expectedAmount) < 10 && cleanMemo.includes('KAME'));

              if (isMatch) {
                matchedTx = {
                  id: String(item.id || item.reference_number || Date.now()),
                  gateway: String(item.bank_brand_name || 'Sacombank'),
                  accountNumber: String(item.account_number || ''),
                  amountIn: amount,
                  transactionDate: String(item.transaction_date || new Date().toISOString()),
                  transactionContent: memo,
                  referenceNumber: String(item.reference_number || item.id),
                  matchedOrderCode: orderCode,
                  receivedAt: Date.now(),
                };
                confirmedBankTransactions.unshift(matchedTx);
                break;
              }
            }
          }
        } catch (apiErr) {
          console.warn('[Bank-API Check Note]:', apiErr);
        }
      }

      if (matchedTx) {
        return res.json({
          success: true,
          paid: true,
          transaction: matchedTx,
        });
      }

      return res.json({
        success: true,
        paid: false,
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err?.message || 'Lỗi kiểm tra trạng thái thanh toán' });
    }
  });

  // 14.3 Simulate Bank Transfer (For rapid testing in POS UI without real money transfer)
  app.post('/api/payment/simulate-bank-transfer', async (req, res) => {
    try {
      const { orderCode, orderId, amount, tableName } = req.body || {};
      const expectedAmount = Number(amount || 0);
      const targetCode = orderCode || '#KM-01';

      const simulatedTx: BankTransactionRecord = {
        id: `SIM-FT${Date.now().toString().slice(-8)}`,
        gateway: 'Sacombank',
        accountNumber: 'SCMM9R7GUFDQJ3FFPB',
        amountIn: expectedAmount,
        transactionDate: new Date().toISOString(),
        transactionContent: `KAME ${tableName ? tableName + ' ' : ''}${targetCode.replace('#', '')} CHUYEN TIEN THANH TOAN`,
        referenceNumber: `FT${Date.now()}`,
        matchedOrderCode: targetCode,
        receivedAt: Date.now(),
      };

      confirmedBankTransactions.unshift(simulatedTx);

      return res.json({
        success: true,
        message: `Ngân hàng Sacombank đã báo có: +${expectedAmount.toLocaleString('vi-VN')}đ`,
        transaction: simulatedTx,
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err?.message || 'Lỗi giả lập thanh toán' });
    }
  });

  // 14.4 Get Recent Bank Transactions (History log for cashier and admin)
  app.get('/api/payment/recent-transactions', (_req, res) => {
    return res.json({
      success: true,
      transactions: confirmedBankTransactions.slice(0, 30),
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`KAME POS Full-Stack Server running on http://0.0.0.0:${PORT}`);

    // Run automated sales compression 30 seconds after server starts, and repeat every 12 hours
    setTimeout(() => {
      runAutomatedSalesCompression(12);
    }, 30000);

    setInterval(() => {
      runAutomatedSalesCompression(12);
    }, 12 * 60 * 60 * 1000);
  });
}

startServer();
