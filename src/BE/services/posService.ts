import { Request } from 'express';
import { PosRepository } from '../repositories/posRepository';
import { AppValidationError } from '../../shared/errorCatalog';
import { getServerSupabaseClient } from '../config/supabase';

export class PosService {
  public static async testConnection(req?: Request) {
    return PosRepository.testConnection(req);
  }

  public static async getStats(req?: Request) {
    const stats = await PosRepository.getStats(req);
    return { success: true, stats };
  }

  public static async pullData(req?: Request) {
    const res = await PosRepository.pullAllData(req);
    if (!res) {
      return {
        success: false,
        message: 'Chưa cấu hình Supabase Project URL hoặc API Key.',
        data: { categories: [], products: [], users: [], shifts: [], payrolls: [], orders: [], settings: null, dailySalesSummaries: [] },
      };
    }

    const { cRes, pRes, uRes, sRes, prRes, oRes, setRes, summRes } = res;

    if (cRes.error?.message?.includes('fetch failed') || pRes.error?.message?.includes('fetch failed')) {
      return {
        success: false,
        message: 'Không thể kết nối đến máy chủ Supabase. Vui lòng kiểm tra lại cấu hình API.',
        data: { categories: [], products: [], users: [], shifts: [], payrolls: [], orders: [], settings: null, dailySalesSummaries: [] },
      };
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
        allowedToppings: Boolean(p.allowedToppings),
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

    return {
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
    };
  }

  public static async syncData(data: any, req?: Request) {
    const supabase = getServerSupabaseClient(req);
    const counts = { categories: 0, products: 0, users: 0, shifts: 0, payrolls: 0, orders: 0, settings: 0 };
    const errors: string[] = [];

    if (!supabase) {
      throw new AppValidationError('ME00014', ['Chưa cấu hình URL hoặc API Key']);
    }

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
      if (cErr) errors.push(`Danh mục: ${cErr.message}`);
      else counts.categories = categoryRows.length;
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
      if (pErr) errors.push(`Món ăn / đồ uống: ${pErr.message}`);
      else counts.products = productRows.length;
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
      if (uErr) errors.push(`Nhân viên: ${uErr.message}`);
      else counts.users = userRows.length;
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
      return {
        success: false,
        message: `Đồng bộ hoàn tất một phần (${errors.length} lỗi): ${errors.join(', ')}`,
        counts,
        errors,
      };
    }

    return {
      success: true,
      message: `Đã đồng bộ thành công lên Supabase: ${counts.categories} danh mục, ${counts.products} món, ${counts.users} nhân viên, ${counts.shifts} ca làm, ${counts.payrolls} bảng lương, ${counts.orders} hóa đơn.`,
      counts,
    };
  }

  public static async upsert(table: string, rows: any[], conflict?: string, req?: Request) {
    if (!table || !rows) {
      throw new AppValidationError('ME00002', ['Tên bảng hoặc dữ liệu']);
    }
    const { data, error } = await PosRepository.upsertGeneric(table, rows, conflict, req);
    if (error) {
      throw new Error(error.message);
    }
    return { success: true, data };
  }

  public static async update(table: string, values: any, targetCol: string, targetVal: any, req?: Request) {
    if (!table || !values || targetVal === undefined) {
      throw new AppValidationError('ME00002', ['Bảng, dữ liệu hoặc định danh (ID)']);
    }
    const { data, error } = await PosRepository.updateGeneric(table, values, targetCol, targetVal, req);
    if (error) {
      throw new Error(error.message);
    }
    return { success: true, data };
  }

  public static async delete(table: string, column: string, id: any, req?: Request) {
    if (!table || !id) {
      throw new AppValidationError('ME00002', ['Tên bảng hoặc định danh (ID)']);
    }
    const { error } = await PosRepository.deleteGeneric(table, column, id, req);
    if (error) {
      throw new Error(error.message);
    }
    return { success: true };
  }

  public static async compressSales(cutoffMonths: number = 12, specificMonth?: string, cutoffDate?: string) {
    const supabase = getServerSupabaseClient();
    if (!supabase) {
      throw new AppValidationError('ME00014', ['Chưa cấu hình Supabase Client']);
    }

    let targetBeforeDate: string;
    if (specificMonth) {
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

    const rawOrders = await PosRepository.getOrdersBeforeDate(targetBeforeDate);
    const ordersToCompress = rawOrders.filter((o: any) => o.status === 'PAID' || o.status === 'COMPLETED');

    if (ordersToCompress.length === 0) {
      return {
        success: true,
        message: 'Không tìm thấy đơn hàng đã thanh toán nào trong giai đoạn này cần nén.',
        compressedOrdersCount: 0,
        daysSummarized: 0,
        totalRevenuePreserved: 0,
      };
    }

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

    const summaryRows = Array.from(dailyMap.values()).map((item) => ({
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

    await (supabase.from('pos_daily_sales_summary' as any) as any).upsert(summaryRows, { onConflict: 'id' });

    const orderIdsToDelete = ordersToCompress.map((o: any) => o.id);
    if (orderIdsToDelete.length > 0) {
      await PosRepository.deleteOrdersByIds(orderIdsToDelete);
    }

    const totalPreserved = summaryRows.reduce((sum, r) => sum + r.total_revenue, 0);

    return {
      success: true,
      message: `Đã nén thành công ${ordersToCompress.length} hóa đơn cũ thành ${summaryRows.length} bản ghi tổng hợp ngày. Bảo toàn trọn vẹn ${totalPreserved.toLocaleString('vi-VN')} đ doanh thu.`,
      compressedOrdersCount: ordersToCompress.length,
      daysSummarized: summaryRows.length,
      totalRevenuePreserved: totalPreserved,
      summaries: summaryRows,
    };
  }
}
