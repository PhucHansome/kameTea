import React, { useState } from 'react';
import { usePOS } from '../../context/POSContext';
import { TableItem, TableStatus } from '../../types/pos';
import { TableQRModal } from './TableQRModal';
import { CustomerSelfOrderModal } from './CustomerSelfOrderModal';
import { ZoneManagementModal } from './ZoneManagementModal';
import {
  Users,
  Clock,
  DollarSign,
  Utensils,
  ArrowRightLeft,
  CreditCard,
  ChefHat,
  TrendingUp,
  BookOpen,
  Settings,
  Sparkles,
  ArrowUpRight,
  QrCode,
  Layers,
  Smartphone,
} from 'lucide-react';

interface TableGridProps {
  onSelectTable: (table: TableItem) => void;
  onOpenSplitMerge: (table: TableItem) => void;
  onOpenCheckout: (table: TableItem) => void;
}

export const TableGrid: React.FC<TableGridProps> = ({
  onSelectTable,
  onOpenSplitMerge,
  onOpenCheckout,
}) => {
  const { tables, orders, zones: availableZones } = usePOS();
  const [activeZone, setActiveZone] = useState<string>('TẤT CẢ');
  const [qrModalTable, setQrModalTable] = useState<TableItem | null>(null);
  const [customerOrderTable, setCustomerOrderTable] = useState<TableItem | null>(null);
  const [showZoneManagement, setShowZoneManagement] = useState<boolean>(false);

  const zoneNames = ['TẤT CẢ', ...availableZones.map((z) => z.name)];

  const filteredTables =
    activeZone === 'TẤT CẢ' ? tables : tables.filter((t) => t.zone === activeZone);

  // Status stats
  const emptyCount = tables.filter((t) => t.status === 'EMPTY').length;
  const occupiedCount = tables.filter((t) => t.status === 'OCCUPIED').length;
  const waitingPaymentCount = tables.filter((t) => t.status === 'WAITING_PAYMENT').length;

  // Active revenue calculation
  const paidOrders = orders.filter((o) => o.status === 'PAID');
  const paidRevenue = paidOrders.reduce((sum, o) => sum + (o.finalTotal || o.totalAmount), 0);
  const activeOrders = orders.filter((o) => o.status === 'ACTIVE' || o.status === 'PENDING_PAYMENT');
  const activeRevenue = activeOrders.reduce((sum, o) => sum + o.totalAmount, 0);
  const totalDisplayRevenue = paidRevenue > 0 ? paidRevenue : activeRevenue > 0 ? activeRevenue : 0;

  const getElapsedTime = (openedAt?: string) => {
    if (!openedAt) return null;
    const diffMs = Date.now() - new Date(openedAt).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 60) return `${diffMins}p`;
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return `${hours}h${mins}p`;
  };

  return (
    <div className="space-y-6">
      {/* ========================================================================= */}
      {/* 1. TOP BENTO ROW (3 Modular Bento Widgets) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
        {/* Bento Widget 1: Revenue Highlight Card */}
        <div className="md:col-span-12 lg:col-span-4 bg-amber-500 rounded-3xl p-6 text-slate-950 relative overflow-hidden shadow-lg shadow-amber-500/20 flex flex-col justify-between group">
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <p className="text-slate-900/80 text-xs font-black uppercase tracking-wider">
                Doanh thu hôm nay
              </p>
              <span className="p-1.5 rounded-full bg-slate-950/10 text-slate-950">
                <TrendingUp className="w-4 h-4" />
              </span>
            </div>

            <h3 className="text-3xl font-black mt-2 mb-1 tracking-tight">
              {totalDisplayRevenue.toLocaleString('vi-VN')}đ
            </h3>

            <div className="flex items-center gap-2 text-xs text-slate-900/90 mt-2 font-bold">
              <span className="px-2 py-0.5 bg-slate-950/10 rounded-md font-black text-[11px]">
                {paidOrders.length} đơn đã thanh toán
              </span>
              <span>• {activeOrders.length} bàn đang phục vụ</span>
            </div>
          </div>

          <div className="absolute -right-6 -bottom-6 w-36 h-36 rounded-full bg-white/20 blur-xs pointer-events-none group-hover:scale-110 transition-transform" />
        </div>

        {/* Bento Widget 2: Table Status Overview */}
        <div className="md:col-span-6 lg:col-span-4 bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">
                Trạng thái phòng bàn
              </p>
              <span className="p-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
                <Users className="w-4 h-4" />
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 mt-4">
              <div className="bg-emerald-50 dark:bg-emerald-950/30 p-2.5 rounded-2xl border border-emerald-200/50 text-center">
                <span className="text-xl font-black text-emerald-600 dark:text-emerald-400 block">
                  {occupiedCount}
                </span>
                <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300 uppercase">
                  Có khách
                </span>
              </div>

              <div className="bg-amber-50 dark:bg-amber-950/30 p-2.5 rounded-2xl border border-amber-200/50 text-center">
                <span className="text-xl font-black text-amber-600 dark:text-amber-400 block">
                  {waitingPaymentCount}
                </span>
                <span className="text-[10px] font-bold text-amber-800 dark:text-amber-300 uppercase">
                  Chờ bill
                </span>
              </div>

              <div className="bg-slate-100 dark:bg-slate-800 p-2.5 rounded-2xl text-center">
                <span className="text-xl font-black text-slate-700 dark:text-slate-300 block">
                  {emptyCount}
                </span>
                <span className="text-[10px] font-bold text-slate-500 uppercase">Bàn trống</span>
              </div>
            </div>
          </div>

          <div className="text-[11px] text-slate-400 mt-3 flex items-center justify-between">
            <span>Tổng cộng: {tables.length} bàn</span>
            <span className="font-bold text-amber-600 dark:text-amber-400">
              {availableZones.length} khu vực
            </span>
          </div>
        </div>

        {/* Bento Widget 3: Zone & QR Actions */}
        <div className="md:col-span-6 lg:col-span-4 bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">
                Quản lý & Tự Phục Vụ
              </p>
              <span className="p-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
                <QrCode className="w-4 h-4" />
              </span>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 font-medium">
              Mỗi bàn có 1 mã QR độc lập để khách tự quét order món. Thông báo lập tức gửi về thu ngân.
            </p>
          </div>

          <div className="flex items-center gap-2 mt-4">
            <button
              type="button"
              onClick={() => setShowZoneManagement(true)}
              className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 transition"
            >
              <Layers className="w-4 h-4 text-amber-500" />
              <span>Quản Lý Khu Vực & Bàn</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. MAIN BENTO TABLE GRID CONTAINER */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col space-y-6">
        {/* Bento Table Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-orange-900/50">
              <Utensils className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-black text-lg text-slate-900 dark:text-white flex items-center gap-2">
                Sơ đồ bàn & Khu vực
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Chạm vào bàn để mở đơn hoặc bấm icon [QR] để xem mã gọi món & in Standee
              </p>
            </div>
          </div>

          {/* Zone Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
            {zoneNames.map((zone) => (
              <button
                key={zone}
                onClick={() => setActiveZone(zone)}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  activeZone === zone
                    ? 'bg-slate-900 text-white dark:bg-amber-500 dark:text-slate-950 shadow-sm font-black'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {zone}
              </button>
            ))}
          </div>
        </div>

        {/* Bento Table Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {filteredTables.map((table) => {
            const order = orders.find(
              (o) => o.tableId === table.id && (o.status === 'ACTIVE' || o.status === 'PENDING_PAYMENT')
            );
            const elapsed = getElapsedTime(table.openedAt);
            const activeItemCount =
              order?.items.filter((i) => i.status !== 'CANCELLED').reduce((s, i) => s + i.quantity, 0) ||
              0;

            // Bento table card variants
            if (table.status === 'OCCUPIED') {
              return (
                <div
                  key={table.id}
                  onClick={() => onSelectTable(table)}
                  className="aspect-square bg-emerald-600 rounded-3xl p-4 flex flex-col justify-between text-white cursor-pointer hover:scale-105 transition-all shadow-md shadow-emerald-600/20 group relative overflow-hidden"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-xs font-black block">{table.name}</span>
                      <span className="text-[10px] opacity-75 font-medium">{table.zone}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setQrModalTable(table);
                        }}
                        className="p-1 rounded-lg bg-black/20 hover:bg-black/40 text-amber-300 transition"
                        title="Xem mã QR Order bàn & In Standee"
                      >
                        <QrCode className="w-3.5 h-3.5" />
                      </button>
                      {elapsed && (
                        <span className="text-[10px] bg-black/20 px-1.5 py-0.5 rounded-full font-mono font-bold flex items-center gap-0.5">
                          <Clock className="w-2.5 h-2.5" />
                          {elapsed}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="my-auto text-center">
                    <span className="text-lg font-black tracking-tight block">
                      {order ? `${Math.round(order.totalAmount / 1000)}K` : 'Đang chọn'}
                    </span>
                    <span className="text-[10px] opacity-85 font-medium block">
                      {activeItemCount} món • {table.guestCount || 2} khách
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-white/20 text-[10px] font-bold">
                    <span className="flex items-center gap-1">
                      <Utensils className="w-3 h-3" />
                      Xem món
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenCheckout(table);
                      }}
                      className="p-1 rounded-md bg-white/20 hover:bg-white text-white hover:text-emerald-800 transition"
                      title="Thanh toán"
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            }

            if (table.status === 'WAITING_PAYMENT') {
              return (
                <div
                  key={table.id}
                  onClick={() => onSelectTable(table)}
                  className="aspect-square bg-amber-400 rounded-3xl p-4 flex flex-col justify-between text-slate-900 cursor-pointer shadow-lg shadow-amber-400/20 hover:scale-105 transition-all group"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-xs uppercase font-black opacity-90 block">{table.name}</span>
                      <span className="text-[10px] font-semibold opacity-75">{table.zone}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setQrModalTable(table);
                        }}
                        className="p-1 rounded-lg bg-slate-900/10 hover:bg-slate-900/20 text-slate-900 transition"
                        title="Xem mã QR Order bàn"
                      >
                        <QrCode className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-[9px] bg-slate-900 text-amber-300 px-1.5 py-0.5 rounded-full font-black uppercase tracking-wider">
                        Chờ Bill
                      </span>
                    </div>
                  </div>

                  <div className="my-auto text-center">
                    <span className="text-xl font-black tracking-tight block">
                      {order ? `${Math.round(order.totalAmount / 1000)}K` : '0K'}
                    </span>
                    <span className="text-[10px] font-bold text-slate-800 block">
                      {activeItemCount} món
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenCheckout(table);
                    }}
                    className="w-full py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-[10px] flex items-center justify-center gap-1 shadow-sm transition"
                  >
                    <CreditCard className="w-3 h-3 text-amber-400" />
                    <span>Thu Tiền</span>
                  </button>
                </div>
              );
            }

            // EMPTY TABLE: Dashed clean modern bento container
            return (
              <div
                key={table.id}
                onClick={() => onSelectTable(table)}
                className="aspect-square border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl p-4 flex flex-col justify-between items-center text-slate-400 dark:text-slate-500 cursor-pointer hover:border-amber-400 hover:text-amber-500 hover:bg-amber-50/20 dark:hover:bg-amber-950/20 transition-all group hover:scale-102"
              >
                <div className="w-full flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-600 dark:text-slate-400 group-hover:text-amber-500">
                    {table.name}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setQrModalTable(table);
                    }}
                    className="p-1 rounded-md text-slate-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-slate-800 transition"
                    title="Mã QR & In Standee Bàn"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="my-auto flex flex-col items-center justify-center gap-1">
                  <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 group-hover:bg-amber-500 group-hover:text-slate-950 flex items-center justify-center transition-colors">
                    <Utensils className="w-4 h-4" />
                  </div>
                  <span className="text-[11px] font-bold">Mở Bàn</span>
                </div>

                <div className="w-full text-center">
                  <span className="text-[10px] text-slate-400 font-medium">{table.zone} ({table.capacity}K)</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Global Modals for Tables */}
      {qrModalTable && (
        <TableQRModal
          table={qrModalTable}
          onClose={() => setQrModalTable(null)}
          onOpenCustomerView={(tbl) => {
            setQrModalTable(null);
            setCustomerOrderTable(tbl);
          }}
        />
      )}

      {customerOrderTable && (
        <CustomerSelfOrderModal
          table={customerOrderTable}
          onClose={() => setCustomerOrderTable(null)}
        />
      )}

      {showZoneManagement && (
        <ZoneManagementModal onClose={() => setShowZoneManagement(false)} />
      )}
    </div>
  );
};
