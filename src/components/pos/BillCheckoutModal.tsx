import React, { useState, useEffect } from 'react';
import { usePOS } from '../../context/POSContext';
import { TableItem, Order, OrderType, PaymentMethodType } from '../../types/pos';
import { SacombankQR } from '../common/SacombankQR';
import confetti from 'canvas-confetti';
import {
  X,
  Printer,
  QrCode,
  Banknote,
  CreditCard,
  Percent,
  CheckCircle,
  Copy,
  Check,
  Receipt,
  FileText,
  Bike,
  UtensilsCrossed,
  Layers,
  ArrowRight,
  ShieldCheck,
  Building2,
} from 'lucide-react';

interface BillCheckoutModalProps {
  table: TableItem;
  onClose: () => void;
  onPaymentDone: () => void;
}

export const BillCheckoutModal: React.FC<BillCheckoutModalProps> = ({
  table,
  onClose,
  onPaymentDone,
}) => {
  const { orders, activeUser, settings, completePayment, updateOrderDetails } = usePOS();

  const activeOrder = orders.find(
    (o) => o.tableId === table.id && (o.status === 'ACTIVE' || o.status === 'PENDING_PAYMENT')
  );

  // States
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>('SACOMBANK_QR');
  const [discountPercent, setDiscountPercent] = useState<number>(activeOrder?.discountPercent || 0);
  
  // Takeaway and Shipping fee
  const isTakeawayZone = table.zone === 'Mang Về' || table.name.toLowerCase().includes('mang về');
  const [orderType, setOrderType] = useState<OrderType>(() => {
    if (activeOrder?.orderType) return activeOrder.orderType;
    return isTakeawayZone ? 'TAKEAWAY' : 'DINE_IN';
  });
  const [shippingFee, setShippingFee] = useState<number>(activeOrder?.shippingFee || 0);

  // Cash / Mixed payment states
  const [cashGiven, setCashGiven] = useState<number>(0);
  const [mixedCashAmount, setMixedCashAmount] = useState<number>(0);
  const [showPrintPreview, setShowPrintPreview] = useState<boolean>(false);

  if (!activeOrder) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
        <div className="bg-white dark:bg-stone-900 rounded-2xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl border border-stone-200 dark:border-stone-800">
          <p className="text-sm font-bold text-stone-700 dark:text-stone-300">
            Bàn này hiện chưa có hóa đơn đang hoạt động.
          </p>
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-stone-900 text-white rounded-xl text-xs font-bold"
          >
            Đóng
          </button>
        </div>
      </div>
    );
  }

  // Calculate bill numbers
  const subtotal = activeOrder.items.reduce(
    (sum, it) => (it.status !== 'CANCELLED' ? sum + it.unitPrice * it.quantity : sum),
    0
  );
  const discountAmount = (subtotal * discountPercent) / 100;
  const taxAmount = ((subtotal - discountAmount) * (settings.taxPercent || 0)) / 100;
  const currentShipping = orderType === 'TAKEAWAY' ? shippingFee : 0;
  const totalPayable = Math.max(0, subtotal - discountAmount + taxAmount + currentShipping);

  // Mixed Payment calculations
  const actualMixedCash = Math.min(mixedCashAmount, totalPayable);
  const mixedTransferRemaining = Math.max(0, totalPayable - actualMixedCash);
  const mixedCashChange = Math.max(0, mixedCashAmount - totalPayable);

  // Cash given calculation for pure Cash mode
  const changeReturn = Math.max(0, cashGiven - totalPayable);

  // Transfer Amount based on payment method
  const currentTransferAmount =
    paymentMethod === 'MIXED'
      ? mixedTransferRemaining
      : paymentMethod === 'SACOMBANK_QR' || paymentMethod === 'VIETQR' || paymentMethod === 'TRANSFER'
      ? totalPayable
      : 0;

  const handleOrderTypeChange = (newType: OrderType) => {
    setOrderType(newType);
    const newFee = newType === 'DINE_IN' ? 0 : shippingFee;
    if (newType === 'DINE_IN') setShippingFee(0);
    updateOrderDetails(activeOrder.id, {
      orderType: newType,
      shippingFee: newFee,
    });
  };

  const handleShippingFeeChange = (fee: number) => {
    setShippingFee(fee);
    updateOrderDetails(activeOrder.id, {
      shippingFee: fee,
    });
  };

  const handleConfirmCheckout = () => {
    const paymentDetails = {
      cashAmount: paymentMethod === 'MIXED' ? actualMixedCash : paymentMethod === 'CASH' ? totalPayable : 0,
      transferAmount: currentTransferAmount,
      shippingFee: currentShipping,
    };

    completePayment(
      activeOrder.id,
      paymentMethod,
      discountPercent,
      settings.taxPercent || 0,
      paymentDetails
    );

    // Trigger celebratory confetti
    try {
      confetti({
        particleCount: 90,
        spread: 70,
        origin: { y: 0.65 },
      });
    } catch {
      // safe fallback
    }

    onPaymentDone();
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  const quickCashOptions = [
    totalPayable,
    Math.ceil(totalPayable / 50000) * 50000,
    Math.ceil(totalPayable / 100000) * 100000,
    500000,
  ].filter((v, i, a) => a.indexOf(v) === i && v >= totalPayable);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-stone-900/70 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div
        className="bg-white dark:bg-stone-900 rounded-3xl shadow-2xl border border-stone-200 dark:border-stone-800 w-full max-w-5xl overflow-hidden flex flex-col my-auto max-h-[94vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between bg-stone-50 dark:bg-stone-800/80">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-amber-500 text-stone-950 font-black shadow-md shadow-amber-500/20">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-stone-900 dark:text-stone-100">
                  Thanh Toán & In Bill Hóa Đơn
                </h3>
                <span className="text-xs px-2.5 py-0.5 rounded-full font-mono font-bold bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                  {table.code} - {table.name}
                </span>
                <span
                  className={`text-xs px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1 ${
                    orderType === 'TAKEAWAY'
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                      : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                  }`}
                >
                  {orderType === 'TAKEAWAY' ? <Bike className="w-3 h-3" /> : <UtensilsCrossed className="w-3 h-3" />}
                  {orderType === 'TAKEAWAY' ? 'Đem về / Ship' : 'Ăn tại chỗ'}
                </span>
              </div>
              <p className="text-xs text-stone-500 font-medium mt-0.5">
                Mã đơn: <span className="font-mono font-bold">{activeOrder.orderCode}</span> • Thu ngân: {activeUser.name}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowPrintPreview(!showPrintPreview)}
              className="px-3.5 py-2 rounded-xl border border-stone-300 dark:border-stone-700 text-xs font-bold text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 flex items-center gap-1.5 transition"
            >
              <Printer className="w-4 h-4 text-amber-600" />
              <span>{showPrintPreview ? 'Ẩn bản in' : 'Xem mẫu in bill'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-200 dark:hover:bg-stone-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Layout */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEFT 7 COLS: Order Items, Takeaway/Shipping & Payment Breakdown */}
          <div className="lg:col-span-7 space-y-4">
            {/* 1. DINE-IN / TAKEAWAY & SHIPPING FEE TOGGLE */}
            <div className="p-3.5 bg-stone-50 dark:bg-stone-800/60 rounded-2xl border border-stone-200 dark:border-stone-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider">
                  Hình thức phục vụ:
                </span>
                <div className="flex items-center gap-1 bg-stone-200 dark:bg-stone-900 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => handleOrderTypeChange('DINE_IN')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
                      orderType === 'DINE_IN'
                        ? 'bg-white dark:bg-stone-800 text-amber-700 dark:text-amber-300 shadow-xs'
                        : 'text-stone-600 dark:text-stone-400'
                    }`}
                  >
                    <UtensilsCrossed className="w-3.5 h-3.5" />
                    <span>Ăn tại chỗ</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOrderTypeChange('TAKEAWAY')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
                      orderType === 'TAKEAWAY'
                        ? 'bg-amber-500 text-stone-950 font-black shadow-xs'
                        : 'text-stone-600 dark:text-stone-400'
                    }`}
                  >
                    <Bike className="w-3.5 h-3.5" />
                    <span>Đem về / Ship</span>
                  </button>
                </div>
              </div>

              {/* Takeaway Shipping Fee Selector */}
              {orderType === 'TAKEAWAY' && (
                <div className="pt-2 border-t border-stone-200 dark:border-stone-700 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                      <Bike className="w-3.5 h-3.5 text-amber-600" />
                      Phí Ship (Giao hàng tận nơi):
                    </span>
                    <span className="font-mono font-black text-amber-700 dark:text-amber-300 text-sm">
                      {shippingFee.toLocaleString('vi-VN')}đ
                    </span>
                  </div>

                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { label: '0đ (Tự lấy)', value: 0 },
                      { label: '5k (Gần)', value: 5000 },
                      { label: '10k (Chuẩn)', value: 10000 },
                      { label: '15k (Xa)', value: 15000 },
                    ].map((feeOpt) => (
                      <button
                        key={feeOpt.value}
                        type="button"
                        onClick={() => handleShippingFeeChange(feeOpt.value)}
                        className={`py-1.5 rounded-xl font-bold text-xs transition border ${
                          shippingFee === feeOpt.value
                            ? 'bg-amber-500 text-stone-950 border-amber-600 shadow-xs'
                            : 'bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-700 hover:border-amber-400'
                        }`}
                      >
                        {feeOpt.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 2. Items table */}
            <div className="border border-stone-200 dark:border-stone-800 rounded-2xl overflow-hidden shadow-2xs">
              <div className="bg-stone-100 dark:bg-stone-800 px-4 py-2.5 text-xs font-bold text-stone-700 dark:text-stone-300 flex justify-between">
                <span>Chi tiết món ({activeOrder.items.filter((i) => i.status !== 'CANCELLED').length})</span>
                <span>Thành tiền</span>
              </div>

              <div className="p-3 divide-y divide-stone-100 dark:divide-stone-800 max-h-44 overflow-y-auto">
                {activeOrder.items
                  .filter((i) => i.status !== 'CANCELLED')
                  .map((item) => (
                    <div key={item.id} className="py-1.5 flex justify-between items-start text-xs">
                      <div>
                        <p className="font-bold text-stone-900 dark:text-stone-100">
                          {item.quantity}x {item.productName}
                        </p>
                        {item.selectedCookingMethod && (
                          <p className="text-[11px] text-amber-700 dark:text-amber-400">
                            • Sốt: {item.selectedCookingMethod.name}
                          </p>
                        )}
                        {item.selectedSize && (
                          <p className="text-[11px] text-stone-500">• Size: {item.selectedSize.name}</p>
                        )}
                        {item.selectedToppings.length > 0 && (
                          <p className="text-[11px] text-stone-500">
                            • Topping: {item.selectedToppings.map((t) => t.name).join(', ')}
                          </p>
                        )}
                      </div>
                      <span className="font-bold text-stone-800 dark:text-stone-200">
                        {(item.unitPrice * item.quantity).toLocaleString('vi-VN')}đ
                      </span>
                    </div>
                  ))}
              </div>
            </div>

            {/* 3. Discount & Calculation */}
            <div className="bg-stone-50 dark:bg-stone-800/50 p-4 rounded-2xl border border-stone-200 dark:border-stone-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
                  <Percent className="w-3.5 h-3.5 text-amber-500" />
                  Giảm giá / Ưu đãi (%)
                </span>
                <div className="flex items-center gap-1">
                  {[0, 5, 10, 15, 20].map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => setDiscountPercent(pct)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                        discountPercent === pct
                          ? 'bg-amber-500 text-stone-950 shadow-xs'
                          : 'bg-white dark:bg-stone-800 text-stone-600 border border-stone-200 dark:border-stone-700'
                      }`}
                    >
                      {pct}%
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Calculation Summary */}
              <div className="space-y-1 pt-2 border-t border-stone-200 dark:border-stone-700 text-xs">
                <div className="flex justify-between text-stone-600 dark:text-stone-400">
                  <span>Tổng tiền món (Tạm tính):</span>
                  <span>{subtotal.toLocaleString('vi-VN')}đ</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-medium">
                    <span>Chiết khấu giảm ({discountPercent}%):</span>
                    <span>-{discountAmount.toLocaleString('vi-VN')}đ</span>
                  </div>
                )}
                {orderType === 'TAKEAWAY' && currentShipping > 0 && (
                  <div className="flex justify-between text-blue-600 dark:text-blue-400 font-medium">
                    <span>Phí ship giao hàng:</span>
                    <span>+{currentShipping.toLocaleString('vi-VN')}đ</span>
                  </div>
                )}
                {taxAmount > 0 && (
                  <div className="flex justify-between text-stone-500">
                    <span>VAT ({settings.taxPercent}%):</span>
                    <span>+{taxAmount.toLocaleString('vi-VN')}đ</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-black text-stone-900 dark:text-stone-100 pt-2 border-t border-stone-300 dark:border-stone-600">
                  <span>Khách cần thanh toán:</span>
                  <span className="text-amber-600 dark:text-amber-400 text-xl font-mono">
                    {totalPayable.toLocaleString('vi-VN')}đ
                  </span>
                </div>
              </div>
            </div>

            {/* 4. Payment Method Selector with MIX Option */}
            <div>
              <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-2">
                Hình thức thanh toán
              </label>
              <div className="grid grid-cols-3 gap-2.5">
                {/* 1. Sacombank QR */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod('SACOMBANK_QR')}
                  className={`p-3 rounded-2xl border text-center flex flex-col items-center gap-1.5 transition ${
                    paymentMethod === 'SACOMBANK_QR'
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/40 text-blue-950 dark:text-blue-200 font-bold ring-2 ring-blue-500 shadow-xs'
                      : 'border-stone-200 dark:border-stone-800 hover:border-stone-300 text-stone-600'
                  }`}
                >
                  <Building2 className="w-5 h-5 text-blue-600" />
                  <span className="text-xs">QR Sacombank</span>
                </button>

                {/* 2. Tiền mặt */}
                <button
                  type="button"
                  onClick={() => {
                    setPaymentMethod('CASH');
                    if (cashGiven < totalPayable) setCashGiven(totalPayable);
                  }}
                  className={`p-3 rounded-2xl border text-center flex flex-col items-center gap-1.5 transition ${
                    paymentMethod === 'CASH'
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-200 font-bold ring-2 ring-emerald-500 shadow-xs'
                      : 'border-stone-200 dark:border-stone-800 hover:border-stone-300 text-stone-600'
                  }`}
                >
                  <Banknote className="w-5 h-5 text-emerald-600" />
                  <span className="text-xs">Tiền mặt</span>
                </button>

                {/* 3. MIX (Tiền mặt + Chuyển khoản) */}
                <button
                  type="button"
                  onClick={() => {
                    setPaymentMethod('MIXED');
                    if (mixedCashAmount === 0) setMixedCashAmount(Math.floor(totalPayable / 2));
                  }}
                  className={`p-3 rounded-2xl border text-center flex flex-col items-center gap-1.5 transition ${
                    paymentMethod === 'MIXED'
                      ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/40 text-amber-950 dark:text-amber-200 font-bold ring-2 ring-amber-500 shadow-xs'
                      : 'border-stone-200 dark:border-stone-800 hover:border-stone-300 text-stone-600'
                  }`}
                >
                  <Layers className="w-5 h-5 text-amber-600" />
                  <span className="text-xs font-black">Mix (Tiền mặt + CK)</span>
                </button>
              </div>
            </div>

            {/* 5. DYNAMIC MIXED PAYMENT PANEL */}
            {paymentMethod === 'MIXED' && (
              <div className="p-4 rounded-2xl bg-amber-500/10 border-2 border-amber-400 dark:border-amber-700 space-y-3">
                <div className="flex items-center gap-2 text-amber-900 dark:text-amber-300 font-bold text-xs">
                  <Layers className="w-4 h-4 text-amber-600" />
                  <span>Cấu hình thanh toán kết hợp (Tiền mặt + Chuyển khoản QR):</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Part 1: Cash */}
                  <div className="p-3 bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-700 space-y-1.5">
                    <label className="text-[11px] font-bold text-stone-600 dark:text-stone-400 flex items-center gap-1">
                      <Banknote className="w-3.5 h-3.5 text-emerald-600" />
                      1. Tiền mặt khách trả:
                    </label>
                    <input
                      type="number"
                      value={mixedCashAmount || ''}
                      onChange={(e) => setMixedCashAmount(Number(e.target.value))}
                      placeholder="Nhập số tiền mặt..."
                      className="w-full px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 font-black text-sm text-emerald-600 dark:text-emerald-400 bg-emerald-50/40 dark:bg-emerald-950/20 focus:ring-2 focus:ring-emerald-500"
                    />
                    <div className="flex gap-1 pt-1">
                      {[10000, 20000, 50000, 100000].map((amt) => (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => setMixedCashAmount(amt)}
                          className="px-2 py-0.5 rounded bg-stone-100 dark:bg-stone-800 text-[10px] font-bold text-stone-700 dark:text-stone-300 hover:bg-emerald-100"
                        >
                          +{amt / 1000}k
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Part 2: Transfer QR Remaining */}
                  <div className="p-3 bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-700 space-y-1.5">
                    <label className="text-[11px] font-bold text-stone-600 dark:text-stone-400 flex items-center gap-1">
                      <QrCode className="w-3.5 h-3.5 text-blue-600" />
                      2. Còn lại quét QR Sacombank:
                    </label>
                    <div className="px-3 py-2 rounded-lg bg-blue-50/60 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 flex items-center justify-between">
                      <span className="text-xs font-medium text-stone-500">Cần chuyển:</span>
                      <span className="font-black text-sm text-blue-600 dark:text-blue-400 font-mono">
                        {mixedTransferRemaining.toLocaleString('vi-VN')}đ
                      </span>
                    </div>
                    {mixedCashChange > 0 && (
                      <p className="text-[11px] text-amber-600 font-bold">
                        * Tiền mặt vượt: Thối lại {mixedCashChange.toLocaleString('vi-VN')}đ
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* 6. PURE CASH INPUT & CHANGE RETURN */}
            {paymentMethod === 'CASH' && (
              <div className="p-3.5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-stone-800 dark:text-stone-200 flex items-center gap-1.5">
                    <Banknote className="w-4 h-4 text-emerald-600" />
                    Số tiền khách đưa:
                  </label>
                  <input
                    type="number"
                    value={cashGiven || ''}
                    onChange={(e) => setCashGiven(Number(e.target.value))}
                    className="w-40 px-3 py-1.5 rounded-xl border border-stone-300 dark:border-stone-700 text-right font-black text-sm bg-white dark:bg-stone-900 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {quickCashOptions.map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setCashGiven(amt)}
                      className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-white dark:bg-stone-900 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100"
                    >
                      {amt.toLocaleString('vi-VN')}đ
                    </button>
                  ))}
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-emerald-200 dark:border-emerald-800 text-xs">
                  <span className="font-bold text-stone-700 dark:text-stone-300">
                    Tiền thối lại cho khách:
                  </span>
                  <span className="text-base font-black text-emerald-600 dark:text-emerald-400 font-mono">
                    {changeReturn.toLocaleString('vi-VN')}đ
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT 5 COLS: Sacombank QR Display or Thermal Receipt Preview */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center p-4 bg-stone-50 dark:bg-stone-800/40 rounded-3xl border border-stone-200 dark:border-stone-800 min-h-[380px]">
            {showPrintPreview ? (
              /* THERMAL RECEIPT PREVIEW (ESC/POS 80mm with Sacombank QR Code) */
              <div
                id="printable-receipt"
                className="w-full bg-white text-stone-900 p-4 rounded-2xl shadow-lg font-mono text-[11px] leading-tight space-y-2.5 border border-stone-300 max-h-[460px] overflow-y-auto"
              >
                {/* Store Header */}
                <div className="text-center pb-2 border-b-2 border-dashed border-stone-400">
                  <h4 className="font-black text-sm uppercase">{settings.storeName}</h4>
                  <p className="text-[10px] text-stone-600">{settings.slogan}</p>
                  <p className="text-[10px]">{settings.address}</p>
                  <p className="text-[10px] font-bold">Hotline: {settings.phone}</p>
                </div>

                {/* Bill Meta */}
                <div className="py-1 border-b border-dashed border-stone-400 space-y-0.5 text-[10px]">
                  <div className="flex justify-between font-bold">
                    <span>HÓA ĐƠN: {activeOrder.orderCode}</span>
                    <span>{orderType === 'TAKEAWAY' ? '🛵 MANG VỀ' : '🍽️ ĂN TẠI CHỖ'}</span>
                  </div>
                  <p>Bàn: {table.code} ({table.zone})</p>
                  <p>Thời gian: {new Date().toLocaleString('vi-VN')}</p>
                  <p>Thu ngân: {activeUser.name}</p>
                  {activeOrder.deliveryPhone && <p>SĐT khách: {activeOrder.deliveryPhone}</p>}
                  {activeOrder.deliveryAddress && <p>Địa chỉ: {activeOrder.deliveryAddress}</p>}
                </div>

                {/* Items List */}
                <div className="py-1 space-y-1 text-[11px]">
                  <div className="flex justify-between font-bold border-b border-stone-200 pb-0.5">
                    <span>Tên món</span>
                    <span>Thành tiền</span>
                  </div>
                  {activeOrder.items
                    .filter((i) => i.status !== 'CANCELLED')
                    .map((item) => (
                      <div key={item.id} className="flex justify-between">
                        <span className="flex-1 pr-2">
                          {item.quantity}x {item.productName}
                          {item.selectedCookingMethod && ` (${item.selectedCookingMethod.name})`}
                        </span>
                        <span className="font-bold">
                          {(item.unitPrice * item.quantity).toLocaleString('vi-VN')}
                        </span>
                      </div>
                    ))}
                </div>

                {/* Summary & Totals */}
                <div className="pt-2 border-t-2 border-dashed border-stone-400 space-y-1 text-[11px]">
                  <div className="flex justify-between">
                    <span>Tạm tính món:</span>
                    <span>{subtotal.toLocaleString('vi-VN')}đ</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-stone-700">
                      <span>Giảm giá ({discountPercent}%):</span>
                      <span>-{discountAmount.toLocaleString('vi-VN')}đ</span>
                    </div>
                  )}
                  {orderType === 'TAKEAWAY' && currentShipping > 0 && (
                    <div className="flex justify-between font-bold">
                      <span>Phí ship giao hàng:</span>
                      <span>+{currentShipping.toLocaleString('vi-VN')}đ</span>
                    </div>
                  )}
                  <div className="flex justify-between font-black text-sm pt-1 border-t border-stone-400">
                    <span>TỔNG CỘNG:</span>
                    <span>{totalPayable.toLocaleString('vi-VN')}đ</span>
                  </div>

                  {/* Payment Breakdown in Receipt */}
                  <div className="pt-1 text-[10px] space-y-0.5 border-t border-stone-200 text-stone-700">
                    <p className="font-bold">
                      HTTT:{' '}
                      {paymentMethod === 'SACOMBANK_QR'
                        ? 'Chuyển khoản QR Sacombank'
                        : paymentMethod === 'CASH'
                        ? `Tiền mặt (Đưa: ${cashGiven.toLocaleString('vi-VN')}đ | Thối: ${changeReturn.toLocaleString('vi-VN')}đ)`
                        : paymentMethod === 'MIXED'
                        ? `Mix (Tiền mặt: ${actualMixedCash.toLocaleString('vi-VN')}đ + CK QR: ${mixedTransferRemaining.toLocaleString('vi-VN')}đ)`
                        : 'Thẻ / POS'}
                    </p>
                  </div>
                </div>

                {/* Sacombank QR in Receipt Footer */}
                <div className="pt-2 border-t-2 border-dashed border-stone-400">
                  <SacombankQR
                    size="receipt"
                    amount={paymentMethod === 'MIXED' ? mixedTransferRemaining : totalPayable}
                    orderCode={activeOrder.orderCode}
                    tableName={table.code}
                  />
                </div>

                {/* Footer Greeting */}
                <div className="text-center pt-2 border-t border-dashed border-stone-300 text-[9px] space-y-0.5">
                  <p className="font-bold">{settings.receiptFooter}</p>
                  <p className="italic">Wifi: KAME_FreePass / MK: kame8888</p>
                </div>
              </div>
            ) : paymentMethod === 'SACOMBANK_QR' || paymentMethod === 'MIXED' ? (
              /* SACOMBANK QR CODE DISPLAY COMPONENT */
              <div className="w-full flex flex-col items-center justify-center">
                <SacombankQR
                  amount={paymentMethod === 'MIXED' ? mixedTransferRemaining : totalPayable}
                  orderCode={activeOrder.orderCode}
                  tableName={table.code}
                  size="md"
                />
              </div>
            ) : (
              /* Cash / Card Ready state */
              <div className="flex flex-col items-center justify-center text-center p-6 space-y-3">
                <div className="w-16 h-16 rounded-3xl bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-emerald-600 shadow-inner">
                  <CheckCircle className="w-8 h-8" />
                </div>
                <h4 className="text-base font-black text-stone-900 dark:text-stone-100">
                  Sẵn sàng thu tiền mặt & Xuất hóa đơn
                </h4>
                <p className="text-xs text-stone-500">
                  Tổng cần thu: <span className="font-bold text-emerald-600">{totalPayable.toLocaleString('vi-VN')}đ</span>
                  <br />
                  {cashGiven > 0 && `Khách đưa: ${cashGiven.toLocaleString('vi-VN')}đ • Thối lại: ${changeReturn.toLocaleString('vi-VN')}đ`}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/80 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={handlePrintReceipt}
            className="px-4 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-700 text-xs font-bold flex items-center gap-1.5 shadow-xs transition"
          >
            <Printer className="w-4 h-4 text-amber-600" />
            <span>In bill ra máy nhiệt (ESC/POS 80mm)</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 font-bold text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 text-xs transition"
            >
              Hủy / Quay lại
            </button>

            <button
              type="button"
              onClick={handleConfirmCheckout}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-black text-sm shadow-md shadow-emerald-600/20 flex items-center gap-2 transition"
            >
              <CheckCircle className="w-4 h-4" />
              <span>
                Xác nhận Đã Thu Tiền ({totalPayable.toLocaleString('vi-VN')}đ)
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
