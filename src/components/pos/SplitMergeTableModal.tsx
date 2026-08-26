import React, { useState } from 'react';
import { usePOS } from '../../context/POSContext';
import { TableItem } from '../../types/pos';
import { X, ArrowRightLeft, Merge, Split, Check } from 'lucide-react';

interface SplitMergeTableModalProps {
  table: TableItem;
  onClose: () => void;
}

export const SplitMergeTableModal: React.FC<SplitMergeTableModalProps> = ({ table, onClose }) => {
  const { tables, orders, splitTable, mergeTables } = usePOS();

  const [mode, setMode] = useState<'SPLIT' | 'MERGE'>('MERGE');
  const [targetTableId, setTargetTableId] = useState<string>('');
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);

  const activeOrder = orders.find(
    (o) => o.tableId === table.id && (o.status === 'ACTIVE' || o.status === 'PENDING_PAYMENT')
  );

  // Available tables for Merge (Other occupied tables)
  const mergeTargetTables = tables.filter(
    (t) => t.id !== table.id && (t.status === 'OCCUPIED' || t.status === 'WAITING_PAYMENT')
  );

  // Available tables for Split (Empty tables)
  const splitTargetTables = tables.filter((t) => t.id !== table.id && t.status === 'EMPTY');

  const toggleItemSelection = (id: string) => {
    setSelectedItemIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleExecute = () => {
    if (!targetTableId) {
      alert('Vui lòng chọn bàn đích');
      return;
    }

    if (mode === 'MERGE') {
      mergeTables(table.id, targetTableId);
      alert(`Đã gộp đơn của ${table.name} sang bàn đích thành công!`);
      onClose();
    } else {
      if (selectedItemIds.length === 0) {
        alert('Vui lòng chọn ít nhất 1 món để tách sang bàn mới');
        return;
      }
      splitTable(table.id, targetTableId, selectedItemIds);
      alert(`Đã tách các món sang bàn mới thành công!`);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-white dark:bg-stone-900 rounded-2xl shadow-2xl border border-stone-200 dark:border-stone-800 w-full max-w-lg overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between bg-stone-50 dark:bg-stone-800/80">
          <div className="flex items-center gap-2">
            <ArrowRightLeft className="w-5 h-5 text-amber-600" />
            <h3 className="text-base font-black text-stone-900 dark:text-stone-100">
              Thao tác Bàn: {table.code} ({table.name})
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Selector */}
        <div className="p-4 sm:p-5 space-y-5">
          <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-stone-100 dark:bg-stone-800">
            <button
              type="button"
              onClick={() => {
                setMode('MERGE');
                setTargetTableId('');
              }}
              className={`py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                mode === 'MERGE'
                  ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 shadow-xs'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              <Merge className="w-4 h-4" />
              <span>Gộp Bàn (Merge)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setMode('SPLIT');
                setTargetTableId('');
              }}
              className={`py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                mode === 'SPLIT'
                  ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 shadow-xs'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              <Split className="w-4 h-4" />
              <span>Tách Bàn (Split)</span>
            </button>
          </div>

          {/* Mode 1: MERGE */}
          {mode === 'MERGE' && (
            <div className="space-y-3">
              <p className="text-xs text-stone-600 dark:text-stone-400">
                Gộp tất cả các món từ <span className="font-bold text-amber-600">{table.name}</span> sang một bàn đang có khách khác. Sau khi gộp, bàn hiện tại sẽ được chuyển thành Bàn Trống.
              </p>

              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1.5">
                  Chọn bàn đích muốn gộp vào:
                </label>
                {mergeTargetTables.length === 0 ? (
                  <p className="text-xs italic text-stone-400 p-3 bg-stone-50 dark:bg-stone-800/40 rounded-xl">
                    Không có bàn nào khác đang có khách để gộp vào.
                  </p>
                ) : (
                  <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                    {mergeTargetTables.map((t) => {
                      const isSelected = targetTableId === t.id;
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setTargetTableId(t.id)}
                          className={`p-2.5 rounded-xl border text-left flex items-center justify-between text-xs transition ${
                            isSelected
                              ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/40 font-bold text-amber-950 dark:text-amber-200 ring-1 ring-amber-500'
                              : 'border-stone-200 dark:border-stone-700 hover:bg-stone-50'
                          }`}
                        >
                          <div>
                            <p className="font-mono font-bold">{t.code}</p>
                            <p className="text-[11px] text-stone-500">{t.name} ({t.zone})</p>
                          </div>
                          {isSelected && <Check className="w-4 h-4 text-amber-600" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Mode 2: SPLIT */}
          {mode === 'SPLIT' && (
            <div className="space-y-4">
              <p className="text-xs text-stone-600 dark:text-stone-400">
                Chọn bàn trống và tick chọn các món cần chuyển sang bàn mới:
              </p>

              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1.5">
                  1. Chọn bàn trống nhận món:
                </label>
                {splitTargetTables.length === 0 ? (
                  <p className="text-xs italic text-stone-400 p-3 bg-stone-50 rounded-xl">
                    Hiện tại quán đã hết bàn trống để tách.
                  </p>
                ) : (
                  <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto">
                    {splitTargetTables.map((t) => {
                      const isSelected = targetTableId === t.id;
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setTargetTableId(t.id)}
                          className={`p-2.5 rounded-xl border text-left flex items-center justify-between text-xs transition ${
                            isSelected
                              ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/40 font-bold text-amber-950 dark:text-amber-200 ring-1 ring-amber-500'
                              : 'border-stone-200 dark:border-stone-700 hover:bg-stone-50'
                          }`}
                        >
                          <div>
                            <p className="font-mono font-bold">{t.code}</p>
                            <p className="text-[11px] text-stone-500">{t.name} ({t.zone})</p>
                          </div>
                          {isSelected && <Check className="w-4 h-4 text-amber-600" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Items to move */}
              {activeOrder && (
                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1.5">
                    2. Tick chọn các món chuyển sang:
                  </label>
                  <div className="space-y-1.5 max-h-40 overflow-y-auto border border-stone-200 dark:border-stone-800 rounded-xl p-2">
                    {activeOrder.items
                      .filter((i) => i.status !== 'CANCELLED')
                      .map((item) => {
                        const isChecked = selectedItemIds.includes(item.id);
                        return (
                          <div
                            key={item.id}
                            onClick={() => toggleItemSelection(item.id)}
                            className={`p-2 rounded-lg flex items-center justify-between text-xs cursor-pointer transition ${
                              isChecked
                                ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-950 dark:text-amber-200 font-bold'
                                : 'hover:bg-stone-50 text-stone-700 dark:text-stone-300'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => {}}
                                className="rounded text-amber-600 focus:ring-amber-500"
                              />
                              <span>
                                {item.quantity}x {item.productName}
                              </span>
                            </div>
                            <span>{(item.unitPrice * item.quantity).toLocaleString('vi-VN')}đ</span>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/80 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-stone-300 dark:border-stone-700 font-bold text-stone-700 dark:text-stone-300 hover:bg-stone-100 text-xs"
          >
            Hủy
          </button>

          <button
            type="button"
            onClick={handleExecute}
            disabled={!targetTableId}
            className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed text-stone-950 font-black text-xs shadow-xs transition"
          >
            Xác nhận {mode === 'MERGE' ? 'Gộp bàn' : 'Tách bàn'}
          </button>
        </div>
      </div>
    </div>
  );
};
