import React from 'react';
import { usePOS } from '../../context/POSContext';
import { Bell, Sparkles, X, ArrowRight, Utensils } from 'lucide-react';

export const QRNotificationToast: React.FC = () => {
  const { qrNotification, clearQrNotification, setActiveTable, tables } = usePOS();

  if (!qrNotification) return null;

  const handleOpenTable = () => {
    const found = tables.find((t) => t.id === qrNotification.tableId);
    if (found) {
      setActiveTable(found);
    }
    clearQrNotification();
  };

  return (
    <div className="fixed top-4 right-4 z-50 max-w-md w-full animate-in slide-in-from-top-4 duration-300">
      <div className="bg-slate-900 text-white rounded-2xl p-4 border-2 border-amber-500 shadow-2xl flex items-start gap-3 relative overflow-hidden">
        {/* Glowing pulse indicator */}
        <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black shrink-0 animate-pulse">
          <Bell className="w-5 h-5" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="font-black text-amber-400 text-sm">
                🔔 KHÁCH VỪA GỌI MÓN TẠI BÀN!
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">
              {qrNotification.timestamp}
            </span>
          </div>

          <p className="text-xs text-slate-200 mt-1">
            <span className="font-bold text-white text-sm underline decoration-amber-500">
              {qrNotification.tableName}
            </span>{' '}
            vừa gửi order gồm{' '}
            <span className="font-black text-amber-300">{qrNotification.itemCount} món</span> (
            <span className="font-mono text-amber-300">
              {qrNotification.totalAmount.toLocaleString('vi-VN')}đ
            </span>
            ) qua mã QR.
          </p>

          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              onClick={handleOpenTable}
              className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-xs transition active:scale-95"
            >
              <span>Mở Bàn Xem Đơn</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={clearQrNotification}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition"
            >
              Đã Xem
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={clearQrNotification}
          className="text-slate-400 hover:text-white p-1 rounded-lg"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
