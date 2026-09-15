import React, { useState } from 'react';
import { ERROR_CATALOG, ErrorCode } from '../../../shared/errorCatalog';
import { AlertCircle, Search, X, ShieldAlert, CheckCircle2 } from 'lucide-react';

interface ErrorCatalogModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ErrorCatalogModal: React.FC<ErrorCatalogModalProps> = ({ isOpen, onClose }) => {
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen) return null;

  const entries = Object.entries(ERROR_CATALOG).filter(([code, item]) => {
    const q = searchTerm.toLowerCase();
    return (
      code.toLowerCase().includes(q) ||
      item.template.toLowerCase().includes(q) ||
      item.description.toLowerCase().includes(q)
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-white text-base">Bảng Tra Cứu Mã Lỗi Hệ Thống</h3>
              <p className="text-xs text-slate-400">Quy chuẩn mã lỗi định dạng ME0000x</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b border-slate-800 bg-slate-900/50">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm theo mã lỗi (ME00001...) hoặc nội dung thông báo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {entries.length === 0 ? (
            <div className="text-center py-10 text-slate-500 text-sm">
              Không tìm thấy mã lỗi phù hợp với "{searchTerm}"
            </div>
          ) : (
            entries.map(([code, item]) => (
              <div
                key={code}
                className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-xl hover:border-slate-700 transition space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    {code}
                  </span>
                  <span className="text-[11px] text-slate-500 font-mono">
                    HTTP {item.defaultStatus}
                  </span>
                </div>
                <div className="text-sm font-medium text-slate-200">{item.template}</div>
                <div className="text-xs text-slate-400">{item.description}</div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 text-center text-xs text-slate-500">
          Tổng cộng {Object.keys(ERROR_CATALOG).length} mã lỗi chuẩn hóa toàn diện
        </div>
      </div>
    </div>
  );
};
