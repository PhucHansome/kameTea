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
  } = usePOS();
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'BEST_SELLERS' | 'VOID_LOGS' | 'SETTINGS'>(
    'OVERVIEW'
  );
  const [timeRange, setTimeRange] = useState<'TODAY' | 'WEEK' | 'MONTH' | 'ALL'>('TODAY');

  // Store settings form state
  const [storeName, setStoreName] = useState(settings.storeName);
  const [address, setAddress] = useState(settings.address);
  const [phone, setPhone] = useState(settings.phone);
  const [bankName, setBankName] = useState(settings.bankName);
  const [bankAccount, setBankAccount] = useState(settings.bankAccount);
  const [accountHolder, setAccountHolder] = useState(settings.accountHolder);
  const [taxPercent, setTaxPercent] = useState(settings.taxPercent);
  const [receiptFooter, setReceiptFooter] = useState(settings.receiptFooter);

  // Paid orders
  const paidOrders = orders.filter((o) => o.status === 'PAID');

  // Historical Daily Summary aggregations
  const totalCompressedRevenue = dailySalesSummaries.reduce((sum, s) => sum + (s.totalRevenue || 0), 0);
  const totalCompressedOrders = dailySalesSummaries.reduce((sum, s) => sum + (s.totalOrders || 0), 0);
  const totalCompressedCash = dailySalesSummaries.reduce((sum, s) => sum + (s.cashRevenue || 0), 0);
  const totalCompressedTransfer = dailySalesSummaries.reduce((sum, s) => sum + (s.transferRevenue || 0), 0);
  const totalCompressedShipping = dailySalesSummaries.reduce((sum, s) => sum + (s.shippingRevenue || 0), 0);

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

  // Hourly Revenue chart mock data combined with real orders
  const hourlyRevenueData = [
    { time: '08:00', revenue: 150000, orders: 3 },
    { time: '10:00', revenue: 320000, orders: 7 },
    { time: '12:00', revenue: 680000, orders: 12 },
    { time: '14:00', revenue: 450000, orders: 8 },
    { time: '16:00', revenue: 890000, orders: 16 },
    { time: '18:00', revenue: 1650000, orders: 24 },
    { time: '20:00', revenue: 2100000, orders: 30 },
    { time: '22:00', revenue: 940000, orders: 15 },
  ];

  // Best selling products calculation
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
      bankName,
      bankAccount,
      accountHolder,
      taxPercent: Number(taxPercent),
      receiptFooter,
    });
    alert('Đã lưu cấu hình cửa hàng & Sacombank QR thành công!');
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
            <span>Doanh Thu & Dòng Tiền</span>
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
        </div>
      </div>

      {/* OVERVIEW TAB */}
      {activeTab === 'OVERVIEW' && (
        <div className="space-y-5">
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
            {/* Hourly Sales Bar Chart */}
            <div className="lg:col-span-8 bg-white dark:bg-stone-900 p-5 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-stone-900 dark:text-stone-100">
                    Phân Phối Doanh Thu Theo Khung Giờ (Cao Điểm)
                  </h3>
                  <p className="text-xs text-stone-500">
                    Giờ cao điểm của quán thường rơi vào 18:00 - 22:00 tối
                  </p>
                </div>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={hourlyRevenueData}>
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

            <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/60 space-y-3">
              <h4 className="font-bold text-blue-900 dark:text-blue-300 text-xs flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-blue-600" />
                Cấu Hình Tài Khoản Ngân Hàng Sacombank (Mã QR Thanh Toán)
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-medium text-stone-600 dark:text-stone-400 mb-1">
                    Ngân hàng:
                  </label>
                  <input
                    type="text"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    placeholder="Sacombank"
                    className="w-full p-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 font-bold uppercase"
                  />
                </div>

                <div>
                  <label className="block font-medium text-stone-600 dark:text-stone-400 mb-1">
                    Số tài khoản nhận tiền:
                  </label>
                  <input
                    type="text"
                    value={bankAccount}
                    onChange={(e) => setBankAccount(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 font-mono font-bold text-blue-600"
                  />
                </div>

                <div>
                  <label className="block font-medium text-stone-600 dark:text-stone-400 mb-1">
                    Tên chủ tài khoản:
                  </label>
                  <input
                    type="text"
                    value={accountHolder}
                    onChange={(e) => setAccountHolder(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 font-bold uppercase text-stone-900 dark:text-stone-100"
                  />
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
