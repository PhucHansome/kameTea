import React, { useEffect } from 'react';
import { Order } from '../../types/pos';
import confetti from 'canvas-confetti';
import {
  CheckCircle2,
  Printer,
  Tag,
  ArrowRight,
  Receipt,
  Sparkles,
  CreditCard,
  Building2,
  Banknote,
  X,
} from 'lucide-react';

interface PaymentSuccessModalProps {
  order: Order;
  onClose: () => void;
  onPrintReceipt: () => void;
  onPrintCupLabels?: () => void;
}

export const PaymentSuccessModal: React.FC<PaymentSuccessModalProps> = ({
  order,
  onClose,
  onPrintReceipt,
  onPrintCupLabels,
}) => {
  useEffect(() => {
    try {
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
      });
    } catch {
      // safe fallback
    }
  }, []);

  const itemsCount = order.items.reduce(
    (s, it) => (it.status !== 'CANCELLED' ? s + it.quantity : s),
    0
  );

  const getPaymentMethodBadge = () => {
    switch (order.paymentMethod) {
      case 'SACOMBANK_QR':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
            <Building2 className="w-3.5 h-3.5 text-blue-600" />
            Sacombank VietQR
          </span>
        );
      case 'VIETQR':
      case 'BANK_TRANSFER':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
            Chuyển khoản VietQR
          </span>
        );
      case 'CASH':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            <Banknote className="w-3.5 h-3.5 text-amber-600" />
            Tiền mặt
          </span>
        );
      case 'MIXED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
            <Sparkles className="w-3.5 h-3.5 text-purple-600" />
            Tiền mặt + Chuyển khoản
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-slate-100 dark:bg-stone-800 text-slate-700 dark:text-stone-300">
            <CreditCard className="w-3.5 h-3.5" />
            {order.paymentMethod}
          </span>
        );
    }
  };

  const formattedTime = order.paidAt
    ? new Date(order.paidAt).toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
    : new Date().toLocaleTimeString('vi-VN');

  return (
    <div
      id="payment-success-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div className="bg-white dark:bg-[#1E1713] rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-emerald-500/30 dark:border-emerald-500/20 flex flex-col items-center text-center relative overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Decorative Top Accent Glow */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-48 h-48 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button Top Right */}
        <button
          id="btn-close-success-modal"
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-stone-200 hover:bg-slate-100 dark:hover:bg-stone-800 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Celebratory Icon */}
        <div className="relative mb-3">
          <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-3xl bg-emerald-100 dark:bg-emerald-950/60 border-2 border-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <CheckCircle2 className="w-10 h-10 sm:w-11 sm:h-11 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-amber-400 text-slate-950 shadow-md">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Title */}
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-[#FFFDF9] tracking-tight">
          ĐÃ THANH TOÁN THÀNH CÔNG!
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-[#CDB49E] mt-1">
          Hệ thống đã xác nhận thu tiền và chuyển bàn về trạng thái sẵn sàng.
        </p>

        {/* Amount Highlight Box */}
        <div className="w-full my-4 py-3 px-4 rounded-2xl bg-emerald-50 dark:bg-[#15241B] border border-emerald-500/30 flex flex-col items-center justify-center">
          <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
            Tổng số tiền đã nhận
          </span>
          <span className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 font-mono tracking-tight mt-0.5">
            {(order.finalTotal || order.totalAmount).toLocaleString('vi-VN')}đ
          </span>
        </div>

        {/* Order Details Bento Card */}
        <div className="w-full bg-slate-50 dark:bg-[#2A1F18] rounded-2xl p-4 border border-slate-200 dark:border-[#3D2B1F] text-xs space-y-2.5 text-left mb-5">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 dark:text-[#A89080]">Bàn / Khách hàng:</span>
            <span className="font-bold text-slate-900 dark:text-white">
              {order.tableName} {order.orderType === 'TAKEAWAY' ? '(Mang Về)' : ''}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-500 dark:text-[#A89080]">Mã hóa đơn:</span>
            <span className="font-mono font-bold text-slate-800 dark:text-[#FAF7F2]">
              {order.orderCode}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-500 dark:text-[#A89080]">Số lượng món:</span>
            <span className="font-bold text-slate-800 dark:text-[#FAF7F2]">
              {itemsCount} món đã phục vụ
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-500 dark:text-[#A89080]">Thời gian:</span>
            <span className="font-mono text-slate-700 dark:text-[#E8C5A5]">
              {formattedTime}
            </span>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-200/80 dark:border-[#3D2B1F]">
            <span className="text-slate-500 dark:text-[#A89080]">Phương thức:</span>
            <div>{getPaymentMethodBadge()}</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="w-full space-y-2.5">
          <div className="flex items-center gap-2">
            <button
              id="btn-success-print-bill"
              type="button"
              onClick={onPrintReceipt}
              className="flex-1 py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#35251C] dark:hover:bg-[#473225] text-slate-800 dark:text-[#FFFDF9] font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <Printer className="w-4 h-4 text-slate-600 dark:text-stone-300" />
              <span>In Hóa Đơn</span>
            </button>

            {onPrintCupLabels && (
              <button
                id="btn-success-print-cup"
                type="button"
                onClick={onPrintCupLabels}
                className="flex-1 py-2.5 px-3 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-800 dark:text-amber-300 font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <Tag className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span>In Tem Ly</span>
              </button>
            )}
          </div>

          <button
            id="btn-success-confirm-done"
            type="button"
            onClick={onClose}
            className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/25 active:scale-98 transition cursor-pointer"
          >
            <span>Hoàn Tất & Quay Lại Bàn</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
