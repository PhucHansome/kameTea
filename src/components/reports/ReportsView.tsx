import React, { useState, useEffect } from 'react';
import { usePOS } from '../../context/POSContext';
import {
  getSupabaseConfig,
  testSupabaseConnection,
  SUPABASE_SQL_SCHEMA,
  getSupabaseTableStats,
  TableStats,
} from '../../lib/supabase';
import { formatVND } from '../../utils/formatters';
import {
  BarChart3,
  TrendingUp,
  CreditCard,
  QrCode,
  Banknote,
  Receipt,
  AlertTriangle,
  Award,
  Calendar,
  Download,
  Printer,
  ShoppingBag,
  Settings,
  Building,
  CheckCircle,
  Bike,
  UtensilsCrossed,
  Layers,
  Building2,
  Clock,
  DollarSign,
  Wallet,
  Database,
  Cloud,
  Copy,
  ExternalLink,
  RefreshCw,
  Server,
  ShieldCheck,
  UploadCloud,
  ArrowDownCircle,
  Users,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { POPULAR_VIETNAMESE_BANKS, findBank, buildVietQRUrl } from '../../utils/vietnameseBanks';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
} from 'recharts';

export const ReportsView: React.FC = () => {
  const {
    orders,
    voidLogs,
    products,
    categories,
    users,
    shifts,
    payrolls,
    settings,
    updateSettings,
    dailySalesSummaries,
    isSubmitting,
    showToast,
    isAdmin,
  } = usePOS();
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'BEST_SELLERS' | 'VOID_LOGS' | 'SETTINGS'>(
    'OVERVIEW'
  );

  // Advanced Date / Month / Year Filters
  const todayStr = new Date().toISOString().split('T')[0];
  const thisMonthStr = todayStr.slice(0, 7);
  const thisYearStr = todayStr.slice(0, 4);

  const [dateFilterMode, setDateFilterMode] = useState<'DAY' | 'MONTH' | 'YEAR' | 'ALL'>('DAY');
  const [selectedDay, setSelectedDay] = useState<string>(todayStr);
  const [selectedMonth, setSelectedMonth] = useState<string>(thisMonthStr);
  const [selectedYear, setSelectedYear] = useState<string>(thisYearStr);

  // For non-admin (Staff / Server): lock to today only and restrict subtabs
  useEffect(() => {
    if (!isAdmin) {
      setDateFilterMode('DAY');
      setSelectedDay(todayStr);
      if (activeTab === 'SETTINGS' || activeTab === 'VOID_LOGS') {
        setActiveTab('OVERVIEW');
      }
    }
  }, [isAdmin, todayStr, activeTab]);

  // Store settings form state
  const [storeName, setStoreName] = useState(settings.storeName);
  const [address, setAddress] = useState(settings.address);
  const [phone, setPhone] = useState(settings.phone);
  const [bankCode, setBankCode] = useState(settings.bankCode || 'STB');
  const [bankName, setBankName] = useState(settings.bankName);
  const [bankAccount, setBankAccount] = useState(settings.bankAccount);
  const [accountHolder, setAccountHolder] = useState(settings.accountHolder);
  const [taxPercent, setTaxPercent] = useState(settings.taxPercent);
  const [receiptFooter, setReceiptFooter] = useState(settings.receiptFooter);
  const [autoPrintOnPayment, setAutoPrintOnPayment] = useState(settings.autoPrintOnPayment ?? true);
  const [bankApiKey, setBankApiKey] = useState(settings.bankApiKey || '');
  const [enableAutoBankConfirmation, setEnableAutoBankConfirmation] = useState(settings.enableAutoBankConfirmation ?? true);

  // Filter Paid Orders according to chosen dateFilterMode
  const allPaidOrders = orders.filter((o) => o.status === 'PAID');

  const paidOrders = allPaidOrders.filter((o) => {
    if (dateFilterMode === 'ALL') return true;

    const dateStr = o.paidAt || o.createdAt;
    if (!dateStr) return true;

    const ordDate = new Date(dateStr);
    const yyyy = ordDate.getFullYear().toString();
    const mm = String(ordDate.getMonth() + 1).padStart(2, '0');
    const dd = String(ordDate.getDate()).padStart(2, '0');
    const fullDate = `${yyyy}-${mm}-${dd}`;
    const fullMonth = `${yyyy}-${mm}`;

    if (dateFilterMode === 'DAY') {
      return fullDate === selectedDay;
    }
    if (dateFilterMode === 'MONTH') {
      return fullMonth === selectedMonth;
    }
    if (dateFilterMode === 'YEAR') {
      return yyyy === selectedYear;
    }
    return true;
  });

  // Filter Daily Sales Summaries according to chosen dateFilterMode
  const filteredSummaries = dailySalesSummaries.filter((s) => {
    if (dateFilterMode === 'ALL') return true;
    if (!s.date) return true;

    const sDate = s.date;
    const sMonth = s.date.slice(0, 7);
    const sYear = s.date.slice(0, 4);

    if (dateFilterMode === 'DAY') return sDate === selectedDay;
    if (dateFilterMode === 'MONTH') return sMonth === selectedMonth;
    if (dateFilterMode === 'YEAR') return sYear === selectedYear;
    return true;
  });

  // Historical Daily Summary aggregations
  const totalCompressedRevenue = filteredSummaries.reduce((sum, s) => sum + (s.totalRevenue || 0), 0);
  const totalCompressedOrders = filteredSummaries.reduce((sum, s) => sum + (s.totalOrders || 0), 0);
  const totalCompressedCash = filteredSummaries.reduce((sum, s) => sum + (s.cashRevenue || 0), 0);
  const totalCompressedTransfer = filteredSummaries.reduce((sum, s) => sum + (s.transferRevenue || 0), 0);
  const totalCompressedShipping = filteredSummaries.reduce((sum, s) => sum + (s.shippingRevenue || 0), 0);

  // Total Revenue (Active Paid Orders + Compressed Daily Summaries)
  const activePaidRevenue = paidOrders.reduce((sum, o) => sum + (o.finalTotal || o.totalAmount), 0);
  const totalRevenue = activePaidRevenue + totalCompressedRevenue;
  const totalOrdersCount = paidOrders.length + totalCompressedOrders;
  const averageOrderValue = totalOrdersCount > 0 ? Math.round(totalRevenue / totalOrdersCount) : 0;

  // Accurately calculate split revenue between Cash and Transfer (handles pure and MIXED payments)
  let totalCashRevenue = totalCompressedCash;
  let totalTransferRevenue = totalCompressedTransfer;
  let totalShippingRevenue = totalCompressedShipping;

  paidOrders.forEach((o) => {
    const finalBill = o.finalTotal || o.totalAmount;
    if (o.shippingFee) {
      totalShippingRevenue += o.shippingFee;
    }

    if (o.paymentMethod === 'MIXED') {
      const cash = o.cashAmountPaid !== undefined ? o.cashAmountPaid : 0;
      const transfer = o.transferAmountPaid !== undefined ? o.transferAmountPaid : Math.max(0, finalBill - cash);
      totalCashRevenue += cash;
      totalTransferRevenue += transfer;
    } else if (o.paymentMethod === 'CASH') {
      totalCashRevenue += o.cashAmountPaid !== undefined ? o.cashAmountPaid : finalBill;
    } else {
      // Default: Sacombank QR / Chuyển khoản
      totalTransferRevenue += o.transferAmountPaid !== undefined ? o.transferAmountPaid : finalBill;
    }
  });

  const paymentData = [
    { name: 'Chuyển khoản QR (Sacombank)', value: totalTransferRevenue, color: '#3b82f6' },
    { name: 'Tiền mặt tại két (Cash)', value: totalCashRevenue, color: '#10b981' },
  ].filter((p) => p.value > 0);

  // Takeaway vs Dine-in revenue
  const takeawayRevenue = paidOrders
    .filter((o) => o.orderType === 'TAKEAWAY')
    .reduce((sum, o) => sum + (o.finalTotal || o.totalAmount), 0);
  const dineInRevenue = totalRevenue - takeawayRevenue;

  // Dynamic Chart Breakdown based on Date Mode
  let chartData: { time: string; revenue: number; orders: number }[] = [];

  if (dateFilterMode === 'DAY') {
    // Hourly breakdown
    const hours = ['08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00', '22:00'];
    chartData = hours.map((h) => {
      const hourNum = parseInt(h.split(':')[0], 10);
      const matched = paidOrders.filter((o) => {
        const d = new Date(o.paidAt || o.createdAt);
        const ordHour = d.getHours();
        return ordHour >= hourNum && ordHour < hourNum + 2;
      });
      const rev = matched.reduce((s, o) => s + (o.finalTotal || o.totalAmount), 0);
      return { time: h, revenue: rev, orders: matched.length };
    });
  } else if (dateFilterMode === 'MONTH') {
    // Daily breakdown for the chosen month (e.g. days 1..31)
    const daysInMonth = 31;
    const dailyMap: { [day: number]: { rev: number; count: number } } = {};
    for (let i = 1; i <= daysInMonth; i++) dailyMap[i] = { rev: 0, count: 0 };

    paidOrders.forEach((o) => {
      const d = new Date(o.paidAt || o.createdAt);
      const dayNum = d.getDate();
      if (dailyMap[dayNum]) {
        dailyMap[dayNum].rev += o.finalTotal || o.totalAmount;
        dailyMap[dayNum].count += 1;
      }
    });

    chartData = Object.keys(dailyMap).map((d) => ({
      time: `N${d}`,
      revenue: dailyMap[Number(d)].rev,
      orders: dailyMap[Number(d)].count,
    }));
  } else if (dateFilterMode === 'YEAR') {
    // 12 Months breakdown
    chartData = Array.from({ length: 12 }, (_, i) => {
      const mNum = i + 1;
      const matched = paidOrders.filter((o) => {
        const d = new Date(o.paidAt || o.createdAt);
        return d.getMonth() + 1 === mNum;
      });
      const rev = matched.reduce((s, o) => s + (o.finalTotal || o.totalAmount), 0);
      return { time: `T${mNum}`, revenue: rev, orders: matched.length };
    });
  } else {
    // ALL time
    chartData = [
      { time: 'Tất cả', revenue: totalRevenue, orders: totalOrdersCount }
    ];
  }

  // Best selling products calculation for current period
  const productSalesMap: { [prodName: string]: { qty: number; total: number } } = {};
  paidOrders.forEach((ord) => {
    ord.items.forEach((it) => {
      if (it.status !== 'CANCELLED') {
        if (!productSalesMap[it.productName]) {
          productSalesMap[it.productName] = { qty: 0, total: 0 };
        }
        productSalesMap[it.productName].qty += it.quantity;
        productSalesMap[it.productName].total += it.unitPrice * it.quantity;
      }
    });
  });

  const bestSellersList = Object.keys(productSalesMap)
    .map((name) => ({
      name,
      qty: productSalesMap[name].qty,
      total: productSalesMap[name].total,
    }))
    .sort((a, b) => b.qty - a.qty);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      storeName,
      address,
      phone,
      bankCode,
      bankName,
      bankAccount,
      accountHolder,
      taxPercent: Number(taxPercent),
      receiptFooter,
      autoPrintOnPayment,
      bankApiKey,
      enableAutoBankConfirmation,
    });
    alert(`Đã lưu cấu hình cửa hàng & tài khoản ${bankName} thành công!`);
  };

  return (
    <div className="space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-stone-900 p-4 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500 text-stone-950 shadow-xs">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-black text-stone-900 dark:text-stone-100">
              Báo Cáo Doanh Thu (Tách Biệt Tiền Mặt & Chuyển Khoản)
            </h2>
            <p className="text-xs text-stone-500 font-medium mt-0.5">
              Phân tích doanh số, cơ cấu thu tiền mặt / Sacombank QR, phí ship và sổ hủy món.
            </p>
          </div>
        </div>

        {/* Tab Pills */}
        <div className="flex rounded-xl bg-stone-100 dark:bg-stone-800 p-1 border border-stone-200 dark:border-stone-700">
          <button
            type="button"
            onClick={() => setActiveTab('OVERVIEW')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'OVERVIEW'
                ? 'bg-amber-500 text-stone-950 shadow-xs'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>{isAdmin ? 'Doanh Thu & Dòng Tiền' : 'Doanh Thu Hôm Nay'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('BEST_SELLERS')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'BEST_SELLERS'
                ? 'bg-amber-500 text-stone-950 shadow-xs'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>Món Bán Chạy</span>
          </button>

          {/* Admin-only Subtabs */}
          {isAdmin && (
            <>
              <button
                type="button"
                onClick={() => setActiveTab('VOID_LOGS')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                  activeTab === 'VOID_LOGS'
                    ? 'bg-amber-500 text-stone-950 shadow-xs'
                    : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Sổ Hủy Món ({voidLogs.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('SETTINGS')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                  activeTab === 'SETTINGS'
                    ? 'bg-amber-500 text-stone-950 shadow-xs'
                    : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
                }`}
              >
                <Settings className="w-3.5 h-3.5" />
                <span>Cài Đặt Sacombank & Quán</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* OVERVIEW TAB */}
      {activeTab === 'OVERVIEW' && (
        <div className="space-y-5">
          {/* DATE / MONTH / YEAR FILTER TOOLBAR */}
          <div className="bg-white dark:bg-stone-900 p-4 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            {!isAdmin ? (
              <div className="flex flex-wrap items-center gap-3 w-full">
                <div className="flex items-center gap-2 px-4 py-2 bg-amber-500/15 border border-amber-500/30 rounded-xl">
                  <Calendar className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <span className="text-xs font-black text-amber-900 dark:text-amber-200">
                    BÁO CÁO HÔM NAY: {new Date().toLocaleDateString('vi-VN')}
                  </span>
                </div>
                <span className="text-xs font-medium text-stone-500">
                  (Nhân viên phục vụ: Chỉ xem thống kê doanh thu và đơn hàng trong ngày hôm nay)
                </span>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2 overflow-x-auto">
                  <span className="text-xs font-black text-stone-500 uppercase tracking-wider whitespace-nowrap">
                    Xem theo:
                  </span>
                  <div className="flex rounded-xl bg-stone-100 dark:bg-stone-800 p-1 border border-stone-200 dark:border-stone-700">
                    <button
                      type="button"
                      onClick={() => setDateFilterMode('DAY')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                        dateFilterMode === 'DAY'
                          ? 'bg-amber-500 text-stone-950 font-black shadow-xs'
                          : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
                      }`}
                    >
                      📅 Theo Ngày
                    </button>
                    <button
                      type="button"
                      onClick={() => setDateFilterMode('MONTH')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                        dateFilterMode === 'MONTH'
                          ? 'bg-amber-500 text-stone-950 font-black shadow-xs'
                          : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
                      }`}
                    >
                      🗓️ Theo Tháng
                    </button>
                    <button
                      type="button"
                      onClick={() => setDateFilterMode('YEAR')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                        dateFilterMode === 'YEAR'
                          ? 'bg-amber-500 text-stone-950 font-black shadow-xs'
                          : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
                      }`}
                    >
                      📊 Theo Năm
                    </button>
                    <button
                      type="button"
                      onClick={() => setDateFilterMode('ALL')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                        dateFilterMode === 'ALL'
                          ? 'bg-amber-500 text-stone-950 font-black shadow-xs'
                          : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
                      }`}
                    >
                      Toàn Bộ
                    </button>
                  </div>
                </div>

                {/* Date Pickers based on mode */}
                <div className="flex items-center gap-2">
                  {dateFilterMode === 'DAY' && (
                    <div className="flex items-center gap-2">
                      <input
                        type="date"
                        value={selectedDay}
                        onChange={(e) => setSelectedDay(e.target.value)}
                        className="px-3 py-1.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-xs font-bold text-stone-900 dark:text-stone-100"
                      />
                      <button
                        type="button"
                        onClick={() => setSelectedDay(todayStr)}
                        className="px-2.5 py-1.5 rounded-lg bg-stone-100 dark:bg-stone-800 text-[11px] font-bold text-stone-600 dark:text-stone-400 hover:bg-stone-200"
                      >
                        Hôm nay
                      </button>
                    </div>
                  )}

                  {dateFilterMode === 'MONTH' && (
                    <div className="flex items-center gap-2">
                      <input
                        type="month"
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                        className="px-3 py-1.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-xs font-bold text-stone-900 dark:text-stone-100"
                      />
                      <button
                        type="button"
                        onClick={() => setSelectedMonth(thisMonthStr)}
                        className="px-2.5 py-1.5 rounded-lg bg-stone-100 dark:bg-stone-800 text-[11px] font-bold text-stone-600 dark:text-stone-400 hover:bg-stone-200"
                      >
                        Tháng này
                      </button>
                    </div>
                  )}

                  {dateFilterMode === 'YEAR' && (
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="2020"
                        max="2035"
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(e.target.value)}
                        className="w-24 px-3 py-1.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-xs font-bold text-stone-900 dark:text-stone-100"
                      />
                      <button
                        type="button"
                        onClick={() => setSelectedYear(thisYearStr)}
                        className="px-2.5 py-1.5 rounded-lg bg-stone-100 dark:bg-stone-800 text-[11px] font-bold text-stone-600 dark:text-stone-400 hover:bg-stone-200"
                      >
                        Năm nay
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* PRIMARY KPI CARDS: HIGHLIGHTING CASH VS TRANSFER SEPARATION */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Total Revenue */}
            <div className="bg-white dark:bg-stone-900 p-4 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-stone-500 text-xs font-bold uppercase tracking-wider">
                <span>Tổng Doanh Thu</span>
                <TrendingUp className="w-4 h-4 text-amber-500" />
              </div>
              <p className="text-2xl font-black text-amber-600 dark:text-amber-400 font-mono">
                {totalRevenue.toLocaleString('vi-VN')}đ
              </p>
              <p className="text-[11px] text-stone-500 font-medium flex items-center gap-1">
                <Receipt className="w-3 h-3 text-stone-400" />
                {totalOrdersCount} hóa đơn đã hoàn tất
              </p>
            </div>

            {/* Card 2: Cash Revenue (Tiền mặt thực tế tại két) */}
            <div className="bg-white dark:bg-stone-900 p-4 rounded-2xl border-2 border-emerald-500/30 dark:border-emerald-500/20 bg-emerald-50/20 dark:bg-emerald-950/10 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-emerald-800 dark:text-emerald-400 text-xs font-black uppercase tracking-wider">
                <span>Tiền Mặt (Tại Két)</span>
                <Wallet className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                {totalCashRevenue.toLocaleString('vi-VN')}đ
              </p>
              <p className="text-[11px] text-emerald-700 dark:text-emerald-300 font-bold">
                {totalRevenue > 0
                  ? `${Math.round((totalCashRevenue / totalRevenue) * 100)}% tổng doanh số thu tại quầy`
                  : '0%'}
              </p>
            </div>

            {/* Card 3: Transfer Revenue (Chuyển khoản Sacombank) */}
            <div className="bg-white dark:bg-stone-900 p-4 rounded-2xl border-2 border-blue-500/30 dark:border-blue-500/20 bg-blue-50/20 dark:bg-blue-950/10 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-blue-800 dark:text-blue-400 text-xs font-black uppercase tracking-wider">
                <span>Chuyển Khoản (Sacombank)</span>
                <Building2 className="w-4 h-4 text-blue-600" />
              </div>
              <p className="text-2xl font-black text-blue-600 dark:text-blue-400 font-mono">
                {totalTransferRevenue.toLocaleString('vi-VN')}đ
              </p>
              <p className="text-[11px] text-blue-700 dark:text-blue-300 font-bold">
                {totalRevenue > 0
                  ? `${Math.round((totalTransferRevenue / totalRevenue) * 100)}% chuyển khoản qua mã QR`
                  : '0%'}
              </p>
            </div>

            {/* Card 4: Shipping Fees Revenue */}
            <div className="bg-white dark:bg-stone-900 p-4 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-stone-500 text-xs font-bold uppercase tracking-wider">
                <span>Doanh Thu Phí Ship</span>
                <Bike className="w-4 h-4 text-purple-500" />
              </div>
              <p className="text-2xl font-black text-purple-600 dark:text-purple-400 font-mono">
                {totalShippingRevenue.toLocaleString('vi-VN')}đ
              </p>
              <p className="text-[11px] text-stone-500 font-medium">
                Giao hàng mang về: {paidOrders.filter((o) => o.orderType === 'TAKEAWAY').length} đơn
              </p>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Dynamic Sales Bar Chart */}
            <div className="lg:col-span-8 bg-white dark:bg-stone-900 p-5 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-stone-900 dark:text-stone-100">
                    {dateFilterMode === 'DAY'
                      ? `Phân Phối Doanh Thu Theo Giờ (${selectedDay})`
                      : dateFilterMode === 'MONTH'
                      ? `Phân Phối Doanh Thu Theo Ngày Trong Tháng (${selectedMonth})`
                      : dateFilterMode === 'YEAR'
                      ? `Phân Phối Doanh Thu 12 Tháng (${selectedYear})`
                      : 'Biểu Đồ Tổng Doanh Thu Toàn Bộ'}
                  </h3>
                  <p className="text-xs text-stone-500">
                    {dateFilterMode === 'DAY'
                      ? 'Thống kê theo các khung giờ phục vụ'
                      : dateFilterMode === 'MONTH'
                      ? 'Biểu đồ dòng tiền từng ngày trong tháng'
                      : 'Biểu đồ tăng trưởng các tháng'}
                  </p>
                </div>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                    <XAxis dataKey="time" fontSize={11} />
                    <YAxis
                      fontSize={11}
                      tickFormatter={(v) => `${v / 1000}k`}
                    />
                    <Tooltip
                      formatter={(val: number | string | undefined) => [
                        `${(val || 0).toLocaleString('vi-VN')}đ`,
                        'Doanh thu',
                      ]}
                    />
                    <Bar dataKey="revenue" fill="#f59e0b" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Payment Methods Breakdown Donut */}
            <div className="lg:col-span-4 bg-white dark:bg-stone-900 p-5 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs space-y-4 flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-black text-stone-900 dark:text-stone-100">
                  Cơ Cấu Tiền Mặt vs Chuyển Khoản
                </h3>
                <p className="text-xs text-stone-500">Tỷ trọng tiền thực tế phân bổ vào két và tài khoản</p>
              </div>

              <div className="h-44 w-full flex items-center justify-center">
                {paymentData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={paymentData}
                        innerRadius={45}
                        outerRadius={70}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {paymentData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(val: number | string | undefined) => [
                          `${(val || 0).toLocaleString('vi-VN')}đ`,
                          'Doanh thu',
                        ]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-xs text-stone-400 italic">Chưa có giao dịch thanh toán</p>
                )}
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between p-2 rounded-xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                    <span className="font-bold text-blue-900 dark:text-blue-300">Chuyển khoản (Sacombank)</span>
                  </div>
                  <span className="font-black font-mono text-blue-600">{totalTransferRevenue.toLocaleString('vi-VN')}đ</span>
                </div>

                <div className="flex items-center justify-between p-2 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                    <span className="font-bold text-emerald-900 dark:text-emerald-300">Tiền mặt (Cash tại két)</span>
                  </div>
                  <span className="font-black font-mono text-emerald-600">{totalCashRevenue.toLocaleString('vi-VN')}đ</span>
                </div>
              </div>
            </div>
          </div>

          {/* DETAILED TRANSACTION LOGS TABLE (SEPARATED CASH VS TRANSFER) */}
          <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 overflow-hidden shadow-xs">
            <div className="p-4 bg-stone-50 dark:bg-stone-800/80 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-stone-900 dark:text-stone-100">
                  Bảng Kê Chi Tiết Hóa Đơn Thanh Toán (Tách Riêng Tiền Mặt & Chuyển Khoản)
                </h3>
                <p className="text-xs text-stone-500">Ghi nhận minh bạch dòng tiền từng đơn, hỗ trợ chốt ca và bàn giao két</p>
              </div>

              <button
                type="button"
                onClick={() => window.print()}
                className="px-3.5 py-1.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300 hover:bg-stone-100 text-xs font-bold flex items-center gap-1.5 shadow-2xs"
              >
                <Printer className="w-3.5 h-3.5 text-amber-600" />
                <span>In Báo Cáo Chốt Ca</span>
              </button>
            </div>

            {paidOrders.length === 0 ? (
              <div className="p-8 text-center text-xs text-stone-500 italic">
                Chưa có hóa đơn nào hoàn tất thanh toán hôm nay.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 font-bold border-b border-stone-200 dark:border-stone-700">
                    <tr>
                      <th className="p-3">Mã đơn / Bàn</th>
                      <th className="p-3">Thời gian</th>
                      <th className="p-3">Hình thức</th>
                      <th className="p-3">Tổng bill</th>
                      <th className="p-3 text-emerald-700 dark:text-emerald-400">Tiền mặt (Két)</th>
                      <th className="p-3 text-blue-700 dark:text-blue-400">Chuyển khoản (Sacombank)</th>
                      <th className="p-3">Phí Ship</th>
                      <th className="p-3">Phương thức</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                    {paidOrders.map((ord) => {
                      const finalTotal = ord.finalTotal || ord.totalAmount;
                      const cashPart =
                        ord.paymentMethod === 'MIXED'
                          ? ord.cashAmountPaid || 0
                          : ord.paymentMethod === 'CASH'
                          ? finalTotal
                          : 0;
                      const transferPart =
                        ord.paymentMethod === 'MIXED'
                          ? ord.transferAmountPaid || Math.max(0, finalTotal - cashPart)
                          : ord.paymentMethod === 'SACOMBANK_QR' || ord.paymentMethod === 'VIETQR' || ord.paymentMethod === 'TRANSFER'
                          ? finalTotal
                          : 0;

                      return (
                        <tr key={ord.id} className="hover:bg-stone-50/60 dark:hover:bg-stone-800/40">
                          <td className="p-3 font-bold">
                            <span className="font-mono text-amber-700 dark:text-amber-400">{ord.orderCode}</span>
                            <div className="text-[11px] text-stone-500 font-normal">{ord.tableName}</div>
                          </td>
                          <td className="p-3 text-stone-500 text-[11px]">
                            {new Date(ord.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className="p-3">
                            <span
                              className={`px-2 py-0.5 rounded-md text-[10px] font-bold inline-flex items-center gap-1 ${
                                ord.orderType === 'TAKEAWAY'
                                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                                  : 'bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300'
                              }`}
                            >
                              {ord.orderType === 'TAKEAWAY' ? <Bike className="w-3 h-3" /> : <UtensilsCrossed className="w-3 h-3" />}
                              {ord.orderType === 'TAKEAWAY' ? 'Đem về' : 'Ăn tại chỗ'}
                            </span>
                          </td>
                          <td className="p-3 font-black text-stone-900 dark:text-stone-100 font-mono">
                            {finalTotal.toLocaleString('vi-VN')}đ
                          </td>
                          <td className="p-3 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                            {cashPart > 0 ? `${cashPart.toLocaleString('vi-VN')}đ` : '-'}
                          </td>
                          <td className="p-3 font-mono font-bold text-blue-600 dark:text-blue-400">
                            {transferPart > 0 ? `${transferPart.toLocaleString('vi-VN')}đ` : '-'}
                          </td>
                          <td className="p-3 font-mono text-purple-600">
                            {ord.shippingFee ? `${ord.shippingFee.toLocaleString('vi-VN')}đ` : '-'}
                          </td>
                          <td className="p-3">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                ord.paymentMethod === 'MIXED'
                                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                  : ord.paymentMethod === 'CASH'
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                  : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                              }`}
                            >
                              {ord.paymentMethod === 'MIXED'
                                ? 'Mix (Tiền mặt + CK)'
                                : ord.paymentMethod === 'CASH'
                                ? 'Tiền mặt'
                                : 'QR Sacombank'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="bg-stone-50 dark:bg-stone-800/60 font-black border-t-2 border-stone-200 dark:border-stone-700">
                    <tr>
                      <td colSpan={3} className="p-3 text-right">
                        TỔNG CỘNG:
                      </td>
                      <td className="p-3 font-mono text-amber-600 dark:text-amber-400">
                        {totalRevenue.toLocaleString('vi-VN')}đ
                      </td>
                      <td className="p-3 font-mono text-emerald-600 dark:text-emerald-400">
                        {totalCashRevenue.toLocaleString('vi-VN')}đ
                      </td>
                      <td className="p-3 font-mono text-blue-600 dark:text-blue-400">
                        {totalTransferRevenue.toLocaleString('vi-VN')}đ
                      </td>
                      <td className="p-3 font-mono text-purple-600">
                        {totalShippingRevenue.toLocaleString('vi-VN')}đ
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* BEST SELLERS TAB */}
      {activeTab === 'BEST_SELLERS' && (
        <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 overflow-hidden shadow-xs">
          <div className="p-4 bg-stone-100 dark:bg-stone-800 border-b border-stone-200 dark:border-stone-700 flex items-center justify-between">
            <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-500" />
              <span>Xếp Hạng Món Bán Chạy Nhất (KAME Top Sellers)</span>
            </h3>
            <span className="text-xs text-stone-500 font-medium">
              Dựa trên {paidOrders.length} hóa đơn đã phục vụ
            </span>
          </div>

          <div className="p-4">
            {bestSellersList.length === 0 ? (
              <p className="text-xs text-stone-500 italic text-center py-6">
                Chưa có dữ liệu bán hàng.
              </p>
            ) : (
              <div className="space-y-3">
                {bestSellersList.slice(0, 10).map((prod, index) => (
                  <div
                    key={prod.name}
                    className="p-3 rounded-xl border border-stone-200 dark:border-stone-800 flex items-center justify-between hover:border-amber-400 transition"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                          index === 0
                            ? 'bg-amber-500 text-stone-950 font-black'
                            : index === 1
                            ? 'bg-stone-300 text-stone-900'
                            : index === 2
                            ? 'bg-amber-800 text-white'
                            : 'bg-stone-100 text-stone-600'
                        }`}
                      >
                        #{index + 1}
                      </div>
                      <div>
                        <p className="font-bold text-sm text-stone-900 dark:text-stone-100">
                          {prod.name}
                        </p>
                        <p className="text-xs text-stone-500">Đã bán: {prod.qty} phần</p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="font-black text-sm text-amber-600 dark:text-amber-400 font-mono">
                        {prod.total.toLocaleString('vi-VN')}đ
                      </p>
                      <p className="text-[11px] text-stone-500">
                        ~{Math.round(prod.total / prod.qty).toLocaleString('vi-VN')}đ / phần
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* VOID LOGS TAB */}
      {activeTab === 'VOID_LOGS' && (
        <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 overflow-hidden shadow-xs">
          <div className="p-4 bg-stone-100 dark:bg-stone-800 border-b border-stone-200 dark:border-stone-700 flex items-center justify-between">
            <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              <span>Sổ Nhật Ký Hủy Món & Audit Log Nhân Viên</span>
            </h3>
            <span className="text-xs text-stone-500 font-medium">
              Chống thất thoát & gian lận thu ngân
            </span>
          </div>

          <div className="overflow-x-auto">
            {voidLogs.length === 0 ? (
              <p className="text-xs text-stone-500 italic text-center py-8">
                Chưa có thao tác hủy món nào được ghi nhận.
              </p>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-50 dark:bg-stone-800/50 text-stone-500 font-bold border-b border-stone-200 dark:border-stone-700">
                  <tr>
                    <th className="p-3">Thời gian</th>
                    <th className="p-3">Bàn</th>
                    <th className="p-3">Món bị hủy</th>
                    <th className="p-3">Số lượng</th>
                    <th className="p-3">Thiệt hại</th>
                    <th className="p-3">Lý do hủy</th>
                    <th className="p-3">Người thực hiện</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                  {voidLogs.map((log, idx) => (
                    <tr key={log.id ? `${log.id}-${idx}` : `void-${idx}`} className="hover:bg-red-50/40 dark:hover:bg-red-950/20">
                      <td className="p-3 text-stone-500">{log.timestamp}</td>
                      <td className="p-3 font-bold">{log.tableName}</td>
                      <td className="p-3 font-bold text-red-600">{log.productName}</td>
                      <td className="p-3 font-bold">{log.quantity}</td>
                      <td className="p-3 font-bold text-stone-900 dark:text-stone-100">
                        {(log.unitPrice * log.quantity).toLocaleString('vi-VN')}đ
                      </td>
                      <td className="p-3 text-stone-700 dark:text-stone-300 italic">{log.reason}</td>
                      <td className="p-3 font-bold">
                        {log.staffName} ({log.role})
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* SETTINGS TAB */}
      {activeTab === 'SETTINGS' && (
        <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-5 shadow-xs space-y-5">
          <div className="flex items-center gap-2 border-b border-stone-200 dark:border-stone-800 pb-3">
            <Building2 className="w-5 h-5 text-amber-500" />
            <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
              Cài Đặt Cửa Hàng & Tài Khoản Ngân Hàng Sacombank
            </h3>
          </div>

          <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                  Tên quán:
                </label>
                <input
                  type="text"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                  Số điện thoại hotline:
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                Địa chỉ quán:
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800"
              />
            </div>

            <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/60 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-blue-200/80 dark:border-blue-800">
                <div>
                  <h4 className="font-bold text-blue-900 dark:text-blue-300 text-xs sm:text-sm flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-blue-600" />
                    Cấu Hình Tài Khoản Ngân Hàng & Mã QR Nhận Tiền (VietQR Napas 24/7)
                  </h4>
                  <p className="text-[11px] text-stone-500 mt-0.5">
                    Hỗ trợ 100% tất cả ngân hàng tại Việt Nam. Khách dùng bất kỳ app ngân hàng nào đều quét thanh toán được ngay.
                  </p>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 w-fit">
                  Đang dùng: {bankName} ({bankCode})
                </span>
              </div>

              {/* Bank Selector */}
              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                  Chọn Ngân Hàng Nhận Tiền:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-1.5 max-h-40 overflow-y-auto p-2 bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 shadow-inner">
                  {POPULAR_VIETNAMESE_BANKS.map((b) => {
                    const isSelected = bankCode === b.code || bankName.toLowerCase() === b.shortName.toLowerCase();
                    return (
                      <button
                        key={b.code}
                        type="button"
                        onClick={() => {
                          setBankCode(b.code);
                          setBankName(b.shortName);
                        }}
                        className={`p-2 rounded-lg text-left transition border text-xs cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? 'bg-blue-50 dark:bg-blue-950/80 border-blue-500 text-blue-900 dark:text-blue-100 font-bold ring-2 ring-blue-500 shadow-xs'
                            : 'border-stone-200 dark:border-stone-700 hover:border-blue-300 text-stone-700 dark:text-stone-300'
                        }`}
                      >
                        <span className="font-black text-xs">{b.shortName}</span>
                        <span className="text-[9px] text-stone-400 font-mono">{b.code}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-medium text-stone-600 dark:text-stone-400 mb-1 text-xs">
                    Tên ngân hàng (tùy chỉnh):
                  </label>
                  <input
                    type="text"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    placeholder="Sacombank / Vietcombank / MB..."
                    className="w-full p-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 font-bold uppercase text-xs"
                  />
                </div>

                <div>
                  <label className="block font-medium text-stone-600 dark:text-stone-400 mb-1 text-xs">
                    Số tài khoản nhận tiền:
                  </label>
                  <input
                    type="text"
                    value={bankAccount}
                    onChange={(e) => setBankAccount(e.target.value)}
                    placeholder="Nhập số tài khoản"
                    className="w-full p-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 font-mono font-bold text-blue-600 text-xs"
                  />
                </div>

                <div>
                  <label className="block font-medium text-stone-600 dark:text-stone-400 mb-1 text-xs">
                    Tên chủ tài khoản:
                  </label>
                  <input
                    type="text"
                    value={accountHolder}
                    onChange={(e) => setAccountHolder(e.target.value)}
                    placeholder="NGUYEN VAN A"
                    className="w-full p-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 font-bold uppercase text-stone-900 dark:text-stone-100 text-xs"
                  />
                </div>
              </div>

              {/* Bank API Token & Webhook Configuration */}
              <div className="pt-3 border-t border-stone-200 dark:border-stone-700 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-xs font-black text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                      <span>⚡ Tự Động Xác Nhận Khi Ngân Hàng Báo Có (Bank API & Webhook)</span>
                    </label>
                    <p className="text-[11px] text-stone-500 mt-0.5">
                      Hệ thống tự động phát hiện khi khách quét QR Sacombank chuyển khoản thành công, chốt đơn và in bill ngay lập tức.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={enableAutoBankConfirmation}
                    onChange={(e) => setEnableAutoBankConfirmation(e.target.checked)}
                    className="w-5 h-5 rounded text-amber-600 focus:ring-amber-500 border-amber-300 cursor-pointer"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-[11px] font-bold text-stone-600 dark:text-stone-400 mb-1">
                      API Token Ngân hàng (SePay / Casso / Bank Gateway):
                    </label>
                    <input
                      type="password"
                      value={bankApiKey}
                      onChange={(e) => setBankApiKey(e.target.value)}
                      placeholder="Nhập API Token SePay hoặc để trống nếu dùng Webhook"
                      className="w-full p-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-xs font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-stone-600 dark:text-stone-400 mb-1">
                      Đường dẫn Webhook Ngân hàng (Dán vào SePay/Casso/Ngân hàng):
                    </label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        readOnly
                        value={typeof window !== 'undefined' ? `${window.location.origin}/api/payment/bank-webhook` : '/api/payment/bank-webhook'}
                        className="w-full p-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-100 dark:bg-stone-800 text-[11px] font-mono select-all text-stone-700 dark:text-stone-300"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const url = `${window.location.origin}/api/payment/bank-webhook`;
                          navigator.clipboard.writeText(url);
                          alert('Đã sao chép đường dẫn Webhook vào bộ nhớ đệm!');
                        }}
                        className="px-2.5 py-2 rounded-xl bg-stone-200 dark:bg-stone-700 hover:bg-stone-300 dark:hover:bg-stone-600 text-xs font-bold shrink-0 cursor-pointer"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                Lời chào chân hóa đơn in nhiệt:
              </label>
              <input
                type="text"
                value={receiptFooter}
                onChange={(e) => setReceiptFooter(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800"
              />
            </div>

            {/* Tự động in hóa đơn */}
            <div className="p-3.5 bg-amber-50/70 dark:bg-amber-950/30 rounded-2xl border border-amber-200 dark:border-amber-800/60 flex items-center justify-between">
              <div>
                <label className="font-bold text-xs text-stone-900 dark:text-stone-100 flex items-center gap-1.5 cursor-pointer">
                  <span>🖨️ Tự động in bill khi khách thanh toán thành công</span>
                </label>
                <p className="text-[11px] text-stone-500 mt-0.5">
                  Khi thu ngân xác nhận đã thu tiền hoặc quét QR thành công, hệ thống sẽ tự động gửi lệnh in hóa đơn 80mm ngay lập tức.
                </p>
              </div>
              <input
                type="checkbox"
                checked={autoPrintOnPayment}
                onChange={(e) => setAutoPrintOnPayment(e.target.checked)}
                className="w-5 h-5 rounded text-amber-600 focus:ring-amber-500 border-amber-300 cursor-pointer"
              />
            </div>

            <div className="flex justify-end pt-3">
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-950 font-black text-xs shadow-xs flex items-center gap-1.5 transition"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Lưu Thay Đổi Cài Đặt</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
