import React, { useState, useEffect, useRef } from 'react';
import { usePOS } from '../../context/POSContext';
import { TableItem, OrderType, PaymentMethodType } from '../../types/pos';
import { SacombankQR } from '../common/SacombankQR';
import { ThermalReceipt } from './ThermalReceipt';
import { CupLabelModal } from './CupLabelModal';
import { calculateSettlement, calculateOrderSubtotal } from '../../utils/paymentEngine';
import { executePrintReceipt } from '../../utils/printService';
import { checkBankPaymentStatus, simulateBankPayment, BankTransaction } from '../../utils/bankPaymentService';
import confetti from 'canvas-confetti';
import {
  X,
  Printer,
  QrCode,
  Banknote,
  Percent,
  CheckCircle,
  Receipt,
  Bike,
  UtensilsCrossed,
  Layers,
  Building2,
  Tag,
  Eye,
  CreditCard,
  Sparkles,
  PrinterCheck,
  Radio,
  Loader2,
} from 'lucide-react';

interface BillCheckoutModalProps {
  table: TableItem;
  onClose: () => void;
  onPaymentDone: (paidOrder?: any) => void;
}

export const BillCheckoutModal: React.FC<BillCheckoutModalProps> = ({
  table,
  onClose,
  onPaymentDone,
}) => {
  const { orders, activeUser, settings, completePayment, updateOrderDetails, showToast } = usePOS();

  const currentOrder = orders.find(
    (o) => o.tableId === table.id && (o.status === 'ACTIVE' || o.status === 'PENDING_PAYMENT')
  );

  // Keep order cached in ref so that when order is marked PAID during checkout, the modal doesn't abruptly unmount/flash empty state
  const cachedOrderRef = useRef(currentOrder);
  if (currentOrder) {
    cachedOrderRef.current = currentOrder;
  }
  const activeOrder = currentOrder || cachedOrderRef.current;

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
  const [showCupLabelModal, setShowCupLabelModal] = useState<boolean>(false);
  const [autoPrint, setAutoPrint] = useState<boolean>(settings.autoPrintOnPayment ?? true);
  const [isSubmittingCheckout, setIsSubmittingCheckout] = useState<boolean>(false);

  // Automated Bank Transfer Detection states
  const [detectedTransaction, setDetectedTransaction] = useState<BankTransaction | null>(null);
  const [isSimulatingBank, setIsSimulatingBank] = useState<boolean>(false);
  const isCompletedRef = useRef<boolean>(false);

  // 1. Calculate pure subtotal (safe with fallback)
  const subtotal = activeOrder ? calculateOrderSubtotal(activeOrder.items) : 0;
  const currentShipping = orderType === 'TAKEAWAY' ? shippingFee : 0;

  // 2. Pure financial settlement computation (Single Responsibility & DRY)
  const settlement = calculateSettlement({
    subtotal,
    discountPercent,
    taxPercent: settings.taxPercent || 0,
    shippingFee: currentShipping,
    paymentMethod,
    paymentDetails: {
      cashAmount: paymentMethod === 'MIXED' ? mixedCashAmount : (cashGiven > 0 ? cashGiven : undefined),
      shippingFee: currentShipping,
    },
  });

  const {
    discountAmount,
    taxAmount,
    totalAmount: totalPayable,
    cashAmountPaid,
    transferAmountPaid,
    changeAmount: changeReturn,
  } = settlement;

  // Effective cash given for pure cash display
  const effectiveCashGiven = cashGiven > 0 ? cashGiven : totalPayable;
  const actualMixedCash = cashAmountPaid;
  const mixedTransferRemaining = transferAmountPaid;
  const mixedCashChange = changeReturn;

  const handleOrderTypeChange = (newType: OrderType) => {
    if (!activeOrder) return;
    setOrderType(newType);
    const newFee = newType === 'DINE_IN' ? 0 : shippingFee;
    if (newType === 'DINE_IN') setShippingFee(0);
    updateOrderDetails(activeOrder.id, {
      orderType: newType,
      shippingFee: newFee,
    });
  };

  const handleShippingFeeChange = (fee: number) => {
    if (!activeOrder) return;
    setShippingFee(fee);
    updateOrderDetails(activeOrder.id, {
      shippingFee: fee,
    });
  };

  /**
   * Completes payment and automatically triggers thermal bill printing if autoPrint is enabled.
   */
  const handleConfirmCheckout = async () => {
    if (!activeOrder || isSubmittingCheckout) return;
    setIsSubmittingCheckout(true);

    const paymentDetails = {
      cashAmount: cashAmountPaid,
      transferAmount: transferAmountPaid,
      shippingFee: currentShipping,
    };

    try {
      const success = await completePayment(
        activeOrder.id,
        paymentMethod,
        discountPercent,
        settings.taxPercent || 0,
        paymentDetails
      );

      if (success) {
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

        // AUTO-PRINT: Automatically print bill when checkout succeeds
        if (autoPrint) {
          executePrintReceipt({ delayMs: 250 });
        }

        const completedOrder = {
          ...activeOrder,
          status: 'PAID' as const,
          paymentMethod,
          discountPercent,
          discountAmount,
          taxAmount,
          shippingFee: currentShipping,
          totalAmount: totalPayable,
          finalTotal: totalPayable,
          cashAmountPaid,
          transferAmountPaid,
          paidAt: new Date().toISOString(),
        };

        setShowPrintPreview(false);
        onPaymentDone(completedOrder);
      }
    } finally {
      setIsSubmittingCheckout(false);
    }
  };

  const handlePrintReceipt = () => {
    executePrintReceipt({ delayMs: 100 });
  };

  /**
   * AUTOMATED BANK CONFIRMATION ENGINE:
   * Polls API every 2s for incoming Sacombank / VietQR transaction matching this order.
   * As soon as bank confirms receipt, automatically completes payment and prints receipt!
   */
  useEffect(() => {
    const isQRPayment =
      paymentMethod === 'SACOMBANK_QR' || (paymentMethod === 'MIXED' && mixedTransferRemaining > 0);

    if (!activeOrder || !isQRPayment || isCompletedRef.current || detectedTransaction) {
      return;
    }

    let isMounted = true;
    let pollTimer: any = null;
    const targetAmount = paymentMethod === 'MIXED' ? mixedTransferRemaining : totalPayable;

    const runPoll = async () => {
      if (!isMounted || !activeOrder || isCompletedRef.current || detectedTransaction) return;

      const result = await checkBankPaymentStatus(
        activeOrder.orderCode,
        activeOrder.id,
        targetAmount,
        settings.bankApiKey
      );

      if (isMounted && result.paid && result.transaction && !isCompletedRef.current) {
        isCompletedRef.current = true;
        setDetectedTransaction(result.transaction);

        showToast(
          'success',
          'Ngân hàng đã nhận tiền!',
          `Sacombank báo có +${result.transaction.amountIn.toLocaleString('vi-VN')}đ. Đang tự động thanh toán & in bill...`
        );

        setIsSubmittingCheckout(true);
        const paymentDetails = {
          cashAmount: cashAmountPaid,
          transferAmount: targetAmount,
          shippingFee: currentShipping,
        };

        const success = await completePayment(
          activeOrder.id,
          paymentMethod,
          discountPercent,
          settings.taxPercent || 0,
          paymentDetails
        );

        if (success) {
          try {
            confetti({
              particleCount: 110,
              spread: 75,
              origin: { y: 0.6 },
            });
          } catch {}

          if (autoPrint) {
            executePrintReceipt({ delayMs: 350 });
          }

          const completedOrder = {
            ...activeOrder,
            status: 'PAID' as const,
            paymentMethod,
            discountPercent,
            discountAmount,
            taxAmount,
            shippingFee: currentShipping,
            totalAmount: totalPayable,
            finalTotal: totalPayable,
            cashAmountPaid,
            transferAmountPaid: targetAmount,
            paidAt: new Date().toISOString(),
          };

          setShowPrintPreview(false);
          onPaymentDone(completedOrder);
        } else {
          setIsSubmittingCheckout(false);
          isCompletedRef.current = false;
        }
        return;
      }

      if (isMounted && !isCompletedRef.current) {
        pollTimer = setTimeout(runPoll, 2000);
      }
    };

    pollTimer = setTimeout(runPoll, 1200);

    return () => {
      isMounted = false;
      if (pollTimer) clearTimeout(pollTimer);
    };
  }, [
    paymentMethod,
    activeOrder?.id,
    activeOrder?.orderCode,
    totalPayable,
    mixedTransferRemaining,
    cashAmountPaid,
    currentShipping,
    discountPercent,
    settings.taxPercent,
    settings.bankApiKey,
    autoPrint,
    detectedTransaction,
    completePayment,
    onPaymentDone,
    showToast,
  ]);

  /**
   * Rapid testing helper: simulates an instant bank transfer confirmation from UI
   */
  const handleSimulateBankTransfer = async () => {
    if (!activeOrder || isSimulatingBank || isSubmittingCheckout || detectedTransaction) return;
    setIsSimulatingBank(true);
    try {
      const targetAmount = paymentMethod === 'MIXED' ? mixedTransferRemaining : totalPayable;
      const res = await simulateBankPayment(
        activeOrder.orderCode,
        activeOrder.id,
        targetAmount,
        table.code
      );
      if (res.success) {
        showToast('info', 'Giả lập ngân hàng', res.message);
      } else {
        showToast('error', 'Lỗi giả lập', res.message);
      }
    } catch (err: any) {
      showToast('error', 'Lỗi giả lập', err?.message || 'Không thể gửi yêu cầu');
    } finally {
      setIsSimulatingBank(false);
    }
  };

  const quickCashOptions = [
    totalPayable,
    Math.ceil(totalPayable / 50000) * 50000,
    Math.ceil(totalPayable / 100000) * 100000,
    500000,
  ].filter((v, i, a) => a.indexOf(v) === i && v >= totalPayable);

  if (!activeOrder) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
        <div className="bg-white dark:bg-stone-900 rounded-2xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl border border-stone-200 dark:border-stone-800">
          <p className="text-sm font-bold text-stone-700 dark:text-stone-300">
            Bàn này hiện chưa có hóa đơn đang hoạt động.
          </p>
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-stone-900 text-white rounded-xl text-xs font-bold cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-stone-950/75 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
      <div
        className="bg-white dark:bg-stone-900 rounded-2xl sm:rounded-3xl shadow-2xl border border-stone-200 dark:border-stone-800 w-full max-w-4xl overflow-hidden flex flex-col my-auto max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-4 py-3 sm:px-5 sm:py-3.5 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between bg-stone-50 dark:bg-stone-800/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 sm:p-2.5 rounded-xl bg-amber-500 text-stone-950 font-black shadow-md shadow-amber-500/20">
              <Receipt className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <h3 className="text-base sm:text-lg font-black text-stone-900 dark:text-stone-100">
                  Thanh Toán & In Bill
                </h3>
                <span className="text-[11px] sm:text-xs px-2 py-0.5 rounded-full font-mono font-bold bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                  {table.code} - {table.name}
                </span>
                <span
                  className={`text-[11px] sm:text-xs px-2 py-0.5 rounded-full font-bold flex items-center gap-1 ${
                    orderType === 'TAKEAWAY'
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                      : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                  }`}
                >
                  {orderType === 'TAKEAWAY' ? <Bike className="w-3 h-3" /> : <UtensilsCrossed className="w-3 h-3" />}
                  {orderType === 'TAKEAWAY' ? 'Đem về' : 'Ăn tại chỗ'}
                </span>
              </div>
              <p className="text-[11px] text-stone-500 font-medium">
                Mã đơn: <span className="font-mono font-bold">{activeOrder.orderCode}</span> • Thu ngân: {activeUser.name}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setShowPrintPreview(!showPrintPreview)}
              className={`px-2.5 sm:px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                showPrintPreview
                  ? 'bg-amber-500 text-stone-950 border-amber-600 shadow-xs'
                  : 'bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 border-stone-300 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-700'
              }`}
            >
              {showPrintPreview ? <Eye className="w-3.5 h-3.5" /> : <Printer className="w-3.5 h-3.5 text-amber-600" />}
              <span>{showPrintPreview ? 'Xem Mã QR' : 'Mẫu In (80mm)'}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-200 dark:hover:bg-stone-800 transition cursor-pointer"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>

        {/* Content Layout */}
        <div className="p-3 sm:p-4 overflow-y-auto flex-1 grid grid-cols-1 md:grid-cols-12 gap-3 sm:gap-4 items-start">
          {/* LEFT COLUMN: Order Items, Takeaway/Shipping & Bill Calculation */}
          <div className="lg:col-span-7 space-y-4 min-w-0">
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
                    className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
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
                    className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
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
                        className={`py-1.5 rounded-xl font-bold text-xs transition border cursor-pointer ${
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

              <div className="p-3 divide-y divide-stone-100 dark:divide-stone-800 max-h-40 overflow-y-auto">
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
                            • Sốt/Chế biến: {item.selectedCookingMethod.name}
                          </p>
                        )}
                        {item.selectedSize && (
                          <p className="text-[11px] text-stone-500">• Size: {item.selectedSize.name}</p>
                        )}
                        {item.selectedToppings && item.selectedToppings.length > 0 && (
                          <p className="text-[11px] text-stone-500">
                            • Topping: {item.selectedToppings.map((t) => t.name).join(', ')}
                          </p>
                        )}
                      </div>
                      <span className="font-bold text-stone-800 dark:text-stone-200 font-mono">
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
                  Giảm giá / Chiết khấu (%)
                </span>
                <div className="flex items-center gap-1">
                  {[0, 5, 10, 15, 20].map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => setDiscountPercent(pct)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                        discountPercent === pct
                          ? 'bg-amber-500 text-stone-950 shadow-xs'
                          : 'bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-700'
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
                  <span className="font-mono">{subtotal.toLocaleString('vi-VN')}đ</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-medium">
                    <span>Chiết khấu giảm ({discountPercent}%):</span>
                    <span className="font-mono">-{discountAmount.toLocaleString('vi-VN')}đ</span>
                  </div>
                )}
                {orderType === 'TAKEAWAY' && currentShipping > 0 && (
                  <div className="flex justify-between text-blue-600 dark:text-blue-400 font-medium">
                    <span>Phí ship giao hàng:</span>
                    <span className="font-mono">+{currentShipping.toLocaleString('vi-VN')}đ</span>
                  </div>
                )}
                {taxAmount > 0 && (
                  <div className="flex justify-between text-stone-500">
                    <span>VAT ({settings.taxPercent}%):</span>
                    <span className="font-mono">+{taxAmount.toLocaleString('vi-VN')}đ</span>
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
          </div>

          {/* RIGHT COLUMN: Payment Selector & Contextual Execution View */}
          <div className="lg:col-span-5 space-y-3 flex flex-col min-w-0 w-full">
            {/* Payment Method Selector */}
            <div className="p-3 bg-stone-50 dark:bg-stone-800/60 rounded-2xl border border-stone-200 dark:border-stone-800 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black text-stone-800 dark:text-stone-200 uppercase tracking-wider">
                  Chọn hình thức thanh toán
                </label>
                <span className="text-[10px] text-stone-500">Nhấp để đổi</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {/* 1. Dynamic Bank QR */}
                <button
                  type="button"
                  onClick={() => {
                    setPaymentMethod('SACOMBANK_QR');
                    setShowPrintPreview(false);
                  }}
                  className={`p-2 rounded-xl border text-center flex flex-col items-center justify-center gap-0.5 transition cursor-pointer ${
                    paymentMethod === 'SACOMBANK_QR' && !showPrintPreview
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/60 text-blue-950 dark:text-blue-200 font-black ring-2 ring-blue-500 shadow-xs'
                      : 'border-stone-200 dark:border-stone-700 hover:border-stone-300 text-stone-600 dark:text-stone-400 bg-white dark:bg-stone-900'
                  }`}
                >
                  <Building2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span className="text-xs font-bold leading-tight truncate max-w-[90px]">
                    QR {settings.bankName || 'Ngân Hàng'}
                  </span>
                  <span className="text-[9px] text-blue-600 dark:text-blue-400 font-medium leading-none">Chuyển khoản</span>
                </button>

                {/* 2. Tiền mặt */}
                <button
                  type="button"
                  onClick={() => {
                    setPaymentMethod('CASH');
                    setShowPrintPreview(false);
                    if (cashGiven < totalPayable) setCashGiven(totalPayable);
                  }}
                  className={`p-2.5 rounded-xl border text-center flex flex-col items-center justify-center gap-1 transition cursor-pointer ${
                    paymentMethod === 'CASH' && !showPrintPreview
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-950 dark:text-emerald-200 font-black ring-2 ring-emerald-500 shadow-xs'
                      : 'border-stone-200 dark:border-stone-700 hover:border-stone-300 text-stone-600 dark:text-stone-400 bg-white dark:bg-stone-900'
                  }`}
                >
                  <Banknote className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-xs font-bold leading-tight">Tiền mặt</span>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium leading-none">Thu & thối</span>
                </button>

                {/* 3. MIX (Tiền mặt + Chuyển khoản) */}
                <button
                  type="button"
                  onClick={() => {
                    setPaymentMethod('MIXED');
                    setShowPrintPreview(false);
                    if (mixedCashAmount === 0) setMixedCashAmount(Math.floor(totalPayable / 2));
                  }}
                  className={`p-2.5 rounded-xl border text-center flex flex-col items-center justify-center gap-1 transition cursor-pointer ${
                    paymentMethod === 'MIXED' && !showPrintPreview
                      ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/60 text-amber-950 dark:text-amber-200 font-black ring-2 ring-amber-500 shadow-xs'
                      : 'border-stone-200 dark:border-stone-700 hover:border-stone-300 text-stone-600 dark:text-stone-400 bg-white dark:bg-stone-900'
                  }`}
                >
                  <Layers className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <span className="text-xs font-bold leading-tight">Mix (TM + CK)</span>
                  <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium leading-none">Chia 2 loại</span>
                </button>
              </div>
            </div>

            {/* Contextual Execution View */}
            <div className="flex-1 p-3 bg-stone-50 dark:bg-stone-800/40 rounded-2xl border border-stone-200 dark:border-stone-800 min-h-[300px] flex flex-col items-center justify-center">
            {showPrintPreview ? (
              /* THERMAL RECEIPT PREVIEW (ESC/POS 80mm) */
              <ThermalReceipt
                order={activeOrder}
                table={table}
                activeUser={activeUser}
                settings={settings}
                subtotal={subtotal}
                discountAmount={discountAmount}
                discountPercent={discountPercent}
                shippingFee={currentShipping}
                taxAmount={taxAmount}
                totalPayable={totalPayable}
                paymentMethod={paymentMethod}
                cashGiven={effectiveCashGiven}
                changeReturn={changeReturn}
                cashAmountPaid={cashAmountPaid}
                transferAmountPaid={transferAmountPaid}
                isPreview={true}
              />
            ) : paymentMethod === 'SACOMBANK_QR' ? (
              /* QR CODE DISPLAY COMPONENT WITH AUTOMATIC BANK TRANSACTION DETECTION (COMPACT MODE) */
              <div className="w-full flex flex-col items-center justify-center space-y-2">
                <SacombankQR
                  amount={totalPayable}
                  orderCode={activeOrder.orderCode}
                  tableName={table.code}
                  compact={true}
                />

                {/* Real-time Bank Detection Status / Compact Pill */}
                {detectedTransaction ? (
                  <div className="w-full max-w-[260px] p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-500 text-emerald-900 dark:text-emerald-100 text-xs text-center space-y-0.5 shadow-xs">
                    <p className="font-black text-xs text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-600 animate-bounce" />
                      Đã nhận: +{detectedTransaction.amountIn.toLocaleString('vi-VN')}đ!
                    </p>
                    <p className="text-[10px] text-stone-500">
                      Mã: <span className="font-mono font-bold">{detectedTransaction.referenceNumber}</span> • Đang in bill...
                    </p>
                  </div>
                ) : (
                  <div className="w-full max-w-[260px] flex items-center justify-between px-2.5 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-200 text-[11px]">
                    <div className="flex items-center gap-1.5">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                      </span>
                      <span className="font-bold text-[11px]">Chờ ngân hàng báo có...</span>
                    </div>

                    <button
                      type="button"
                      onClick={handleSimulateBankTransfer}
                      disabled={isSimulatingBank || isSubmittingCheckout || !!detectedTransaction}
                      className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-900/60 hover:bg-amber-200 text-amber-900 dark:text-amber-200 transition cursor-pointer flex items-center gap-1 disabled:opacity-50"
                      title="Mô phỏng tiền về để kiểm tra tự động chốt đơn"
                    >
                      <Sparkles className="w-2.5 h-2.5 text-amber-600" />
                      <span>{isSimulatingBank ? '...' : 'Test báo có'}</span>
                    </button>
                  </div>
                )}
              </div>
            ) : paymentMethod === 'CASH' ? (
              /* CASH PAYMENT CONTROLS */
              <div className="w-full max-w-sm space-y-3.5 my-auto">
                <div className="flex flex-col items-center justify-center text-center space-y-1">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 shadow-inner">
                    <Banknote className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-black text-stone-900 dark:text-stone-100">
                    Thu Tiền Mặt Tại Quầy
                  </h4>
                  <p className="text-xs text-stone-500">
                    Khách cần trả:{' '}
                    <span className="font-black text-emerald-600 dark:text-emerald-400 text-sm">
                      {totalPayable.toLocaleString('vi-VN')}đ
                    </span>
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 space-y-3 shadow-xs">
                  <div>
                    <label className="text-xs font-bold text-stone-800 dark:text-stone-200 flex items-center justify-between mb-1">
                      <span>Số tiền khách đưa:</span>
                      <span className="font-mono text-emerald-600 font-bold text-xs">
                        {(cashGiven || 0).toLocaleString('vi-VN')}đ
                      </span>
                    </label>
                    <input
                      type="number"
                      value={cashGiven || ''}
                      onChange={(e) => setCashGiven(Number(e.target.value))}
                      placeholder={totalPayable.toString()}
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 text-right font-black text-base bg-stone-50 dark:bg-stone-800 focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  {/* Quick cash options */}
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => setCashGiven(totalPayable)}
                      className="px-2.5 py-1 rounded-lg text-xs font-black bg-emerald-600 text-white hover:bg-emerald-700 cursor-pointer shadow-2xs"
                    >
                      Đủ tiền ({totalPayable.toLocaleString('vi-VN')}đ)
                    </button>
                    {quickCashOptions
                      .filter((amt) => amt !== totalPayable)
                      .map((amt) => (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => setCashGiven(amt)}
                          className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-800 dark:text-stone-200 hover:bg-emerald-50 hover:border-emerald-300 cursor-pointer"
                        >
                          {amt.toLocaleString('vi-VN')}đ
                        </button>
                      ))}
                  </div>

                  {/* Change return */}
                  <div className="flex justify-between items-center pt-2.5 border-t border-stone-200 dark:border-stone-700 text-xs">
                    <span className="font-bold text-stone-700 dark:text-stone-300">
                      Tiền thối lại cho khách:
                    </span>
                    <span className="text-lg font-black text-emerald-600 dark:text-emerald-400 font-mono">
                      {changeReturn.toLocaleString('vi-VN')}đ
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              /* MIXED PAYMENT CONTROLS: CASH + QR TRANSFER */
              <div className="w-full max-w-sm space-y-3 my-auto">
                <div className="p-3 bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-700 space-y-2 shadow-xs">
                  <label className="text-xs font-bold text-stone-700 dark:text-stone-300 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Banknote className="w-3.5 h-3.5 text-emerald-600" />
                      1. Tiền mặt khách trả:
                    </span>
                    <span className="font-mono text-emerald-600 font-bold text-xs">
                      {(mixedCashAmount || 0).toLocaleString('vi-VN')}đ
                    </span>
                  </label>
                  <input
                    type="number"
                    value={mixedCashAmount || ''}
                    onChange={(e) => setMixedCashAmount(Number(e.target.value))}
                    placeholder="Nhập số tiền mặt..."
                    className="w-full px-3 py-1.5 rounded-lg border border-stone-300 dark:border-stone-700 font-black text-sm text-emerald-600 bg-emerald-50/30 dark:bg-emerald-950/20 focus:ring-2 focus:ring-emerald-500"
                  />
                  <div className="flex flex-wrap gap-1">
                    {[
                      { label: '50%', val: Math.round(totalPayable / 2) },
                      { label: '50k', val: 50000 },
                      { label: '100k', val: 100000 },
                      { label: '200k', val: 200000 },
                    ].map((item) => (
                      <button
                        key={item.label}
                        type="button"
                        onClick={() => setMixedCashAmount(item.val)}
                        className="px-2 py-0.5 rounded bg-stone-100 dark:bg-stone-800 text-[10px] font-bold text-stone-700 dark:text-stone-300 hover:bg-emerald-100 cursor-pointer"
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                  {mixedCashChange > 0 && (
                    <p className="text-[10px] text-amber-600 font-bold">
                      * Thối lại tiền mặt: {mixedCashChange.toLocaleString('vi-VN')}đ
                    </p>
                  )}
                </div>

                <div className="p-3 bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-700 flex flex-col items-center space-y-2 shadow-xs">
                  <div className="w-full flex items-center justify-between text-xs font-bold">
                    <span className="text-blue-700 dark:text-blue-300 flex items-center gap-1">
                      <QrCode className="w-3.5 h-3.5 text-blue-600" />
                      2. Còn lại quét QR Sacombank:
                    </span>
                    <span className="font-mono text-sm text-blue-600 dark:text-blue-400 font-black">
                      {mixedTransferRemaining.toLocaleString('vi-VN')}đ
                    </span>
                  </div>

                  <SacombankQR
                    amount={mixedTransferRemaining}
                    orderCode={activeOrder.orderCode}
                    tableName={table.code}
                    compact={true}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="px-4 py-2.5 sm:px-5 sm:py-3 border-t border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/80 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={handlePrintReceipt}
              className="px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-700 text-xs font-bold flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-amber-600" />
              <span>In bill (80mm)</span>
            </button>

            <button
              type="button"
              onClick={() => setShowCupLabelModal(true)}
              className="px-3 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-900 dark:text-amber-300 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
            >
              <Tag className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>In tem ly</span>
            </button>

            {/* Auto-print toggle */}
            <label className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 text-[11px] font-bold text-amber-900 dark:text-amber-300 cursor-pointer select-none hover:bg-amber-100/70 transition">
              <input
                type="checkbox"
                checked={autoPrint}
                onChange={(e) => setAutoPrint(e.target.checked)}
                className="w-3.5 h-3.5 rounded text-amber-600 focus:ring-amber-500 border-amber-300 dark:border-amber-700 cursor-pointer"
              />
              <PrinterCheck className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>Tự in khi thanh toán</span>
            </label>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmittingCheckout}
              className="px-3.5 py-2 rounded-xl border border-stone-300 dark:border-stone-700 font-bold text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 text-xs transition cursor-pointer disabled:opacity-50"
            >
              Đóng
            </button>

            <button
              type="button"
              onClick={handleConfirmCheckout}
              disabled={isSubmittingCheckout}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-black text-xs sm:text-sm shadow-md shadow-emerald-600/20 flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
            >
              <CheckCircle className="w-4 h-4" />
              <span>
                {isSubmittingCheckout
                  ? 'Đang xử lý...'
                  : autoPrint
                  ? `Xác nhận & In Bill (${totalPayable.toLocaleString('vi-VN')}đ)`
                  : `Xác nhận Thu Tiền (${totalPayable.toLocaleString('vi-VN')}đ)`}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Hidden-from-screen Thermal Receipt rendered specifically for @media print */}
      {!showPrintPreview && (
        <ThermalReceipt
          order={activeOrder}
          table={table}
          activeUser={activeUser}
          settings={settings}
          subtotal={subtotal}
          discountAmount={discountAmount}
          discountPercent={discountPercent}
          shippingFee={currentShipping}
          taxAmount={taxAmount}
          totalPayable={totalPayable}
          paymentMethod={paymentMethod}
          cashGiven={effectiveCashGiven}
          changeReturn={changeReturn}
          cashAmountPaid={cashAmountPaid}
          transferAmountPaid={transferAmountPaid}
          isPreview={false}
        />
      )}

      {/* Cup Sticker Label Modal */}
      {showCupLabelModal && activeOrder && (
        <CupLabelModal
          order={activeOrder}
          onClose={() => setShowCupLabelModal(false)}
        />
      )}
    </div>
  );
};
