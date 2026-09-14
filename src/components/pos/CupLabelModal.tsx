import React, { useState, useRef } from 'react';
import { usePOS } from '../../context/POSContext';
import { Order, OrderItem } from '../../types/pos';
import {
  X,
  Printer,
  CupSoda,
  UtensilsCrossed,
  Check,
  Filter,
  Layers,
  Sparkles,
  Tag,
  Copy,
  Clock,
  Phone,
  QrCode,
} from 'lucide-react';

interface CupLabelModalProps {
  order: Order;
  onClose: () => void;
  onPrinted?: () => void;
}

export interface PrintableLabel {
  id: string;
  itemIndex: number;
  totalInOrder: number;
  itemTotalQtyIndex: number;
  itemTotalQty: number;
  productName: string;
  station: 'BAR' | 'KITCHEN';
  sizeName?: string;
  cookingMethodName?: string;
  sugarLevel?: string;
  iceLevel?: string;
  toppings: { name: string; price: number; quantity: number }[];
  note?: string;
  unitPrice: number;
  totalPrice: number;
  orderCode: string;
  tableName: string;
  orderType: string;
  createdAt: string;
  customerNote?: string;
  deliveryPhone?: string;
  deliveryAddress?: string;
}

export const CupLabelModal: React.FC<CupLabelModalProps> = ({
  order,
  onClose,
  onPrinted,
}) => {
  const { settings, activeUser } = usePOS();
  const [stationFilter, setStationFilter] = useState<'ALL' | 'BAR' | 'KITCHEN'>('ALL');
  const [selectedLabelIds, setSelectedLabelIds] = useState<string[]>([]);
  const [isCopied, setIsCopied] = useState(false);

  // Expand all non-cancelled items into individual unit stickers (Ly 1/X, Ly 2/X...)
  const activeItems = order.items.filter((it) => it.status !== 'CANCELLED');
  const totalItemUnits = activeItems.reduce((sum, it) => sum + it.quantity, 0);

  const allLabels: PrintableLabel[] = [];
  let globalIndex = 0;

  activeItems.forEach((item) => {
    for (let q = 1; q <= item.quantity; q++) {
      globalIndex++;
      allLabels.push({
        id: `${item.id}-unit-${q}`,
        itemIndex: globalIndex,
        totalInOrder: totalItemUnits,
        itemTotalQtyIndex: q,
        itemTotalQty: item.quantity,
        productName: item.productName,
        station: item.station || 'BAR',
        sizeName: item.selectedSize?.name,
        cookingMethodName: item.selectedCookingMethod?.name,
        sugarLevel: item.sugarLevel,
        iceLevel: item.iceLevel,
        toppings: item.selectedToppings?.map((t) => ({
          name: t.name,
          price: t.price,
          quantity: t.quantity,
        })) || [],
        note: item.note,
        unitPrice: item.unitPrice,
        totalPrice: item.unitPrice,
        orderCode: order.orderCode || `#KM-${order.id.slice(-4)}`,
        tableName: order.tableName || `Bàn ${order.tableId}`,
        orderType: order.orderType || 'DINE_IN',
        createdAt: order.createdAt || new Date().toISOString(),
        customerNote: order.customerNote,
        deliveryPhone: order.deliveryPhone,
        deliveryAddress: order.deliveryAddress,
      });
    }
  });

  const filteredLabels = allLabels.filter((label) => {
    if (stationFilter === 'ALL') return true;
    return label.station === stationFilter;
  });

  const handlePrint = () => {
    window.print();
    if (onPrinted) {
      onPrinted();
    }
  };

  const formatPrice = (p: number) => {
    return p.toLocaleString('vi-VN') + 'đ';
  };

  const formatDateTime = (iso: string) => {
    try {
      const d = new Date(iso);
      const hours = d.getHours().toString().padStart(2, '0');
      const mins = d.getMinutes().toString().padStart(2, '0');
      const day = d.getDate().toString().padStart(2, '0');
      const month = (d.getMonth() + 1).toString().padStart(2, '0');
      return `${hours}:${mins} - ${day}/${month}`;
    } catch {
      return '';
    }
  };

  const isTakeaway =
    order.orderType === 'TAKEAWAY' ||
    order.orderType === 'DELIVERY' ||
    order.tableName.toLowerCase().includes('mang về') ||
    order.tableName.toLowerCase().includes('ship');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs overflow-y-auto">
      {/* Container Dialog */}
      <div className="bg-white dark:bg-[#241812] rounded-3xl max-w-4xl w-full border border-slate-200 dark:border-[#3D2B1F] shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-100 dark:border-[#3D2B1F] flex items-center justify-between bg-slate-50/70 dark:bg-[#2C1D15]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500 text-slate-950 shadow-sm">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-lg text-slate-900 dark:text-[#FFFDF9]">
                  In Tem Dán Ly & Dán Món (Cup Sticker Label)
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/30">
                  {filteredLabels.length} Tem dán
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-[#CDB49E]">
                {order.tableName} • {order.orderCode} • {isTakeaway ? 'Mang về / Ship' : 'Dùng tại quán'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-[#35251C] transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter & Options Toolbar */}
        <div className="p-4 border-b border-slate-100 dark:border-[#3D2B1F] bg-white dark:bg-[#241812] flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 dark:text-[#CDB49E] font-bold mr-1">Lọc món in:</span>
            <button
              type="button"
              onClick={() => setStationFilter('ALL')}
              className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${
                stationFilter === 'ALL'
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'bg-slate-100 dark:bg-[#35251C] text-slate-700 dark:text-[#EFE4D6] hover:bg-slate-200'
              }`}
            >
              Tất cả ({allLabels.length})
            </button>
            <button
              type="button"
              onClick={() => setStationFilter('BAR')}
              className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1 transition cursor-pointer ${
                stationFilter === 'BAR'
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'bg-slate-100 dark:bg-[#35251C] text-slate-700 dark:text-[#EFE4D6] hover:bg-slate-200'
              }`}
            >
              <CupSoda className="w-3.5 h-3.5" />
              <span>Đồ uống Bar ({allLabels.filter((l) => l.station === 'BAR').length})</span>
            </button>
            <button
              type="button"
              onClick={() => setStationFilter('KITCHEN')}
              className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1 transition cursor-pointer ${
                stationFilter === 'KITCHEN'
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'bg-slate-100 dark:bg-[#35251C] text-slate-700 dark:text-[#EFE4D6] hover:bg-slate-200'
              }`}
            >
              <UtensilsCrossed className="w-3.5 h-3.5" />
              <span>Bếp Ốc / Ăn vặt ({allLabels.filter((l) => l.station === 'KITCHEN').length})</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-400 dark:text-[#A89080]">
              Khổ in chuẩn máy in nhiệt 50x30mm / 40x30mm
            </span>
          </div>
        </div>

        {/* Sticker Previews Grid */}
        <div className="p-6 overflow-y-auto flex-1 bg-slate-100/60 dark:bg-[#1C120C]">
          {filteredLabels.length === 0 ? (
            <div className="p-12 text-center text-slate-400 dark:text-[#A89080]">
              <Tag className="w-12 h-12 mx-auto mb-2 opacity-40" />
              <p className="font-bold">Không có tem dán nào phù hợp với bộ lọc</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4" id="printable-cup-labels-container">
              {filteredLabels.map((label) => (
                <div
                  key={label.id}
                  className="cup-sticker-card bg-white text-slate-950 rounded-2xl p-4 border-2 border-slate-900/80 shadow-md flex flex-col justify-between relative overflow-hidden font-sans select-none"
                  style={{
                    minHeight: '190px',
                  }}
                >
                  {/* Stamp Header */}
                  <div className="border-b border-dashed border-slate-400 pb-1.5 mb-1.5 flex items-start justify-between">
                    <div>
                      <h4 className="font-black text-xs uppercase tracking-tight text-slate-900 leading-tight">
                        {settings.storeName || 'KAME - ỐC & TRÀ SỮA'}
                      </h4>
                      <p className="text-[9px] text-slate-600 font-mono">
                        {formatDateTime(label.createdAt)}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="inline-block px-2 py-0.5 rounded-md bg-slate-900 text-amber-300 font-mono font-black text-[11px]">
                        {label.tableName}
                      </span>
                    </div>
                  </div>

                  {/* Stamp Body: Product name & Options */}
                  <div className="my-auto space-y-1">
                    <div className="flex items-start justify-between gap-1">
                      <h5 className="font-black text-sm text-slate-950 leading-tight">
                        {label.productName}
                      </h5>
                    </div>

                    {/* Size or Cooking method */}
                    {(label.sizeName || label.cookingMethodName) && (
                      <p className="text-[11px] font-bold text-amber-900 bg-amber-50 px-1.5 py-0.5 rounded inline-block">
                        {label.sizeName || label.cookingMethodName}
                      </p>
                    )}

                    {/* Sugar & Ice Level */}
                    {(label.sugarLevel || label.iceLevel) && (
                      <div className="text-[11px] font-extrabold text-slate-800 flex items-center gap-1.5">
                        {label.sugarLevel && <span>Đường: {label.sugarLevel}</span>}
                        {label.sugarLevel && label.iceLevel && <span>•</span>}
                        {label.iceLevel && <span>Đá: {label.iceLevel}</span>}
                      </div>
                    )}

                    {/* Toppings list */}
                    {label.toppings.length > 0 && (
                      <p className="text-[10px] text-slate-700 font-medium leading-tight">
                        + {label.toppings.map((t) => `${t.name}${t.quantity > 1 ? ` (x${t.quantity})` : ''}`).join(', ')}
                      </p>
                    )}

                    {/* Item specific note */}
                    {label.note && (
                      <p className="text-[10px] italic text-rose-700 font-bold">
                        * Note: {label.note}
                      </p>
                    )}
                  </div>

                  {/* Stamp Footer: Order Table / Time & Unit Price */}
                  <div className="border-t border-dashed border-slate-400 pt-1.5 mt-1.5 flex items-center justify-between text-[10px]">
                    <div className="flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded bg-slate-900 text-amber-300 font-black text-[11px] font-mono">
                        {label.orderCode}
                      </span>
                      {label.note && (
                        <span className="text-[9px] text-slate-500 font-medium truncate max-w-[90px]">
                          {label.note}
                        </span>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-black text-xs text-slate-950">
                        {formatPrice(label.unitPrice)}
                      </span>
                    </div>
                  </div>

                  {/* Corner Watermark for Bar / Kitchen */}
                  <div className="absolute right-1 top-1/2 -translate-y-1/2 opacity-5 pointer-events-none font-black text-4xl uppercase">
                    {label.station === 'BAR' ? 'BAR' : 'KITCHEN'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="p-5 border-t border-slate-100 dark:border-[#3D2B1F] bg-white dark:bg-[#241812] flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-500 dark:text-[#CDB49E]">
            Sẵn sàng in <strong className="text-amber-600 dark:text-[#E8C5A5]">{filteredLabels.length} tem</strong> dán ly cho đơn hàng này.
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-none px-5 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-[#35251C] dark:hover:bg-[#473225] text-slate-700 dark:text-[#EFE4D6] font-bold text-xs transition cursor-pointer"
            >
              Đóng
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="flex-1 sm:flex-none px-6 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 active:scale-95 transition cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>In Tất Cả {filteredLabels.length} Tem Dán</span>
            </button>
          </div>
        </div>
      </div>

      {/* Embedded CSS for Thermal Label Printer Output */}
      <style>{`
        @media print {
          /* Hide everything in the page except the printable stickers container */
          body * {
            visibility: hidden;
          }
          #printable-cup-labels-container,
          #printable-cup-labels-container * {
            visibility: visible;
          }
          #printable-cup-labels-container {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            display: block !important;
            margin: 0;
            padding: 0;
          }
          .cup-sticker-card {
            width: 50mm !important;
            height: 30mm !important;
            max-height: 30mm !important;
            page-break-after: always !important;
            break-after: page !important;
            margin: 0 auto 5mm auto !important;
            padding: 2mm !important;
            box-sizing: border-box !important;
            border: 1px solid #000 !important;
            border-radius: 0 !important;
            box-shadow: none !important;
            background: #fff !important;
            color: #000 !important;
            font-size: 8pt !important;
            overflow: hidden !important;
          }
        }
      `}</style>
    </div>
  );
};
