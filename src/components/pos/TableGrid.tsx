import React, { useState } from 'react';
import { usePOS } from '../../context/POSContext';
import { TableItem, TableStatus, Order } from '../../types/pos';
import { TableQRModal } from './TableQRModal';
import { CustomerSelfOrderModal } from './CustomerSelfOrderModal';
import { ZoneManagementModal } from './ZoneManagementModal';
import { CupLabelModal } from './CupLabelModal';
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
  Bike,
  Truck,
  Plus,
  Tag,
  Receipt,
  CheckCircle2,
  Package,
  Search,
  ChevronDown,
  Filter,
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
  const { tables, orders, zones: availableZones, isAdmin, addTable } = usePOS();
  const [activeZone, setActiveZone] = useState<string>('TẤT CẢ');
  const [tableSearchQuery, setTableSearchQuery] = useState<string>('');
  const [qrModalTable, setQrModalTable] = useState<TableItem | null>(null);
  const [customerOrderTable, setCustomerOrderTable] = useState<TableItem | null>(null);
  const [showZoneManagement, setShowZoneManagement] = useState<boolean>(false);
  const [cupLabelOrder, setCupLabelOrder] = useState<Order | null>(null);

  const zoneNames = ['TẤT CẢ', ...availableZones.map((z) => z.name)];

  const filteredTables = tables.filter((t) => {
    if (activeZone !== 'TẤT CẢ' && t.zone !== activeZone) return false;
    if (tableSearchQuery.trim()) {
      const q = tableSearchQuery.toLowerCase();
      return (
        t.name.toLowerCase().includes(q) ||
        t.code.toLowerCase().includes(q) ||
        t.zone.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Status stats
  const emptyCount = tables.filter((t) => t.status === 'EMPTY').length;
  const occupiedCount = tables.filter((t) => t.status === 'OCCUPIED').length;
  const waitingPaymentCount = tables.filter((t) => t.status === 'WAITING_PAYMENT').length;

  // Active delivery / takeaway orders
  const activeDeliveryOrders = orders.filter(
    (o) =>
      (o.orderType === 'DELIVERY' || o.orderType === 'TAKEAWAY' || o.zone === 'Mang Về') &&
      (o.status === 'ACTIVE' || o.status === 'PENDING_PAYMENT')
  );

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

  // Quick instant Ship/Takeaway Order creation without asking customer details
  const handleQuickCreateShipOrder = () => {
    // 1. Look for an existing EMPTY takeaway table
    let targetTable = tables.find(
      (t) => (t.zone === 'Mang Về' || t.name.toLowerCase().includes('mang về')) && t.status === 'EMPTY'
    );

    if (!targetTable) {
      // Create a new dynamic takeaway table slot instantly
      const currentTakeaways = tables.filter(
        (t) => t.zone === 'Mang Về' || t.name.toLowerCase().includes('mang về')
      ).length;
      const newNum = currentTakeaways + 1;
      const newTable: TableItem = {
        id: `T-MV-${Date.now().toString().slice(-4)}`,
        code: `MV${newNum.toString().padStart(2, '0')}`,
        name: `Mang Về #${newNum}`,
        zone: 'Mang Về',
        capacity: 1,
        status: 'EMPTY',
      };
      addTable(newTable);
      targetTable = newTable;
    }

    // Immediately open the order menu so staff can take drinks instantly
    onSelectTable(targetTable);
  };

  return (
    <div className="space-y-6">
      {/* ========================================================================= */}
      {/* 1. TOP BENTO ROW */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
        {/* Bento Widget 1: Revenue Highlight Card */}
        <div className={`${isAdmin ? 'md:col-span-12 lg:col-span-4' : 'md:col-span-6 lg:col-span-6'} bg-amber-500 rounded-3xl p-6 text-slate-950 relative overflow-hidden shadow-lg shadow-amber-500/20 flex flex-col justify-between group`}>
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <p className="text-slate-900 font-black text-xs uppercase tracking-wider">
                Doanh thu hôm nay
              </p>
              <span className="p-1.5 rounded-full bg-slate-950/10 text-slate-950">
                <TrendingUp className="w-4 h-4" />
              </span>
            </div>

            <h3 className="text-3xl font-black mt-2 mb-1 tracking-tight text-slate-950">
              {totalDisplayRevenue.toLocaleString('vi-VN')}đ
            </h3>

            <div className="flex items-center gap-2 text-xs text-slate-900 mt-2 font-bold">
              <span className="px-2 py-0.5 bg-slate-950/15 rounded-md font-black text-[11px] text-slate-950">
                {paidOrders.length} đơn đã thanh toán
              </span>
              <span>• {activeOrders.length} bàn đang phục vụ</span>
            </div>
          </div>

          <div className="absolute -right-6 -bottom-6 w-36 h-36 rounded-full bg-white/20 blur-xs pointer-events-none group-hover:scale-110 transition-transform" />
        </div>

        {/* Bento Widget 2: Table Status Overview */}
        <div className={`${isAdmin ? 'md:col-span-6 lg:col-span-4' : 'md:col-span-6 lg:col-span-6'} bg-white dark:bg-[#241812] rounded-3xl p-6 border border-slate-200 dark:border-[#3D2B1F] shadow-sm flex flex-col justify-between`}>
          <div>
            <div className="flex items-center justify-between">
              <p className="text-slate-600 dark:text-[#E8C5A5] text-xs font-bold uppercase tracking-wider">
                Trạng thái phòng bàn
              </p>
              <span className="p-1.5 rounded-xl bg-amber-50 dark:bg-[#35251C] text-amber-600 dark:text-[#DDB892]">
                <Users className="w-4 h-4" />
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 mt-4">
              <div className="bg-emerald-50 dark:bg-emerald-950/40 p-2.5 rounded-2xl border border-emerald-200/50 dark:border-emerald-800/40 text-center">
                <span className="text-xl font-black text-emerald-600 dark:text-emerald-300 block">
                  {occupiedCount}
                </span>
                <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-200 uppercase">
                  Có khách
                </span>
              </div>

              <div className="bg-amber-50 dark:bg-amber-950/40 p-2.5 rounded-2xl border border-amber-200/50 dark:border-amber-800/40 text-center">
                <span className="text-xl font-black text-amber-600 dark:text-amber-300 block">
                  {waitingPaymentCount}
                </span>
                <span className="text-[10px] font-bold text-amber-800 dark:text-amber-200 uppercase">
                  Chờ bill
                </span>
              </div>

              <div className="bg-slate-100 dark:bg-[#35251C] p-2.5 rounded-2xl text-center border border-transparent dark:border-[#473225]">
                <span className="text-xl font-black text-slate-800 dark:text-white block">
                  {emptyCount}
                </span>
                <span className="text-[10px] font-bold text-slate-500 dark:text-[#CDB49E] uppercase">Bàn trống</span>
              </div>
            </div>
          </div>

          <div className="text-[11px] text-slate-500 dark:text-[#CDB49E] mt-3 flex items-center justify-between font-medium">
            <span>Tổng cộng: {tables.length} bàn</span>
            <span className="font-bold text-amber-600 dark:text-[#E8C5A5]">
              {availableZones.length} khu vực
            </span>
          </div>
        </div>

        {/* Bento Widget 3: Zone & QR Actions (ADMIN ONLY) */}
        {isAdmin && (
          <div className="md:col-span-6 lg:col-span-4 bg-white dark:bg-[#241812] rounded-3xl p-6 border border-slate-200 dark:border-[#3D2B1F] shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <p className="text-slate-600 dark:text-[#E8C5A5] text-xs font-bold uppercase tracking-wider">
                  Quản lý & Tự Phục Vụ
                </p>
                <span className="p-1.5 rounded-xl bg-amber-50 dark:bg-[#35251C] text-amber-600 dark:text-[#DDB892]">
                  <QrCode className="w-4 h-4" />
                </span>
              </div>

              <p className="text-xs text-slate-600 dark:text-[#EFE4D6] mt-2 font-medium">
                Mỗi bàn có 1 mã QR độc lập để khách tự quét order món. Thông báo lập tức gửi về thu ngân.
              </p>
            </div>

            <div className="flex items-center gap-2 mt-4">
              <button
                type="button"
                onClick={() => setShowZoneManagement(true)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#35251C] dark:hover:bg-[#473225] text-slate-800 dark:text-[#FFFDF9] font-bold text-xs flex items-center justify-center gap-1.5 transition border border-transparent dark:border-[#473225] cursor-pointer"
              >
                <Layers className="w-4 h-4 text-amber-500" />
                <span>Quản Lý Khu Vực & Bàn</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 2. ACTIVE DELIVERY & TAKEAWAY ORDERS BAR (IF ANY) */}
      {/* ========================================================================= */}
      {activeDeliveryOrders.length > 0 && (
        <div className="bg-amber-500/10 dark:bg-[#2A1E17] border border-amber-500/30 dark:border-[#4A3525] rounded-3xl p-4 sm:p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-900 dark:text-amber-300 font-black text-sm">
              <Bike className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span>Đơn Giao Hàng & Mang Về Đang Xử Lý ({activeDeliveryOrders.length})</span>
            </div>
            <span className="text-[11px] font-bold text-amber-800 dark:text-[#E8C5A5]">
              Chạm để gọi món, in tem dán ly hoặc thanh toán
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {activeDeliveryOrders.map((ord) => {
              const matchedTable = tables.find((t) => t.id === ord.tableId);
              const itemsCount = ord.items.reduce((s, it) => (it.status !== 'CANCELLED' ? s + it.quantity : s), 0);

              return (
                <div
                  key={ord.id}
                  className="bg-white dark:bg-[#20150F] p-3.5 rounded-2xl border border-amber-500/20 dark:border-[#3D2B1F] shadow-xs flex flex-col justify-between gap-3 hover:border-amber-500 transition"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-black text-xs text-amber-600 dark:text-amber-400 font-mono">
                          {ord.orderCode}
                        </span>
                        <span className="text-xs font-bold text-slate-800 dark:text-[#FFFDF9]">
                          • {ord.tableName}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-[#CDB49E] mt-0.5">
                        {itemsCount} món • <strong>{ord.totalAmount.toLocaleString('vi-VN')}đ</strong>
                      </p>
                    </div>

                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                      Đang xử lý
                    </span>
                  </div>

                  {/* Actions for this delivery order */}
                  <div className="flex items-center gap-1.5 pt-1 border-t border-slate-100 dark:border-[#35251C]">
                    <button
                      type="button"
                      onClick={() => {
                        if (matchedTable) onSelectTable(matchedTable);
                      }}
                      className="flex-1 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#35251C] dark:hover:bg-[#473225] text-slate-800 dark:text-[#FFFDF9] font-bold text-[11px] transition cursor-pointer"
                    >
                      Gọi Món
                    </button>

                    <button
                      type="button"
                      onClick={() => setCupLabelOrder(ord)}
                      className="px-2.5 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-800 dark:text-amber-300 font-bold text-[11px] flex items-center gap-1 transition cursor-pointer"
                      title="In tem dán ly cho đơn này"
                    >
                      <Tag className="w-3.5 h-3.5" />
                      <span>In Tem</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (matchedTable) onOpenCheckout(matchedTable);
                      }}
                      className="py-1.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] flex items-center gap-1 transition cursor-pointer"
                    >
                      <Receipt className="w-3 h-3" />
                      <span>Tính Tiền</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. MAIN BENTO TABLE GRID CONTAINER */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-[#241812] rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-[#3D2B1F] flex flex-col space-y-6">
        {/* Bento Table Header with Fast Ship Order Button */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-[#3D2B1F]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-50 dark:bg-[#35251C] text-amber-600 dark:text-[#DDB892] border border-amber-200 dark:border-[#473225]">
              <Utensils className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-black text-lg text-slate-900 dark:text-[#FFFDF9] flex items-center gap-2">
                Sơ đồ bàn & Bán hàng
              </h2>
              <p className="text-xs text-slate-500 dark:text-[#CDB49E]">
                Chạm vào bàn để mở đơn hoặc bấm nút Tạo Đơn Ship để bán mang đi siêu tốc
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Direct Quick Create Ship / Takeaway Order Button */}
            <button
              type="button"
              onClick={handleQuickCreateShipOrder}
              className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-xs sm:text-sm flex items-center gap-2 shadow-md shadow-amber-500/25 active:scale-95 transition cursor-pointer"
            >
              <Bike className="w-4 h-4" />
              <span>+ Tạo Đơn Ship / Mang Đi</span>
            </button>

            {/* Table Search Input */}
            <div className="relative w-36 sm:w-44">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm bàn, mã..."
                value={tableSearchQuery}
                onChange={(e) => setTableSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-[#3D2B1F] bg-slate-50 dark:bg-[#1C120C] text-slate-800 dark:text-[#FFFDF9] focus:outline-hidden focus:ring-2 focus:ring-amber-500"
              />
            </div>

            {/* Zone Filter Select Dropdown */}
            <div className="relative">
              <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-[#3D2B1F] bg-slate-50 dark:bg-[#1C120C]">
                <Filter className="w-3.5 h-3.5 text-amber-500" />
                <span className="text-xs font-bold text-slate-500 dark:text-[#CDB49E] hidden sm:inline">Khu vực:</span>
                <select
                  value={activeZone}
                  onChange={(e) => setActiveZone(e.target.value)}
                  className="text-xs font-black bg-transparent text-slate-900 dark:text-[#FFFDF9] focus:outline-hidden cursor-pointer pr-4"
                >
                  {zoneNames.map((zone) => {
                    const count =
                      zone === 'TẤT CẢ'
                        ? tables.length
                        : tables.filter((t) => t.zone === zone).length;
                    return (
                      <option
                        key={zone}
                        value={zone}
                        className="bg-white dark:bg-[#241812] text-slate-900 dark:text-white"
                      >
                        {zone} ({count})
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Table Bento Grid Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {filteredTables.map((table) => {
            const isOccupied = table.status === 'OCCUPIED';
            const isWaiting = table.status === 'WAITING_PAYMENT';
            const activeOrder = orders.find(
              (o) => o.tableId === table.id && (o.status === 'ACTIVE' || o.status === 'PENDING_PAYMENT')
            );
            const itemsCount = activeOrder
              ? activeOrder.items.reduce((s, it) => (it.status !== 'CANCELLED' ? s + it.quantity : s), 0)
              : 0;
            const tableTotal = activeOrder ? activeOrder.totalAmount : 0;
            const elapsedTime = getElapsedTime(table.openedAt);

            // OCCUPIED OR WAITING PAYMENT TABLE
            if (isOccupied || isWaiting) {
              return (
                <div
                  key={table.id}
                  onClick={() => onSelectTable(table)}
                  className={`aspect-square rounded-3xl p-4 flex flex-col justify-between cursor-pointer transition-all relative overflow-hidden group shadow-md hover:scale-102 ${
                    isWaiting
                      ? 'bg-gradient-to-br from-amber-500/15 to-orange-500/10 border-2 border-amber-500 text-slate-900 dark:text-[#FAF7F2]'
                      : 'bg-gradient-to-br from-emerald-500/15 to-teal-500/10 border-2 border-emerald-500 text-slate-900 dark:text-[#FAF7F2]'
                  }`}
                >
                  {/* Card Header: Name + Elapsed Pill */}
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-black text-sm tracking-tight text-slate-950 dark:text-[#FAF7F2]">
                      {table.name}
                    </span>
                    {elapsedTime && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-slate-950/10 dark:bg-black/40 text-slate-800 dark:text-[#E8C5A5] flex items-center gap-1 font-mono">
                        <Clock className="w-2.5 h-2.5" />
                        {elapsedTime}
                      </span>
                    )}
                  </div>

                  {/* Card Center: Amount and Items count */}
                  <div className="my-auto text-center space-y-1">
                    <p className="text-lg font-black tracking-tight text-slate-950 dark:text-[#FAF7F2]">
                      {tableTotal.toLocaleString('vi-VN')}đ
                    </p>
                    <span className="text-[11px] font-bold text-slate-700 dark:text-[#E8C5A5] block">
                      {itemsCount} món • {table.guestCount || table.capacity}K
                    </span>
                  </div>

                  {/* Card Footer: Quick Actions */}
                  <div className="flex items-center gap-1 pt-1.5 border-t border-slate-950/10 dark:border-white/10">
                    {activeOrder && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setCupLabelOrder(activeOrder);
                        }}
                        className="p-1.5 rounded-xl bg-amber-500 text-slate-950 font-bold hover:bg-amber-600 transition cursor-pointer"
                        title="In tem dán ly"
                      >
                        <Tag className="w-3.5 h-3.5" />
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenCheckout(table);
                      }}
                      className="flex-1 py-1 px-2 rounded-xl bg-slate-950 text-amber-400 dark:bg-[#FAF7F2] dark:text-slate-950 font-black text-[11px] flex items-center justify-center gap-1 hover:opacity-90 transition cursor-pointer"
                    >
                      <CreditCard className="w-3 h-3" />
                      <span>Tính Tiền</span>
                    </button>
                  </div>
                </div>
              );
            }

            // EMPTY TABLE: Dashed clean modern bento container
            return (
              <div
                key={table.id}
                onClick={() => onSelectTable(table)}
                className="aspect-square border-2 border-dashed border-slate-200 dark:border-[#3D2B1F] rounded-3xl p-4 flex flex-col justify-between items-center text-slate-400 dark:text-[#CDB49E] cursor-pointer hover:border-amber-400 hover:text-amber-500 hover:bg-amber-50/20 dark:hover:bg-[#35251C]/40 transition-all group hover:scale-102"
              >
                <div className="w-full flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700 dark:text-[#FAF7F2] group-hover:text-amber-500">
                    {table.name}
                  </span>
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setQrModalTable(table);
                      }}
                      className="p-1 rounded-md text-slate-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-[#35251C] transition cursor-pointer"
                      title="Mã QR & In Standee Bàn (Admin)"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="my-auto flex flex-col items-center justify-center gap-1">
                  <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-[#35251C] group-hover:bg-amber-500 group-hover:text-slate-950 flex items-center justify-center transition-colors">
                    <Utensils className="w-4 h-4 text-slate-600 dark:text-[#D5C2AF] group-hover:text-slate-950" />
                  </div>
                  <span className="text-[11px] font-bold text-slate-600 dark:text-[#D5C2AF] group-hover:text-amber-500">Mở Bàn</span>
                </div>

                <div className="w-full text-center">
                  <span className="text-[10px] text-slate-400 dark:text-[#A89080] font-medium">{table.zone} ({table.capacity}K)</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Cup Sticker Printing Modal */}
      {cupLabelOrder && (
        <CupLabelModal
          order={cupLabelOrder}
          onClose={() => setCupLabelOrder(null)}
        />
      )}

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
