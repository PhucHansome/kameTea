import React, { useState } from 'react';
import { TableItem } from '../../types/pos';
import { Logo } from '../common/Logo';
import { usePOS } from '../../context/POSContext';
import {
  QrCode,
  Printer,
  Smartphone,
  X,
  Sparkles,
  Check,
  Copy,
  ExternalLink,
  Utensils,
  Share2,
} from 'lucide-react';

interface TableQRModalProps {
  table: TableItem;
  onClose: () => void;
  onOpenCustomerView: (table: TableItem) => void;
}

export const TableQRModal: React.FC<TableQRModalProps> = ({
  table,
  onClose,
  onOpenCustomerView,
}) => {
  const { settings } = usePOS();
  const [copied, setCopied] = useState(false);

  // Generate self-order link for this table
  const orderUrl = typeof window !== 'undefined'
    ? `${window.location.origin}${window.location.pathname}#order-table=${table.id}`
    : `https://kamepos.vn/order?table=${table.id}`;

  // Use reliable VietQR / QuickChart high-res QR code API
  const qrCodeImgSrc = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
    orderUrl
  )}&margin=10`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(orderUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrintStandee = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-transparent border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500 text-slate-950 shadow-md">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-base text-slate-900 dark:text-white flex items-center gap-2">
                Mã QR Tự Order — {table.name}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Khu vực: <span className="font-bold text-amber-600 dark:text-amber-400">{table.zone}</span> • Sức chứa: {table.capacity} khách
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: QR Card Preview */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
          {/* Printable Standee Template Container */}
          <div
            id="printable-table-standee"
            className="mx-auto max-w-xs bg-white text-slate-900 rounded-3xl p-6 border-2 border-amber-500/40 shadow-xl flex flex-col items-center text-center relative overflow-hidden"
          >
            {/* Top decorative badge */}
            <div className="w-full flex items-center justify-between border-b border-amber-100 pb-3 mb-4">
              <Logo size="sm" showSubtitle={false} />
              <div className="text-right">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-900 uppercase">
                  Self-Order
                </span>
              </div>
            </div>

            {/* Table Name Title */}
            <div className="mb-2">
              <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider block">
                {table.zone}
              </span>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                {table.name}
              </h2>
            </div>

            {/* QR Image Box */}
            <div className="w-48 h-48 p-2 rounded-2xl bg-white border-2 border-slate-900 shadow-inner flex items-center justify-center my-2 relative group">
              <img
                src={qrCodeImgSrc}
                alt={`QR code for ${table.name}`}
                className="w-full h-full object-contain"
              />
              <div className="absolute inset-0 bg-amber-500/10 opacity-0 group-hover:opacity-100 transition rounded-xl flex items-center justify-center pointer-events-none">
                <span className="bg-slate-950/80 text-white text-[10px] font-bold px-2 py-1 rounded-md">
                  KAME Order
                </span>
              </div>
            </div>

            {/* Instruction */}
            <p className="text-xs font-bold text-slate-800 mt-2">
              Quét mã để xem Menu & Gọi món trực tiếp
            </p>
            <p className="text-[10px] text-slate-500 mt-0.5">
              Đơn hàng sẽ tự động gửi thẳng đến quầy thu ngân & bếp
            </p>

            {/* Store bottom info */}
            <div className="mt-4 pt-3 border-t border-slate-100 w-full text-[9px] text-slate-400 font-medium space-y-0.5">
              <p className="font-bold text-slate-600">KAME • 74 Lê Lợi / 02 Chế Lan Viên</p>
              <p>Hotline: 0981.417.246 - 0334.080.648</p>
            </div>
          </div>

          {/* Action Links & Triggers */}
          <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-4 border border-slate-200 dark:border-slate-700/60 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700 dark:text-slate-300">
                Đường dẫn gọi món của bàn:
              </span>
              <button
                type="button"
                onClick={handleCopyLink}
                className="text-amber-600 dark:text-amber-400 font-bold hover:underline flex items-center gap-1"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Đã sao chép!' : 'Sao chép link'}</span>
              </button>
            </div>
            <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[11px] font-mono text-slate-600 dark:text-slate-400 truncate select-all">
              {orderUrl}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenCustomerView(table);
            }}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition"
          >
            <Smartphone className="w-4 h-4" />
            <span>Mở Trình Trải Nghiệm Khách Tự Order</span>
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={handlePrintStandee}
              className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-sm transition"
            >
              <Printer className="w-4 h-4" />
              <span>In Thẻ Bàn Standee</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
