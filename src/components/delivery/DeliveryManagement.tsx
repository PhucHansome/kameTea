import React, { useState } from 'react';
import { usePOS } from '../../context/POSContext';
import {
  Order,
  OrderItem,
  Product,
  DeliveryStatus,
  PaymentMethodType,
} from '../../types/pos';
import {
  Bike,
  Plus,
  Search,
  Phone,
  MapPin,
  Clock,
  CheckCircle2,
  AlertCircle,
  Truck,
  PackageCheck,
  Printer,
  DollarSign,
  User,
  ShoppingBag,
  X,
  CreditCard,
  ChevronRight,
  Filter,
  Check,
  Receipt,
  RotateCcw,
} from 'lucide-react';
import { BillCheckoutModal } from '../pos/BillCheckoutModal';

interface DeliveryManagementProps {
  hideStats?: boolean;
}

export const DeliveryManagement: React.FC<DeliveryManagementProps> = ({ hideStats = false }) => {
  const {
    orders,
    products,
    categories,
    activeUser,
    updateOrderDetails,
    completePayment,
    showToast,
    settings,
  } = usePOS();

  const [selectedFilter, setSelectedFilter] = useState<
    'ALL' | 'PENDING' | 'PREPARING' | 'DELIVERING' | 'COMPLETED' | 'CANCELLED'
  >('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [checkoutOrder, setCheckoutOrder] = useState<Order | null>(null);

  // New Order Modal Form State
  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [shippingFee, setShippingFee] = useState<number>(settings.defaultShippingFee || 15000);
  const [customerNote, setCustomerNote] = useState('');
  const [shipperName, setShipperName] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>('CASH');
  const [cartItems, setCartItems] = useState<OrderItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // Filter delivery orders (orders with orderType === 'DELIVERY' or TAKEAWAY with deliveryAddress)
  const deliveryOrders = orders.filter(
    (o) => o.orderType === 'DELIVERY' || (o.orderType === 'TAKEAWAY' && Boolean(o.deliveryAddress))
  );

  const filteredOrders = deliveryOrders.filter((o) => {
    // Status filter
    if (selectedFilter !== 'ALL') {
      const status = o.deliveryStatus || (o.status === 'PAID' ? 'COMPLETED' : 'PENDING');
      if (status !== selectedFilter) return false;
    }
    // Search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const codeMatch = (o.orderCode || '').toLowerCase().includes(term);
      const phoneMatch = (o.deliveryPhone || o.customerPhone || '').toLowerCase().includes(term);
      const nameMatch = (o.deliveryRecipientName || '').toLowerCase().includes(term);
      const addressMatch = (o.deliveryAddress || '').toLowerCase().includes(term);
      return codeMatch || phoneMatch || nameMatch || addressMatch;
    }
    return true;
  });

  // KPI Metrics
  const pendingCount = deliveryOrders.filter(
    (o) => (o.deliveryStatus === 'PENDING' || !o.deliveryStatus) && o.status !== 'PAID' && o.status !== 'CANCELLED'
  ).length;
  const preparingCount = deliveryOrders.filter((o) => o.deliveryStatus === 'PREPARING').length;
  const deliveringCount = deliveryOrders.filter((o) => o.deliveryStatus === 'DELIVERING').length;
  const completedTodayCount = deliveryOrders.filter((o) => o.status === 'PAID').length;
  const totalDeliveryRevenue = deliveryOrders
    .filter((o) => o.status === 'PAID')
    .reduce((sum, o) => sum + (o.finalTotal || o.totalAmount), 0);

  // Cart helpers
  const handleAddProductToCart = (product: Product) => {
    setCartItems((prev) => {
      const existing = prev.find((item) => item.productId === product.id);
      if (existing) {
        return prev.map((item) =>
          item.productId === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      const newItem: OrderItem = {
        id: `deliv-item-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
        productId: product.id,
        productName: product.name,
        station: product.station,
        unitPrice: product.basePrice,
        quantity: 1,
        selectedToppings: [],
        status: 'PENDING',
        createdAt: new Date().toISOString(),
      };
      return [...prev, newItem];
    });
  };

  const handleUpdateCartQty = (id: string, delta: number) => {
    setCartItems((prev) =>
      prev
        .map((item) => {
          if (item.id === id) {
            const newQ = item.quantity + delta;
            return newQ > 0 ? { ...item, quantity: newQ } : null;
          }
          return item;
        })
        .filter(Boolean) as OrderItem[]
    );
  };

  const cartSubtotal = cartItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const cartTotal = cartSubtotal + Number(shippingFee || 0);

  // Create Delivery Order
  const handleCreateDeliveryOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cartItems.length === 0) {
      showToast('error', 'Chưa có món', 'Vui lòng chọn ít nhất 1 món ăn để tạo đơn giao hàng.');
      return;
    }
    if (!recipientPhone.trim()) {
      showToast('error', 'Thiếu số điện thoại', 'Vui lòng nhập số điện thoại người nhận hàng.');
      return;
    }
    if (!deliveryAddress.trim()) {
      showToast('error', 'Thiếu địa chỉ', 'Vui lòng nhập địa chỉ giao hàng.');
      return;
    }

    const orderId = `order-deliv-${Date.now()}`;
    const orderCode = `#SHIP-${new Date().getHours()}${new Date().getMinutes()}-${Math.floor(100 + Math.random() * 900)}`;

    const newDeliveryOrder: Order = {
      id: orderId,
      orderCode,
      tableId: 'delivery-virtual-table',
      tableName: `Ship: ${recipientName || recipientPhone}`,
      zone: 'Giao Hàng (Ship)',
      orderType: 'DELIVERY',
      shippingFee: Number(shippingFee) || 0,
      deliveryAddress: deliveryAddress.trim(),
      deliveryPhone: recipientPhone.trim(),
      deliveryRecipientName: recipientName.trim() || 'Khách đặt ship',
      deliveryShipperName: shipperName.trim() || undefined,
      deliveryStatus: 'PENDING',
      serverName: activeUser.name,
      serverId: activeUser.id,
      guestCount: 1,
      status: 'ACTIVE',
      items: cartItems,
      subtotal: cartSubtotal,
      discountPercent: 0,
      discountAmount: 0,
      taxAmount: 0,
      totalAmount: cartTotal,
      paymentMethod,
      customerNote: customerNote.trim() || undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Save order via updateOrderDetails or direct insert
    await updateOrderDetails(orderId, newDeliveryOrder);

    showToast('success', 'Tạo đơn ship thành công', `Đơn giao hàng ${orderCode} đã được lưu vào hệ thống!`);
    setIsCreatingOrder(false);
    // Reset form
    setRecipientName('');
    setRecipientPhone('');
    setDeliveryAddress('');
    setShipperName('');
    setCustomerNote('');
    setCartItems([]);
  };

  // Update Delivery Status Handler
  const handleUpdateStatus = async (order: Order, newStatus: DeliveryStatus) => {
    const updates: Partial<Order> = {
      deliveryStatus: newStatus,
      updatedAt: new Date().toISOString(),
    };

    if (newStatus === 'COMPLETED' && order.status !== 'PAID') {
      // Mark as paid
      await completePayment(order.id, order.paymentMethod || 'CASH', 0, 0, {
        shippingFee: order.shippingFee,
      });
      showToast('success', 'Hoàn tất đơn ship', `Đơn ${order.orderCode} đã giao thành công và ghi nhận doanh thu!`);
      return;
    }

    await updateOrderDetails(order.id, updates);
    showToast('info', 'Cập nhật giao hàng', `Đơn ${order.orderCode} đã chuyển sang trạng thái: ${newStatus}`);
  };

  // Print Delivery Bill
  const handlePrintDeliverySlip = (order: Order) => {
    window.print();
  };

  const availableProducts = products.filter((p) => p.isAvailable);
  const filteredProducts =
    selectedCategory === 'ALL'
      ? availableProducts
      : availableProducts.filter((p) => p.categoryId === selectedCategory);

  return (
    <div className="space-y-6">
      {/* Top Banner & Title */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-slate-950 shadow-md">
            <Bike className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              Quản Lý Đơn Ship & Giao Hàng
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Hệ thống điều phối shipper, theo dõi địa chỉ, cước phí ship và thu hộ COD.
            </p>
          </div>
        </div>

        {/* Action Button */}
        <button
          type="button"
          onClick={() => setIsCreatingOrder(true)}
          className="px-5 py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition active:scale-[0.98] cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>+ Tạo Đơn Giao Hàng (Ship)</span>
        </button>
      </div>

      {/* KPI Metric Cards */}
      {!hideStats && (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
          {/* Metric 1: Pending */}
          <div
            onClick={() => setSelectedFilter('PENDING')}
            className={`p-4 rounded-2xl border transition cursor-pointer ${
              selectedFilter === 'PENDING'
                ? 'bg-amber-500/15 border-amber-500'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-amber-400'
            }`}
          >
            <div className="flex items-center justify-between text-amber-600 dark:text-amber-400 text-xs font-bold uppercase">
              <span>Chờ chuẩn bị</span>
              <Clock className="w-4 h-4" />
            </div>
            <p className="text-2xl font-black text-slate-900 dark:text-white mt-1.5 font-mono">
              {pendingCount}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">Đơn mới tiếp nhận</p>
          </div>

          {/* Metric 2: Preparing */}
          <div
            onClick={() => setSelectedFilter('PREPARING')}
            className={`p-4 rounded-2xl border transition cursor-pointer ${
              selectedFilter === 'PREPARING'
                ? 'bg-orange-500/15 border-orange-500'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-orange-400'
            }`}
          >
            <div className="flex items-center justify-between text-orange-600 dark:text-orange-400 text-xs font-bold uppercase">
              <span>Đang đóng gói</span>
              <PackageCheck className="w-4 h-4" />
            </div>
            <p className="text-2xl font-black text-slate-900 dark:text-white mt-1.5 font-mono">
              {preparingCount}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">Bếp đang nấu</p>
          </div>

          {/* Metric 3: Delivering */}
          <div
            onClick={() => setSelectedFilter('DELIVERING')}
            className={`p-4 rounded-2xl border transition cursor-pointer ${
              selectedFilter === 'DELIVERING'
                ? 'bg-blue-500/15 border-blue-500'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-blue-400'
            }`}
          >
            <div className="flex items-center justify-between text-blue-600 dark:text-blue-400 text-xs font-bold uppercase">
              <span>Đang giao hàng</span>
              <Truck className="w-4 h-4" />
            </div>
            <p className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1.5 font-mono">
              {deliveringCount}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">Shipper đang trên đường</p>
          </div>

          {/* Metric 4: Completed */}
          <div
            onClick={() => setSelectedFilter('COMPLETED')}
            className={`p-4 rounded-2xl border transition cursor-pointer ${
              selectedFilter === 'COMPLETED'
                ? 'bg-emerald-500/15 border-emerald-500'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-emerald-400'
            }`}
          >
            <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase">
              <span>Đã giao thành công</span>
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1.5 font-mono">
              {completedTodayCount}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">Đã thanh toán & hoàn tất</p>
          </div>

          {/* Metric 5: Total Ship Revenue */}
          <div className="col-span-2 sm:col-span-1 p-4 rounded-2xl bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-transparent border border-amber-500/30">
            <div className="flex items-center justify-between text-amber-600 dark:text-amber-400 text-xs font-bold uppercase">
              <span>Doanh thu ship</span>
              <DollarSign className="w-4 h-4" />
            </div>
            <p className="text-xl font-black text-amber-600 dark:text-amber-400 mt-1.5 font-mono truncate">
              {totalDeliveryRevenue.toLocaleString('vi-VN')}đ
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">Đơn ship hoàn tất</p>
          </div>
        </div>
      )}

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 p-1 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setSelectedFilter('ALL')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
              selectedFilter === 'ALL'
                ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Tất cả ({deliveryOrders.length})
          </button>
          <button
            type="button"
            onClick={() => setSelectedFilter('PENDING')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
              selectedFilter === 'PENDING'
                ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Chờ xử lý ({pendingCount})
          </button>
          <button
            type="button"
            onClick={() => setSelectedFilter('PREPARING')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
              selectedFilter === 'PREPARING'
                ? 'bg-orange-500 text-white font-black shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Đang làm ({preparingCount})
          </button>
          <button
            type="button"
            onClick={() => setSelectedFilter('DELIVERING')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
              selectedFilter === 'DELIVERING'
                ? 'bg-blue-600 text-white font-black shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Đang giao ({deliveringCount})
          </button>
          <button
            type="button"
            onClick={() => setSelectedFilter('COMPLETED')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
              selectedFilter === 'COMPLETED'
                ? 'bg-emerald-600 text-white font-black shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Hoàn tất ({completedTodayCount})
          </button>
        </div>

        {/* Search box */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm theo mã đơn, SĐT, tên khách, địa chỉ..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 text-xs focus:outline-hidden focus:border-amber-500"
          />
        </div>
      </div>

      {/* Delivery Orders Grid / Cards */}
      {filteredOrders.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="w-16 h-16 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-500 mx-auto flex items-center justify-center">
            <Bike className="w-8 h-8" />
          </div>
          <h3 className="text-base font-black text-slate-900 dark:text-white">
            Không Có Đơn Giao Hàng Nào
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Chưa có đơn ship nào trong danh mục này. Bấm vào nút "Tạo Đơn Giao Hàng" để tạo đơn ship mới cho khách hàng!
          </p>
          <button
            type="button"
            onClick={() => setIsCreatingOrder(true)}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs inline-flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Tạo đơn ship ngay</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredOrders.map((order) => {
            const status =
              order.deliveryStatus || (order.status === 'PAID' ? 'COMPLETED' : 'PENDING');
            const totalItemsCount = order.items.reduce((sum, it) => sum + it.quantity, 0);

            return (
              <div
                key={order.id}
                className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-amber-400 transition group"
              >
                {/* Header */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-black text-sm text-slate-900 dark:text-white">
                        {order.orderCode}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(order.createdAt).toLocaleTimeString('vi-VN', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    {/* Status Badge */}
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        status === 'COMPLETED'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                          : status === 'DELIVERING'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 animate-pulse'
                          : status === 'PREPARING'
                          ? 'bg-orange-100 text-orange-800 dark:bg-orange-950/60 dark:text-orange-300'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                      }`}
                    >
                      {status === 'COMPLETED'
                        ? 'Đã giao & thu tiền'
                        : status === 'DELIVERING'
                        ? 'Đang giao hàng'
                        : status === 'PREPARING'
                        ? 'Bếp đang nấu'
                        : 'Chờ đóng gói'}
                    </span>
                  </div>

                  {/* Recipient & Address Info */}
                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-amber-500" />
                        {order.deliveryRecipientName || 'Khách lẻ'}
                      </span>
                      <a
                        href={`tel:${order.deliveryPhone}`}
                        className="font-mono font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1 hover:underline"
                      >
                        <Phone className="w-3 h-3" />
                        {order.deliveryPhone || 'Chưa có SĐT'}
                      </a>
                    </div>

                    <div className="flex items-start gap-1.5 text-slate-600 dark:text-slate-300 text-[11px]">
                      <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                      <span className="line-clamp-2">{order.deliveryAddress || 'Nhận tại quầy'}</span>
                    </div>

                    {order.deliveryShipperName && (
                      <div className="pt-1 border-t border-slate-200 dark:border-slate-700 text-[10px] text-slate-500 flex items-center justify-between">
                        <span>Shipper phụ trách:</span>
                        <span className="font-bold text-blue-600 dark:text-blue-400">
                          {order.deliveryShipperName}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Items List */}
                  <div className="space-y-1.5">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Món cần giao ({totalItemsCount} phần):
                    </p>
                    <div className="max-h-28 overflow-y-auto space-y-1 pr-1 text-xs">
                      {order.items.map((item) => (
                        <div
                          key={item.id}
                          className="flex justify-between items-center text-slate-700 dark:text-slate-300"
                        >
                          <span className="truncate">
                            <strong className="text-amber-600">{item.quantity}x</strong>{' '}
                            {item.productName}
                            {item.selectedCookingMethod ? ` (${item.selectedCookingMethod.name})` : ''}
                          </span>
                          <span className="font-mono text-slate-500 text-[11px] shrink-0">
                            {(item.unitPrice * item.quantity).toLocaleString('vi-VN')}đ
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Bottom Total & Actions */}
                <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500">
                      Phí ship: <strong className="text-purple-600">{order.shippingFee.toLocaleString('vi-VN')}đ</strong>
                    </span>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block">Tổng thu COD:</span>
                      <span className="font-black text-base font-mono text-amber-600 dark:text-amber-400">
                        {(order.finalTotal || order.totalAmount).toLocaleString('vi-VN')}đ
                      </span>
                    </div>
                  </div>

                  {/* Action Bar */}
                  <div className="flex items-center gap-2">
                    {status === 'PENDING' && (
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus(order, 'PREPARING')}
                        className="flex-1 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition"
                      >
                        <PackageCheck className="w-3.5 h-3.5" />
                        <span>Bắt đầu đóng gói</span>
                      </button>
                    )}

                    {status === 'PREPARING' && (
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus(order, 'DELIVERING')}
                        className="flex-1 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition"
                      >
                        <Truck className="w-3.5 h-3.5" />
                        <span>Giao cho Shipper</span>
                      </button>
                    )}

                    {status === 'DELIVERING' && (
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus(order, 'COMPLETED')}
                        className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Đã giao & Thu tiền</span>
                      </button>
                    )}

                    {status === 'COMPLETED' && (
                      <div className="flex-1 py-2 text-center text-xs font-bold text-emerald-600 flex items-center justify-center gap-1">
                        <Check className="w-4 h-4" />
                        <span>Đã thu tiền & xong</span>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => handlePrintDeliverySlip(order)}
                      title="In hóa đơn ship"
                      className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                    >
                      <Printer className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE NEW DELIVERY ORDER MODAL */}
      {isCreatingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-4xl w-full h-[90vh] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col">
            {/* Header */}
            <div className="p-4 sm:p-5 bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-transparent border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-amber-500 text-slate-950 shadow-md">
                  <Bike className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base text-slate-900 dark:text-white">
                    Tạo Đơn Giao Hàng & Ship Mới
                  </h3>
                  <p className="text-xs text-slate-500">
                    Điền thông tin khách hàng, chọn món và cấu hình phí vận chuyển
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsCreatingOrder(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body: 2 columns */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
              {/* Left Column: Menu Selector (7 cols) */}
              <div className="lg:col-span-7 border-r border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden">
                {/* Category tabs */}
                <div className="p-3 bg-slate-50 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 flex gap-2 overflow-x-auto no-scrollbar shrink-0">
                  <button
                    type="button"
                    onClick={() => setSelectedCategory('ALL')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                      selectedCategory === 'ALL'
                        ? 'bg-amber-500 text-slate-950 font-black'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    Tất cả ({availableProducts.length})
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 ${
                        selectedCategory === cat.id
                          ? 'bg-amber-500 text-slate-950 font-black'
                          : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      <span>{cat.icon}</span>
                      <span>{cat.name}</span>
                    </button>
                  ))}
                </div>

                {/* Product Grid */}
                <div className="flex-1 overflow-y-auto p-3 grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {filteredProducts.map((prod) => (
                    <button
                      key={prod.id}
                      type="button"
                      onClick={() => handleAddProductToCart(prod)}
                      className="p-3 bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700/80 text-left hover:border-amber-500 transition flex flex-col justify-between h-28 group"
                    >
                      <div>
                        <h4 className="font-bold text-xs text-slate-900 dark:text-white line-clamp-2">
                          {prod.name}
                        </h4>
                        <span className="text-[10px] text-slate-400">/{prod.unit}</span>
                      </div>
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 dark:border-slate-700/60">
                        <span className="font-black text-amber-600 dark:text-amber-400 text-xs font-mono">
                          {prod.basePrice.toLocaleString('vi-VN')}đ
                        </span>
                        <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-600 group-hover:bg-amber-500 group-hover:text-slate-950 flex items-center justify-center transition">
                          <Plus className="w-3.5 h-3.5" />
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Right Column: Customer Info & Cart (5 cols) */}
              <form
                onSubmit={handleCreateDeliveryOrder}
                className="lg:col-span-5 flex flex-col justify-between overflow-hidden bg-slate-50 dark:bg-slate-850 p-4 space-y-4"
              >
                <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 text-xs">
                  {/* Recipient Details */}
                  <div className="space-y-2">
                    <label className="font-black text-slate-700 dark:text-slate-300 block uppercase tracking-wider text-[10px]">
                      Thông Tin Người Nhận:
                    </label>

                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Tên khách nhận *"
                        required
                        value={recipientName}
                        onChange={(e) => setRecipientName(e.target.value)}
                        className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 text-xs focus:outline-hidden focus:border-amber-500"
                      />
                      <input
                        type="tel"
                        placeholder="Số điện thoại *"
                        required
                        value={recipientPhone}
                        onChange={(e) => setRecipientPhone(e.target.value)}
                        className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 text-xs focus:outline-hidden focus:border-amber-500 font-mono"
                      />
                    </div>

                    <input
                      type="text"
                      placeholder="Địa chỉ giao hàng chi tiết (Số nhà, ngõ, đường) *"
                      required
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 text-xs focus:outline-hidden focus:border-amber-500"
                    />

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 block mb-1">
                          Phí ship (VNĐ):
                        </label>
                        <input
                          type="number"
                          step={1000}
                          value={shippingFee}
                          onChange={(e) => setShippingFee(Number(e.target.value))}
                          className="w-full p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-mono font-bold"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 block mb-1">
                          Shipper giao (Tùy chọn):
                        </label>
                        <input
                          type="text"
                          placeholder="Tên shipper..."
                          value={shipperName}
                          onChange={(e) => setShipperName(e.target.value)}
                          className="w-full p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs"
                        />
                      </div>
                    </div>

                    <input
                      type="text"
                      placeholder="Ghi chú cho bếp / shipper..."
                      value={customerNote}
                      onChange={(e) => setCustomerNote(e.target.value)}
                      className="w-full p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 text-xs"
                    />
                  </div>

                  {/* Selected Cart Items */}
                  <div className="space-y-1.5 pt-2 border-t border-slate-200 dark:border-slate-700">
                    <div className="flex justify-between items-center text-[10px] font-black text-slate-500 uppercase tracking-wider">
                      <span>Món đã chọn ({cartItems.length}):</span>
                      <span>Thành tiền</span>
                    </div>

                    {cartItems.length === 0 ? (
                      <p className="text-center py-4 text-slate-400 italic text-xs">
                        Chưa chọn món nào từ thực đơn bên trái.
                      </p>
                    ) : (
                      <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                        {cartItems.map((item) => (
                          <div
                            key={item.id}
                            className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2"
                          >
                            <div className="min-w-0 flex-1">
                              <p className="font-bold text-slate-900 dark:text-white truncate">
                                {item.productName}
                              </p>
                              <span className="text-[10px] text-slate-400 font-mono">
                                {item.unitPrice.toLocaleString('vi-VN')}đ
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg">
                              <button
                                type="button"
                                onClick={() => handleUpdateCartQty(item.id, -1)}
                                className="w-5 h-5 rounded flex items-center justify-center font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                              >
                                -
                              </button>
                              <span className="font-black text-xs w-4 text-center">
                                {item.quantity}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleUpdateCartQty(item.id, 1)}
                                className="w-5 h-5 rounded flex items-center justify-center font-bold text-amber-600 dark:text-amber-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Total & Submit */}
                <div className="space-y-3 pt-3 border-t border-slate-200 dark:border-slate-700 shrink-0">
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between text-slate-500">
                      <span>Tiền món:</span>
                      <span className="font-mono">{cartSubtotal.toLocaleString('vi-VN')}đ</span>
                    </div>
                    <div className="flex justify-between text-slate-500">
                      <span>Phí giao hàng:</span>
                      <span className="font-mono font-bold text-purple-600">
                        {Number(shippingFee || 0).toLocaleString('vi-VN')}đ
                      </span>
                    </div>
                    <div className="flex justify-between text-sm font-black text-slate-900 dark:text-white pt-1 border-t border-slate-200 dark:border-slate-700">
                      <span>Tổng Thu Khách:</span>
                      <span className="text-amber-600 dark:text-amber-400 font-mono text-base">
                        {cartTotal.toLocaleString('vi-VN')}đ
                      </span>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={cartItems.length === 0}
                    className="w-full py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-black text-sm shadow-md transition active:scale-[0.98] cursor-pointer"
                  >
                    Xác Nhận & Tạo Đơn Giao Hàng
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
