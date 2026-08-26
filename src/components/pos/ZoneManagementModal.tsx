import React, { useState } from 'react';
import { usePOS } from '../../context/POSContext';
import { Zone, TableItem } from '../../types/pos';
import {
  Layers,
  Plus,
  Trash2,
  Edit2,
  X,
  Check,
  Building,
  Users,
  Grid,
  Sparkles,
} from 'lucide-react';

interface ZoneManagementModalProps {
  onClose: () => void;
}

export const ZoneManagementModal: React.FC<ZoneManagementModalProps> = ({ onClose }) => {
  const {
    zones,
    addZone,
    updateZone,
    deleteZone,
    tables,
    addTable,
    updateTable,
    deleteTable,
  } = usePOS();

  const [activeTab, setActiveTab] = useState<'ZONES' | 'TABLES'>('ZONES');

  // Zone form state
  const [editingZoneId, setEditingZoneId] = useState<string | null>(null);
  const [zoneName, setZoneName] = useState<string>('');
  const [zoneDesc, setZoneDesc] = useState<string>('');

  // Table form state
  const [editingTableId, setEditingTableId] = useState<string | null>(null);
  const [tableName, setTableName] = useState<string>('');
  const [tableCode, setTableCode] = useState<string>('');
  const [tableZone, setTableZone] = useState<string>(zones[0]?.name || 'Tầng 1');
  const [tableCapacity, setTableCapacity] = useState<number>(4);

  // Handle Zone Save
  const handleSaveZone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!zoneName.trim()) return;

    if (editingZoneId) {
      updateZone({
        id: editingZoneId,
        name: zoneName.trim(),
        description: zoneDesc.trim(),
      });
      setEditingZoneId(null);
    } else {
      addZone({
        id: 'zone-' + Date.now(),
        name: zoneName.trim(),
        description: zoneDesc.trim(),
      });
    }
    setZoneName('');
    setZoneDesc('');
  };

  const handleStartEditZone = (zone: Zone) => {
    setEditingZoneId(zone.id);
    setZoneName(zone.name);
    setZoneDesc(zone.description || '');
  };

  const handleCancelEditZone = () => {
    setEditingZoneId(null);
    setZoneName('');
    setZoneDesc('');
  };

  // Handle Table Save
  const handleSaveTable = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tableName.trim()) return;

    const generatedCode = tableCode.trim() || `B${tables.length + 1}`;

    if (editingTableId) {
      const existing = tables.find((t) => t.id === editingTableId);
      if (existing) {
        updateTable({
          ...existing,
          name: tableName.trim(),
          code: generatedCode,
          zone: tableZone,
          capacity: Number(tableCapacity) || 4,
        });
      }
      setEditingTableId(null);
    } else {
      addTable({
        name: tableName.trim(),
        code: generatedCode,
        zone: tableZone,
        capacity: Number(tableCapacity) || 4,
      });
    }
    setTableName('');
    setTableCode('');
    setTableCapacity(4);
  };

  const handleStartEditTable = (table: TableItem) => {
    setEditingTableId(table.id);
    setTableName(table.name);
    setTableCode(table.code);
    setTableZone(table.zone);
    setTableCapacity(table.capacity);
  };

  const handleCancelEditTable = () => {
    setEditingTableId(null);
    setTableName('');
    setTableCode('');
    setTableCapacity(4);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-slate-900 text-white border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500 text-slate-950 font-black shadow-md">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-base sm:text-lg">Quản Lý Khu Vực & Bàn</h3>
              <p className="text-xs text-slate-400">
                Tuỳ chỉnh các tầng, phòng sảnh và số lượng bàn phục vụ của KAME
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 px-4 pt-2 gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('ZONES')}
            className={`pb-3 px-4 text-xs font-bold transition border-b-2 flex items-center gap-2 ${
              activeTab === 'ZONES'
                ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Building className="w-4 h-4" />
            <span>Khu Vực / Tầng ({zones.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('TABLES')}
            className={`pb-3 px-4 text-xs font-bold transition border-b-2 flex items-center gap-2 ${
              activeTab === 'TABLES'
                ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Grid className="w-4 h-4" />
            <span>Danh Sách Bàn ({tables.length})</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {activeTab === 'ZONES' ? (
            <div className="space-y-5">
              {/* Add / Edit Zone Form */}
              <form
                onSubmit={handleSaveZone}
                className="bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 rounded-2xl p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-amber-900 dark:text-amber-300 uppercase tracking-wider">
                    {editingZoneId ? 'Chỉnh sửa khu vực' : 'Thêm khu vực mới'}
                  </h4>
                  {editingZoneId && (
                    <button
                      type="button"
                      onClick={handleCancelEditZone}
                      className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                    >
                      Huỷ chỉnh sửa
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Tên khu vực / Tầng:
                    </label>
                    <input
                      type="text"
                      placeholder="Ví dụ: Tầng 3, Sảnh VIP, Sân Thượng..."
                      value={zoneName}
                      onChange={(e) => setZoneName(e.target.value)}
                      required
                      className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:outline-hidden focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Mô tả / Vị trí:
                    </label>
                    <input
                      type="text"
                      placeholder="Ví dụ: Máy lạnh thoáng mát, view đẹp..."
                      value={zoneDesc}
                      onChange={(e) => setZoneDesc(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:border-amber-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-sm transition"
                >
                  {editingZoneId ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  <span>{editingZoneId ? 'Lưu Thay Đổi' : 'Thêm Khu Vực'}</span>
                </button>
              </form>

              {/* Zone List */}
              <div className="space-y-2.5">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Danh sách khu vực hiện có
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {zones.map((zone) => {
                    const tableCountInZone = tables.filter((t) => t.zone === zone.name).length;

                    return (
                      <div
                        key={zone.id}
                        className="p-3.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 shadow-xs flex items-center justify-between gap-2"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-black text-sm text-slate-900 dark:text-white">
                              {zone.name}
                            </span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold">
                              {tableCountInZone} bàn
                            </span>
                          </div>
                          {zone.description && (
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                              {zone.description}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleStartEditZone(zone)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-amber-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                            title="Sửa khu vực"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          {zones.length > 1 && (
                            <button
                              type="button"
                              onClick={() => {
                                if (
                                  tableCountInZone > 0 &&
                                  !confirm(
                                    `Khu vực ${zone.name} đang có ${tableCountInZone} bàn. Bạn có chắc muốn xoá?`
                                  )
                                ) {
                                  return;
                                }
                                deleteZone(zone.id);
                              }}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                              title="Xoá khu vực"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            /* Tables Tab */
            <div className="space-y-5">
              {/* Add / Edit Table Form */}
              <form
                onSubmit={handleSaveTable}
                className="bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 rounded-2xl p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-amber-900 dark:text-amber-300 uppercase tracking-wider">
                    {editingTableId ? 'Chỉnh sửa thông tin bàn' : 'Thêm bàn mới'}
                  </h4>
                  {editingTableId && (
                    <button
                      type="button"
                      onClick={handleCancelEditTable}
                      className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                    >
                      Huỷ chỉnh sửa
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Tên bàn:
                    </label>
                    <input
                      type="text"
                      placeholder="Ví dụ: Bàn 09, VIP 01..."
                      value={tableName}
                      onChange={(e) => setTableName(e.target.value)}
                      required
                      className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:outline-hidden focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Mã ký hiệu:
                    </label>
                    <input
                      type="text"
                      placeholder="Ví dụ: B09"
                      value={tableCode}
                      onChange={(e) => setTableCode(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Khu vực:
                    </label>
                    <select
                      value={tableZone}
                      onChange={(e) => setTableZone(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:outline-hidden focus:border-amber-500"
                    >
                      {zones.map((z) => (
                        <option key={z.id} value={z.name}>
                          {z.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Sức chứa (Khách):
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={50}
                      value={tableCapacity}
                      onChange={(e) => setTableCapacity(Number(e.target.value))}
                      className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:outline-hidden focus:border-amber-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-sm transition"
                >
                  {editingTableId ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  <span>{editingTableId ? 'Lưu Bàn' : 'Thêm Bàn'}</span>
                </button>
              </form>

              {/* Table List */}
              <div className="space-y-2.5">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Danh sách bàn ({tables.length})
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                  {tables.map((table) => (
                    <div
                      key={table.id}
                      className="p-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 shadow-xs flex flex-col justify-between"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-black text-sm text-slate-900 dark:text-white">
                          {table.name}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-300 font-bold">
                          {table.capacity}K
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 truncate">
                        {table.zone}
                      </p>

                      <div className="flex items-center justify-end gap-1 mt-2 pt-2 border-t border-slate-100 dark:border-slate-700/50">
                        <button
                          type="button"
                          onClick={() => handleStartEditTable(table)}
                          className="p-1 rounded-md text-slate-400 hover:text-amber-500"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`Bạn có chắc muốn xoá ${table.name}?`)) {
                              deleteTable(table.id);
                            }
                          }}
                          className="p-1 rounded-md text-slate-400 hover:text-rose-500"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
