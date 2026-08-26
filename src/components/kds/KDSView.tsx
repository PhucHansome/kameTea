import React, { useState, useEffect } from 'react';
import { usePOS } from '../../context/POSContext';
import { OrderItemStatus, StationType } from '../../types/pos';
import {
  Flame,
  CupSoda,
  Clock,
  CheckCircle2,
  ChefHat,
  AlertCircle,
  Play,
  Check,
  Filter,
  Volume2,
  RefreshCw,
} from 'lucide-react';

export const KDSView: React.FC = () => {
  const { orders, updateOrderItemStatus, notifyKitchenUpdate, settings } = usePOS();
  const [stationFilter, setStationFilter] = useState<StationType>('ALL');
  const [currentTime, setCurrentTime] = useState<number>(Date.now());

  // Update timer every 10 seconds to keep elapsed indicators fresh
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 10000);
    return () => clearInterval(timer);
  }, []);

  // Filter active orders that have items for this station
  const activeOrders = orders.filter(
    (o) => o.status === 'ACTIVE' || o.status === 'PENDING_PAYMENT'
  );

  const getStationLabel = (st: StationType) => {
    switch (st) {
      case 'BAR':
        return 'Quầy Bar - Trà Sữa & Đồ Uống';
      case 'KITCHEN':
        return 'Khu Bếp - Ốc, Nướng & Ăn Vặt';
      case 'ALL':
      default:
        return 'Toàn Bộ Bếp & Pha Chế (Tổng Hợp)';
    }
  };

  const getElapsedTimeInfo = (createdAt: string) => {
    const diffMs = currentTime - new Date(createdAt).getTime();
    const mins = Math.floor(diffMs / 60000);

    let color = 'text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/60 border-emerald-300';
    let isUrgent = false;

    if (mins >= 15) {
      color = 'text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-950/60 border-red-400 animate-pulse';
      isUrgent = true;
    } else if (mins >= 8) {
      color = 'text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/60 border-amber-300';
    }

    return { mins, color, isUrgent };
  };

  return (
    <div className="space-y-5">
      {/* Top KDS Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-stone-900 text-white p-4 rounded-2xl shadow-lg border border-stone-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500 text-stone-950 shadow-xs">
            <ChefHat className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black tracking-wide">Màn Hình Bếp & Pha Chế (KDS)</h2>
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span className="text-[11px] font-bold text-emerald-400 uppercase">Realtime Live</span>
            </div>
            <p className="text-xs text-stone-400 font-medium mt-0.5">
              {getStationLabel(stationFilter)}
            </p>
          </div>
        </div>

        {/* Filters & Actions */}
        <div className="flex items-center gap-2">
          {/* Station Filter Tabs */}
          <div className="flex rounded-xl bg-stone-800 p-1 border border-stone-700">
            <button
              type="button"
              onClick={() => setStationFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                stationFilter === 'ALL'
                  ? 'bg-amber-500 text-stone-950 shadow-xs'
                  : 'text-stone-300 hover:text-white'
              }`}
            >
              Tất cả
            </button>
            <button
              type="button"
              onClick={() => setStationFilter('BAR')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                stationFilter === 'BAR'
                  ? 'bg-amber-500 text-stone-950 shadow-xs'
                  : 'text-stone-300 hover:text-white'
              }`}
            >
              <CupSoda className="w-3.5 h-3.5" />
              <span>Quầy Bar</span>
            </button>
            <button
              type="button"
              onClick={() => setStationFilter('KITCHEN')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                stationFilter === 'KITCHEN'
                  ? 'bg-amber-500 text-stone-950 shadow-xs'
                  : 'text-stone-300 hover:text-white'
              }`}
            >
              <Flame className="w-3.5 h-3.5" />
              <span>Bếp Ốc</span>
            </button>
          </div>

          <button
            type="button"
            onClick={notifyKitchenUpdate}
            title="Thử chuông báo bếp"
            className="p-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-amber-400 border border-stone-700 transition"
          >
            <Volume2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Orders KDS Board Grid */}
      {activeOrders.length === 0 ? (
        <div className="bg-white dark:bg-stone-900 rounded-3xl p-12 text-center border border-dashed border-stone-300 dark:border-stone-800 space-y-3">
          <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 mx-auto flex items-center justify-center text-emerald-600">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-stone-800 dark:text-stone-200">
            Bếp & Quầy Bar Đã Làm Xong Tất Cả Món!
          </h3>
          <p className="text-xs text-stone-500 max-w-sm mx-auto">
            Khi nhân viên phục vụ order món mới từ sơ đồ bàn, phiếu làm món sẽ tự động xuất hiện ở đây kèm chuông báo tức thì.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {activeOrders.map((order) => {
            // Filter items by station if not ALL
            const relevantItems = order.items.filter(
              (it) => stationFilter === 'ALL' || it.station === stationFilter
            );

            if (relevantItems.length === 0) return null;

            const timeInfo = getElapsedTimeInfo(order.createdAt);
            const pendingCount = relevantItems.filter((i) => i.status === 'PENDING').length;
            const cookingCount = relevantItems.filter((i) => i.status === 'COOKING').length;
            const doneCount = relevantItems.filter((i) => i.status === 'DONE').length;

            return (
              <div
                key={order.id}
                className="bg-white dark:bg-stone-900 rounded-2xl border-2 border-stone-200 dark:border-stone-800 shadow-sm flex flex-col justify-between overflow-hidden"
              >
                {/* Ticket Header */}
                <div className="p-3.5 bg-stone-100 dark:bg-stone-800 border-b border-stone-200 dark:border-stone-700 flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-base font-black text-amber-600 dark:text-amber-400 font-mono">
                        {order.tableName}
                      </span>
                      <span className="text-xs font-mono text-stone-500 font-bold">
                        {order.orderCode}
                      </span>
                    </div>
                    <p className="text-[11px] text-stone-500">
                      Khu vực: {order.zone} • PV: {order.serverName}
                    </p>
                  </div>

                  {/* Elapsed Timer Pill */}
                  <div
                    className={`px-2.5 py-1 rounded-xl text-xs font-black border flex items-center gap-1 ${timeInfo.color}`}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>{timeInfo.mins} phút</span>
                  </div>
                </div>

                {/* Ticket Items List */}
                <div className="p-3.5 space-y-2.5 flex-1 divide-y divide-stone-100 dark:divide-stone-800/80">
                  {relevantItems.map((item) => {
                    const isCancelled = item.status === 'CANCELLED';

                    return (
                      <div key={item.id} className="pt-2 first:pt-0 space-y-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-1.5">
                              <span className="text-sm font-black text-stone-900 dark:text-stone-100">
                                {item.quantity}x {item.productName}
                              </span>
                              <span
                                className={`text-[10px] font-bold px-1.5 py-0.5 rounded-sm uppercase ${
                                  item.station === 'BAR'
                                    ? 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300'
                                    : 'bg-orange-100 text-orange-900 dark:bg-orange-950 dark:text-orange-300'
                                }`}
                              >
                                {item.station === 'BAR' ? 'Bar' : 'Bếp'}
                              </span>
                            </div>

                            {/* Cooking details & Toppings */}
                            {item.selectedCookingMethod && (
                              <p className="text-xs font-bold text-amber-700 dark:text-amber-400">
                                👉 Sốt: {item.selectedCookingMethod.name}
                              </p>
                            )}
                            {item.selectedSize && (
                              <p className="text-xs text-stone-600 dark:text-stone-400">
                                👉 Khẩu phần: {item.selectedSize.name}
                              </p>
                            )}
                            {item.selectedToppings.length > 0 && (
                              <p className="text-xs text-stone-600 dark:text-stone-400">
                                👉 Topping: {item.selectedToppings.map((t) => t.name).join(', ')}
                              </p>
                            )}
                            {(item.sugarLevel || item.iceLevel) && (
                              <p className="text-xs text-stone-500 font-medium">
                                👉 Đường: {item.sugarLevel} | Đá: {item.iceLevel}
                              </p>
                            )}
                            {item.note && (
                              <p className="text-xs text-red-600 font-bold bg-red-50 dark:bg-red-950/40 px-2 py-0.5 rounded-md mt-0.5">
                                ⚠️ Ghi chú: {item.note}
                              </p>
                            )}
                            {isCancelled && (
                              <p className="text-xs text-red-600 font-bold line-through">
                                Đã hủy: {item.cancelReason}
                              </p>
                            )}
                          </div>

                          {/* Action Button for this single item */}
                          {!isCancelled && (
                            <div className="shrink-0">
                              {item.status === 'PENDING' && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    updateOrderItemStatus(order.id, item.id, 'COOKING')
                                  }
                                  className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1 shadow-xs transition"
                                >
                                  <Play className="w-3 h-3" />
                                  <span>Làm</span>
                                </button>
                              )}

                              {item.status === 'COOKING' && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    updateOrderItemStatus(order.id, item.id, 'DONE')
                                  }
                                  className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1 shadow-xs transition"
                                >
                                  <Check className="w-3 h-3" />
                                  <span>Xong</span>
                                </button>
                              )}

                              {item.status === 'DONE' && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    updateOrderItemStatus(order.id, item.id, 'SERVED')
                                  }
                                  className="px-2.5 py-1 rounded-lg bg-stone-700 hover:bg-stone-800 text-white text-xs font-bold flex items-center gap-1 shadow-xs transition"
                                >
                                  <span>Lên bàn</span>
                                </button>
                              )}

                              {item.status === 'SERVED' && (
                                <span className="text-[11px] font-bold text-stone-400 px-2 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800">
                                  ✓ Đã phục vụ
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Ticket Quick Batch Actions Footer */}
                <div className="p-3 bg-stone-50 dark:bg-stone-800/80 border-t border-stone-200 dark:border-stone-700 flex items-center justify-between gap-2">
                  <span className="text-[11px] text-stone-500 font-medium">
                    Chờ: {pendingCount} • Làm: {cookingCount} • Xong: {doneCount}
                  </span>

                  <div className="flex items-center gap-1.5">
                    {pendingCount > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          relevantItems
                            .filter((i) => i.status === 'PENDING')
                            .forEach((i) => updateOrderItemStatus(order.id, i.id, 'COOKING'));
                        }}
                        className="px-2.5 py-1 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 text-[11px] font-bold hover:bg-blue-200"
                      >
                        Bắt đầu tất cả
                      </button>
                    )}

                    {cookingCount > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          relevantItems
                            .filter((i) => i.status === 'COOKING')
                            .forEach((i) => updateOrderItemStatus(order.id, i.id, 'DONE'));
                        }}
                        className="px-2.5 py-1 rounded-lg bg-emerald-500 text-stone-950 text-[11px] font-black hover:bg-emerald-400"
                      >
                        Xong tất cả
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
