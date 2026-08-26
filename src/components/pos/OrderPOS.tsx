import React, { useState, useEffect } from 'react';
import { usePOS } from '../../context/POSContext';
import { Product, TableItem, OrderItem, OrderType } from '../../types/pos';
import { CustomizationModal } from './CustomizationModal';
import {
  ArrowLeft,
  Search,
  Plus,
  Minus,
  Trash2,
  Send,
  CreditCard,
  ArrowRightLeft,
  Sparkles,
  Users,
  Flame,
  CupSoda,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Bike,
  UtensilsCrossed,
  MapPin,
  Phone,
  ReceiptText,
  Receipt,
} from 'lucide-react';

interface OrderPOSProps {
  table: TableItem;
  onBackToTables: () => void;
  onOpenCheckout: (table: TableItem) => void;
  onOpenSplitMerge: (table: TableItem) => void;
}

export const OrderPOS: React.FC<OrderPOSProps> = ({
  table,
  onBackToTables,
  onOpenCheckout,
  onOpenSplitMerge,
}) => {
  const {
    categories,
    products,
    cartItems,
    addToCart,
    updateCartItemQuantity,
    removeCartItem,
    clearCart,
    cartTotal,
    sendCartToKitchen,
    activeOrder,
    cancelOrderItem,
    updateOrderDetails,
  } = usePOS();

  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [stationFilter, setStationFilter] = useState<'ALL' | 'BAR' | 'KITCHEN'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [guestCount, setGuestCount] = useState<number>(table.guestCount || table.capacity || 2);
  const [customizingProduct, setCustomizingProduct] = useState<Product | null>(null);

  // Takeaway / Dine-in and Shipping Fee states
  const isTakeawayZone = table.zone === 'Mang Về' || table.name.toLowerCase().includes('mang về');
  const [orderType, setOrderType] = useState<OrderType>(() => {
    if (activeOrder?.orderType) return activeOrder.orderType;
    return isTakeawayZone ? 'TAKEAWAY' : 'DINE_IN';
  });
  const [shippingFee, setShippingFee] = useState<number>(activeOrder?.shippingFee || 0);
  const [deliveryAddress, setDeliveryAddress] = useState<string>(activeOrder?.deliveryAddress || '');
  const [deliveryPhone, setDeliveryPhone] = useState<string>(activeOrder?.deliveryPhone || '');
  const [customerNote, setCustomerNote] = useState<string>(activeOrder?.customerNote || '');

  // Sync if activeOrder updates
  useEffect(() => {
    if (activeOrder) {
      if (activeOrder.orderType) setOrderType(activeOrder.orderType);
      if (activeOrder.shippingFee !== undefined) setShippingFee(activeOrder.shippingFee);
      if (activeOrder.deliveryAddress) setDeliveryAddress(activeOrder.deliveryAddress);
      if (activeOrder.deliveryPhone) setDeliveryPhone(activeOrder.deliveryPhone);
      if (activeOrder.customerNote) setCustomerNote(activeOrder.customerNote);
    }
  }, [activeOrder]);

  const handleOrderTypeChange = (newType: OrderType) => {
    setOrderType(newType);
    const newFee = newType === 'DINE_IN' ? 0 : shippingFee;
    if (newType === 'DINE_IN') setShippingFee(0);
    if (activeOrder) {
      updateOrderDetails(activeOrder.id, {
        orderType: newType,
        shippingFee: newFee,
      });
    }
  };

  const handleShippingFeeChange = (fee: number) => {
    setShippingFee(fee);
    if (activeOrder) {
      updateOrderDetails(activeOrder.id, {
        shippingFee: fee,
      });
    }
  };

  const handleDeliveryInfoChange = (phone: string, address: string, note: string) => {
    setDeliveryPhone(phone);
    setDeliveryAddress(address);
    setCustomerNote(note);
    if (activeOrder) {
      updateOrderDetails(activeOrder.id, {
        deliveryPhone: phone,
        deliveryAddress: address,
        customerNote: note,
      });
    }
  };

  // Void modal state
  const [voidingItem, setVoidingItem] = useState<{ itemId: string; name: string } | null>(null);
  const [voidReason, setVoidReason] = useState<string>('Khách đổi món khác');
  const [showMobileCart, setShowMobileCart] = useState<boolean>(false);

  // Filter products
  const filteredProducts = products.filter((product) => {
    if (!product.isAvailable) return false;
    if (stationFilter !== 'ALL' && product.station !== stationFilter) return false;
    if (selectedCategory !== 'ALL' && product.categoryId !== selectedCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return product.name.toLowerCase().includes(q) || product.basePrice.toString().includes(q);
    }
    return true;
  });

  const handleProductClick = (product: Product) => {
    // If product has cooking methods, sizes, or toppings, open customization modal
    if (
      (product.cookingMethods && product.cookingMethods.length > 0) ||
      (product.sizes && product.sizes.length > 0) ||
      product.allowedToppings
    ) {
      setCustomizingProduct(product);
    } else {
      // Direct add
      addToCart(product);
    }
  };

  const handleSendToKitchen = () => {
    try {
      sendCartToKitchen(guestCount, {
        orderType,
        shippingFee: orderType === 'TAKEAWAY' ? shippingFee : 0,
        deliveryAddress,
        deliveryPhone,
        customerNote,
      });
    } catch (err: unknown) {
      alert((err as Error).message || 'Có lỗi xảy ra khi gửi bếp');
    }
  };

  const handleConfirmVoid = () => {
    if (!voidingItem || !activeOrder) return;
    if (!voidReason.trim()) {
      alert('Vui lòng nhập lý do hủy món');
      return;
    }
    cancelOrderItem(activeOrder.id, voidingItem.itemId, voidReason);
    setVoidingItem(null);
    setVoidReason('Khách đổi món khác');
  };

  const getItemStatusBadge = (status: OrderItem['status']) => {
    switch (status) {
      case 'PENDING':
        return {
          bg: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800',
          label: 'Chờ làm',
        };
      case 'COOKING':
        return {
          bg: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-300 dark:border-blue-800',
          label: 'Đang làm',
        };
      case 'DONE':
        return {
          bg: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800',
          label: 'Đã xong',
        };
      case 'SERVED':
        return {
          bg: 'bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300 border border-stone-300 dark:border-stone-700',
          label: 'Đã lên bàn',
        };
      case 'CANCELLED':
        return {
          bg: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300 border border-red-300 dark:border-red-800 line-through',
          label: 'Đã hủy',
        };
    }
  };

  const existingOrderSubtotal = activeOrder
    ? activeOrder.items.reduce(
        (sum, it) => (it.status !== 'CANCELLED' ? sum + it.unitPrice * it.quantity : sum),
        0
      )
    : 0;

  const currentShipping = orderType === 'TAKEAWAY' ? shippingFee : 0;
  const combinedTotal = existingOrderSubtotal + cartTotal + currentShipping;

  return (
    <div className="flex flex-col lg:flex-row gap-5 h-full">
      {/* LEFT COLUMN: Menu & Category Browser */}
      <div className="flex-1 flex flex-col space-y-4 min-w-0">
        {/* Top bar: Back, Table Info & Search */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-stone-900 p-4 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs">
          <div className="flex items-center gap-3">
            <button
              onClick={onBackToTables}
              className="p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 transition flex items-center gap-1.5 text-xs font-bold"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Sơ đồ bàn</span>
            </button>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-black text-amber-600 dark:text-amber-400 font-mono">
                  {table.code}
                </span>
                <span className="text-sm font-bold text-stone-900 dark:text-stone-100">
                  {table.name}
                </span>
                <span className="text-xs text-stone-500 font-medium">({table.zone})</span>
              </div>
            </div>
          </div>

          {/* Search & Station Pills */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                placeholder="Tìm món, mãng cầu, ốc..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl text-xs sm:text-sm border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
              />
            </div>

            {/* Station Quick Filter */}
            <div className="flex rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 p-0.5">
              <button
                type="button"
                onClick={() => setStationFilter('ALL')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition ${
                  stationFilter === 'ALL'
                    ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 shadow-xs'
                    : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                Tất cả
              </button>
              <button
                type="button"
                onClick={() => setStationFilter('BAR')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                  stationFilter === 'BAR'
                    ? 'bg-amber-500 text-stone-950 shadow-xs'
                    : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                <CupSoda className="w-3 h-3" />
                <span>Bar</span>
              </button>
              <button
                type="button"
                onClick={() => setStationFilter('KITCHEN')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                  stationFilter === 'KITCHEN'
                    ? 'bg-amber-500 text-stone-950 shadow-xs'
                    : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                <Flame className="w-3 h-3" />
                <span>Bếp</span>
              </button>
            </div>
          </div>
        </div>

        {/* Horizontal Category Scroll */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setSelectedCategory('ALL')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              selectedCategory === 'ALL'
                ? 'bg-stone-900 text-white dark:bg-amber-500 dark:text-stone-950 shadow-xs'
                : 'bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-400 border border-stone-200 dark:border-stone-800 hover:bg-stone-100'
            }`}
          >
            <span>Tất cả món</span>
            <span className="text-[11px] opacity-75 font-mono">({products.length})</span>
          </button>

          {categories.map((cat) => {
            const count = products.filter((p) => p.categoryId === cat.id).length;
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-stone-900 text-white dark:bg-amber-500 dark:text-stone-950 shadow-xs'
                    : 'bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-800 hover:border-amber-400'
                }`}
              >
                <span>{cat.name}</span>
                <span className="text-[11px] opacity-75 font-mono">({count})</span>
              </button>
            );
          })}
        </div>

        {/* Product Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 overflow-y-auto max-h-[calc(100vh-280px)] pr-1">
          {filteredProducts.map((product) => {
            const hasOptions =
              (product.cookingMethods && product.cookingMethods.length > 0) ||
              (product.sizes && product.sizes.length > 0) ||
              product.allowedToppings;

            return (
              <div
                key={product.id}
                onClick={() => handleProductClick(product)}
                className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-3.5 flex flex-col justify-between hover:border-amber-500 hover:shadow-md transition cursor-pointer group relative"
              >
                {/* Top Badge */}
                <div className="flex items-center justify-between mb-2">
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wider ${
                      product.station === 'BAR'
                        ? 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300'
                        : 'bg-orange-100 text-orange-900 dark:bg-orange-950 dark:text-orange-300'
                    }`}
                  >
                    {product.station === 'BAR' ? 'Bar' : 'Bếp'}
                  </span>

                  {product.isPopular && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300 flex items-center gap-0.5">
                      <Sparkles className="w-2.5 h-2.5" />
                      Hot
                    </span>
                  )}
                </div>

                {/* Name */}
                <div className="mb-2">
                  <h4 className="text-xs sm:text-sm font-bold text-stone-900 dark:text-stone-100 line-clamp-2 leading-tight group-hover:text-amber-600 transition">
                    {product.name}
                  </h4>
                  <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
                    ĐVT: {product.unit}
                  </p>
                </div>

                {/* Price & Action */}
                <div className="pt-2 border-t border-stone-100 dark:border-stone-800/80 flex items-center justify-between mt-auto">
                  <span className="text-xs sm:text-sm font-black text-amber-600 dark:text-amber-400">
                    {product.basePrice.toLocaleString('vi-VN')}đ
                  </span>

                  <button
                    type="button"
                    className="p-1.5 rounded-xl bg-amber-500 group-hover:bg-amber-600 text-stone-950 shadow-xs transition"
                  >
                    {hasOptions ? <Sparkles className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* RIGHT COLUMN: Order Ticket & Cart Sidebar (Desktop) */}
      <div className="w-full lg:w-96 shrink-0 bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm flex flex-col max-h-[calc(100vh-140px)] overflow-hidden">
        {/* Table & Guests Header & Dine-in / Takeaway selector */}
        <div className="p-4 border-b border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/60 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-black text-amber-600 font-mono">{table.code}</span>
                <span className="text-sm font-bold text-stone-900 dark:text-stone-100">
                  {table.name}
                </span>
              </div>
              <p className="text-xs text-stone-500 font-medium">Khu vực: {table.zone}</p>
            </div>

            {/* Guest Count Edit */}
            <div className="flex items-center gap-1 bg-white dark:bg-stone-900 px-2 py-1 rounded-xl border border-stone-200 dark:border-stone-700">
              <Users className="w-3.5 h-3.5 text-stone-500" />
              <button
                onClick={() => setGuestCount((g) => Math.max(1, g - 1))}
                className="p-0.5 hover:bg-stone-100 rounded text-stone-600 font-bold"
              >
                -
              </button>
              <span className="text-xs font-bold w-4 text-center">{guestCount}</span>
              <button
                onClick={() => setGuestCount((g) => g + 1)}
                className="p-0.5 hover:bg-stone-100 rounded text-stone-600 font-bold"
              >
                +
              </button>
            </div>
          </div>

          {/* Dine-In / Takeaway Selection Tabs */}
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-stone-200/70 dark:bg-stone-900/80 rounded-xl">
            <button
              type="button"
              onClick={() => handleOrderTypeChange('DINE_IN')}
              className={`py-1.5 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                orderType === 'DINE_IN'
                  ? 'bg-white dark:bg-stone-800 text-amber-700 dark:text-amber-400 shadow-xs'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
              }`}
            >
              <UtensilsCrossed className="w-3.5 h-3.5" />
              <span>Ăn tại chỗ</span>
            </button>

            <button
              type="button"
              onClick={() => handleOrderTypeChange('TAKEAWAY')}
              className={`py-1.5 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                orderType === 'TAKEAWAY'
                  ? 'bg-amber-500 text-stone-950 font-black shadow-xs'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
              }`}
            >
              <Bike className="w-3.5 h-3.5" />
              <span>Đem về / Ship</span>
            </button>
          </div>

          {/* Takeaway & Shipping Fee Options Box */}
          {orderType === 'TAKEAWAY' && (
            <div className="p-2.5 bg-amber-500/10 border border-amber-300 dark:border-amber-800 rounded-xl space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-amber-900 dark:text-amber-300 flex items-center gap-1">
                  <Bike className="w-3.5 h-3.5 text-amber-600" />
                  Phí Ship (Giao hàng):
                </span>
                <span className="font-mono font-black text-amber-700 dark:text-amber-300">
                  {shippingFee.toLocaleString('vi-VN')}đ
                </span>
              </div>

              {/* Shipping fee quick pills: 0k, 5k, 10k, 15k */}
              <div className="grid grid-cols-4 gap-1">
                {[
                  { label: '0đ', value: 0 },
                  { label: '5k', value: 5000 },
                  { label: '10k', value: 10000 },
                  { label: '15k', value: 15000 },
                ].map((feeOpt) => (
                  <button
                    key={feeOpt.value}
                    type="button"
                    onClick={() => handleShippingFeeChange(feeOpt.value)}
                    className={`py-1 rounded-lg font-bold text-xs transition border ${
                      shippingFee === feeOpt.value
                        ? 'bg-amber-500 text-stone-950 border-amber-600 shadow-2xs'
                        : 'bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-700 hover:border-amber-400'
                    }`}
                  >
                    {feeOpt.label}
                  </button>
                ))}
              </div>

              {/* Custom address and phone for Takeaway/Delivery */}
              <div className="grid grid-cols-2 gap-1.5 pt-1">
                <div className="relative">
                  <Phone className="w-3 h-3 text-stone-400 absolute left-2 top-2" />
                  <input
                    type="text"
                    placeholder="SĐT khách..."
                    value={deliveryPhone}
                    onChange={(e) => handleDeliveryInfoChange(e.target.value, deliveryAddress, customerNote)}
                    className="w-full pl-6 pr-2 py-1 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg text-[11px]"
                  />
                </div>
                <div className="relative">
                  <MapPin className="w-3 h-3 text-stone-400 absolute left-2 top-2" />
                  <input
                    type="text"
                    placeholder="Địa chỉ ship..."
                    value={deliveryAddress}
                    onChange={(e) => handleDeliveryInfoChange(deliveryPhone, e.target.value, customerNote)}
                    className="w-full pl-6 pr-2 py-1 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg text-[11px]"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Order Items Scrollable Container */}
        <div className="p-4 overflow-y-auto flex-1 space-y-4">
          {/* SECTION 1: Active Order Items (Sent to Kitchen) */}
          {activeOrder && activeOrder.items.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-stone-500 uppercase tracking-wider border-b border-stone-200 dark:border-stone-800 pb-1">
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  Món Đã Gửi Bếp ({activeOrder.items.length})
                </span>
                <span className="font-mono">{activeOrder.orderCode}</span>
              </div>

              {activeOrder.items.map((item) => {
                const badge = getItemStatusBadge(item.status);
                const isCancelled = item.status === 'CANCELLED';

                return (
                  <div
                    key={item.id}
                    className={`p-2.5 rounded-xl border text-xs transition ${
                      isCancelled
                        ? 'bg-red-50/50 dark:bg-red-950/20 border-red-200 dark:border-red-900/50 opacity-60'
                        : 'bg-stone-50 dark:bg-stone-800/40 border-stone-200 dark:border-stone-800'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-stone-900 dark:text-stone-100">
                            {item.quantity}x {item.productName}
                          </span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-sm ${badge.bg}`}>
                            {badge.label}
                          </span>
                        </div>

                        {/* Details */}
                        {item.selectedCookingMethod && (
                          <p className="text-[11px] text-amber-700 dark:text-amber-400 font-medium">
                            • Cách chế biến: {item.selectedCookingMethod.name}
                          </p>
                        )}
                        {item.selectedSize && (
                          <p className="text-[11px] text-stone-600 dark:text-stone-300">
                            • Size: {item.selectedSize.name}
                          </p>
                        )}
                        {item.selectedToppings.length > 0 && (
                          <p className="text-[11px] text-stone-600 dark:text-stone-300">
                            • Topping:{' '}
                            {item.selectedToppings
                              .map((t) => `${t.name}${t.quantity > 1 ? ` (x${t.quantity})` : ''}`)
                              .join(', ')}
                          </p>
                        )}
                        {(item.sugarLevel || item.iceLevel) && (
                          <p className="text-[11px] text-stone-500">
                            • Đường: {item.sugarLevel || '100%'} | Đá: {item.iceLevel || '100%'}
                          </p>
                        )}
                        {item.note && (
                          <p className="text-[11px] text-orange-600 italic font-medium">
                            • Ghi chú: {item.note}
                          </p>
                        )}
                        {isCancelled && (
                          <p className="text-[11px] text-red-600 font-bold mt-1">
                            Lý do hủy: {item.cancelReason} ({item.cancelledBy})
                          </p>
                        )}
                      </div>

                      <div className="flex flex-col items-end gap-1">
                        <span
                          className={`font-black ${
                            isCancelled ? 'line-through text-stone-400' : 'text-stone-900 dark:text-stone-100'
                          }`}
                        >
                          {(item.unitPrice * item.quantity).toLocaleString('vi-VN')}đ
                        </span>

                        {!isCancelled && item.status !== 'SERVED' && (
                          <button
                            type="button"
                            onClick={() =>
                              setVoidingItem({ itemId: item.id, name: item.productName })
                            }
                            className="text-[11px] text-red-600 hover:text-red-700 underline font-medium"
                          >
                            Hủy món
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* SECTION 2: Newly Added Cart Items (Pending Send) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider border-b border-amber-200 dark:border-amber-900 pb-1">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                Món Mới Chọn ({cartItems.length})
              </span>
              {cartItems.length > 0 && (
                <button
                  type="button"
                  onClick={clearCart}
                  className="text-red-500 hover:underline text-[11px] normal-case"
                >
                  Xóa giỏ
                </button>
              )}
            </div>

            {cartItems.length === 0 ? (
              <div className="text-center py-6 text-stone-400 text-xs italic">
                Chưa chọn món mới. Bấm vào món ở menu để thêm vào đơn.
              </div>
            ) : (
              cartItems.map((item) => (
                <div
                  key={item.id}
                  className="p-2.5 rounded-xl border border-amber-300 dark:border-amber-800/80 bg-amber-50/40 dark:bg-amber-950/20 text-xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-stone-900 dark:text-stone-100">
                          {item.productName}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded-sm ${
                            item.station === 'BAR'
                              ? 'bg-amber-200 text-amber-900'
                              : 'bg-orange-200 text-orange-900'
                          }`}
                        >
                          {item.station === 'BAR' ? 'Bar' : 'Bếp'}
                        </span>
                      </div>

                      {/* Customization labels */}
                      {item.selectedCookingMethod && (
                        <p className="text-[11px] text-amber-800 dark:text-amber-300 font-medium">
                          • Sốt: {item.selectedCookingMethod.name}
                        </p>
                      )}
                      {item.selectedSize && (
                        <p className="text-[11px] text-stone-600 dark:text-stone-400">
                          • Size: {item.selectedSize.name}
                        </p>
                      )}
                      {item.selectedToppings.length > 0 && (
                        <p className="text-[11px] text-stone-600 dark:text-stone-400">
                          • Topping:{' '}
                          {item.selectedToppings
                            .map((t) => `${t.name}${t.quantity > 1 ? ` (x${t.quantity})` : ''}`)
                            .join(', ')}
                        </p>
                      )}
                      {(item.sugarLevel || item.iceLevel) && (
                        <p className="text-[11px] text-stone-500">
                          • Đường: {item.sugarLevel} | Đá: {item.iceLevel}
                        </p>
                      )}
                      {item.note && (
                        <p className="text-[11px] text-orange-600 italic font-medium">
                          • Ghi chú: {item.note}
                        </p>
                      )}
                    </div>

                    {/* Qty & Remove */}
                    <div className="flex flex-col items-end gap-1.5">
                      <span className="font-black text-amber-700 dark:text-amber-400">
                        {(item.unitPrice * item.quantity).toLocaleString('vi-VN')}đ
                      </span>

                      <div className="flex items-center gap-1 bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 rounded-lg p-0.5">
                        <button
                          type="button"
                          onClick={() => updateCartItemQuantity(item.id, -1)}
                          className="p-1 hover:bg-stone-100 rounded text-stone-600"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-4 text-center font-bold">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => updateCartItemQuantity(item.id, 1)}
                          className="p-1 hover:bg-stone-100 rounded text-stone-600"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeCartItem(item.id)}
                          className="p-1 hover:bg-red-50 text-red-500 rounded ml-0.5"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Total & Action Footer */}
        <div className="p-4 border-t border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/80 space-y-3">
          {/* Subtotals breakdown */}
          <div className="space-y-1 text-xs">
            {activeOrder && (
              <div className="flex justify-between text-stone-500">
                <span>Đã gọi trước đó:</span>
                <span>{existingOrderSubtotal.toLocaleString('vi-VN')}đ</span>
              </div>
            )}
            {cartTotal > 0 && (
              <div className="flex justify-between text-amber-700 dark:text-amber-400 font-medium">
                <span>Món mới đang chọn:</span>
                <span>+{cartTotal.toLocaleString('vi-VN')}đ</span>
              </div>
            )}
            {orderType === 'TAKEAWAY' && (
              <div className="flex justify-between text-blue-600 dark:text-blue-400 font-medium">
                <span>Phí ship (Giao hàng):</span>
                <span>+{shippingFee.toLocaleString('vi-VN')}đ</span>
              </div>
            )}
            <div className="flex justify-between text-base font-black text-stone-900 dark:text-stone-100 pt-1 border-t border-stone-200 dark:border-stone-700">
              <span>Tổng thanh toán:</span>
              <span className="text-amber-600 dark:text-amber-400">
                {combinedTotal.toLocaleString('vi-VN')}đ
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2">
            {cartItems.length > 0 && (
              <button
                type="button"
                onClick={handleSendToKitchen}
                className="w-full py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-98 text-stone-950 font-black text-sm shadow-md shadow-amber-500/20 flex items-center justify-center gap-2 transition"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Lưu Đơn / Lên Món ({cartItems.length} món)</span>
              </button>
            )}

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => onOpenSplitMerge(table)}
                className="py-2.5 px-3 rounded-xl border border-stone-300 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 text-xs font-bold flex items-center justify-center gap-1.5 transition"
              >
                <ArrowRightLeft className="w-3.5 h-3.5" />
                <span>Tách / Gộp</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (cartItems.length > 0) {
                    try {
                      sendCartToKitchen(guestCount, {
                        orderType,
                        shippingFee: orderType === 'TAKEAWAY' ? shippingFee : 0,
                        deliveryAddress,
                        deliveryPhone,
                        customerNote,
                      });
                    } catch (e) {
                      console.error(e);
                    }
                  }
                  onOpenCheckout(table);
                }}
                disabled={!activeOrder && cartItems.length === 0}
                className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition"
              >
                <Receipt className="w-3.5 h-3.5" />
                <span>Thanh Toán / Xuất Bill Ngay</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Customization Modal */}
      {customizingProduct && (
        <CustomizationModal
          product={customizingProduct}
          onClose={() => setCustomizingProduct(null)}
          onConfirm={(customization) => {
            addToCart(customizingProduct, customization);
            setCustomizingProduct(null);
          }}
        />
      )}

      {/* Void Log / Reason Modal */}
      {voidingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-stone-900 rounded-2xl p-5 max-w-md w-full border border-stone-200 dark:border-stone-800 shadow-2xl space-y-4">
            <div className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="text-base font-bold">Xác nhận Hủy món & Lưu Log</h3>
            </div>

            <p className="text-xs text-stone-600 dark:text-stone-400">
              Bạn đang yêu cầu hủy món: <span className="font-bold text-stone-900 dark:text-stone-100">{voidingItem.name}</span>. Hành động này sẽ được ghi vào Sổ Nhật Ký Hủy Món (Void Log).
            </p>

            <div>
              <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                Lý do hủy món:
              </label>
              <select
                value={voidReason}
                onChange={(e) => setVoidReason(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-xs font-medium focus:ring-2 focus:ring-amber-500 mb-2"
              >
                <option value="Khách đổi món khác">Khách đổi món khác</option>
                <option value="Bếp hết nguyên liệu">Bếp hết nguyên liệu</option>
                <option value="Khách đợi lâu xin hủy">Khách đợi lâu xin hủy</option>
                <option value="Nhân viên order nhầm">Nhân viên order nhầm</option>
                <option value="Món bị lỗi chế biến">Món bị lỗi chế biến</option>
                <option value="Khác">Lý do khác...</option>
              </select>

              {voidReason === 'Khác' && (
                <input
                  type="text"
                  placeholder="Nhập lý do cụ thể..."
                  className="w-full p-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-xs"
                  onChange={(e) => setVoidReason(e.target.value)}
                />
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setVoidingItem(null)}
                className="px-4 py-2 rounded-xl border border-stone-300 dark:border-stone-700 text-xs font-bold text-stone-700 dark:text-stone-300 hover:bg-stone-100"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={handleConfirmVoid}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-xs"
              >
                Xác nhận Hủy món
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
