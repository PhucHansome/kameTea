import React, { useState, useEffect } from 'react';
import { SUPABASE_SQL_SCHEMA } from '../../data/supabaseSchema';
import {
  getSupabaseConfig,
  saveSupabaseConfig,
  clearSupabaseConfig,
  testSupabaseConnection,
  SupabaseConfig,
} from '../../lib/supabaseClient';
import {
  Database,
  Copy,
  Check,
  Sparkles,
  X,
  Link,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  RefreshCw,
  Server,
  Zap,
  HelpCircle,
  Code2,
} from 'lucide-react';

interface SupabaseIntegrationModalProps {
  onClose: () => void;
}

export const SupabaseIntegrationModal: React.FC<SupabaseIntegrationModalProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'GUIDE' | 'CONFIG' | 'SQL'>('CONFIG');
  const [copied, setCopied] = useState<boolean>(false);

  // Config state
  const [url, setUrl] = useState('');
  const [anonKey, setAnonKey] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    latencyMs?: number;
  } | null>(null);
  const [savedConfig, setSavedConfig] = useState<SupabaseConfig>(getSupabaseConfig());

  useEffect(() => {
    const cfg = getSupabaseConfig();
    setSavedConfig(cfg);
    setUrl(cfg.url);
    setAnonKey(cfg.anonKey);
  }, []);

  const handleCopySQL = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTestAndSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsTesting(true);
    setTestResult(null);

    const result = await testSupabaseConnection(url, anonKey);
    setTestResult(result);
    setIsTesting(false);

    if (result.success) {
      const newCfg: SupabaseConfig = {
        url: url.trim(),
        anonKey: anonKey.trim(),
        isConnected: true,
        lastChecked: new Date().toISOString(),
      };
      saveSupabaseConfig(newCfg);
      setSavedConfig(newCfg);
    }
  };

  const handleDisconnect = () => {
    if (confirm('Bạn có chắc chắn muốn ngắt kết nối cấu hình Supabase hiện tại?')) {
      clearSupabaseConfig();
      setSavedConfig({ url: '', anonKey: '', isConnected: false });
      setUrl('');
      setAnonKey('');
      setTestResult(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-4xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-600 text-white shadow-md">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  Trung Tâm Tích Hợp & Kết Nối Supabase
                </h3>
                {savedConfig.isConnected ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    ĐÃ KẾT NỐI
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                    CHƯA CẤU HÌNH API
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Cơ sở dữ liệu đám mây PostgreSQL, Realtime KDS & Bảo toàn vĩnh viễn Doanh thu / Lương lịch sử.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200 dark:hover:bg-slate-800 dark:hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-900/90 px-4 pt-2 gap-2 text-xs font-bold overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('CONFIG')}
            className={`px-4 py-2.5 rounded-t-xl transition-all border-b-2 flex items-center gap-2 ${
              activeTab === 'CONFIG'
                ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 border-emerald-500 shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white border-transparent'
            }`}
          >
            <Link className="w-4 h-4" />
            <span>1. Nhập URL & API Key</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('GUIDE')}
            className={`px-4 py-2.5 rounded-t-xl transition-all border-b-2 flex items-center gap-2 ${
              activeTab === 'GUIDE'
                ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 border-emerald-500 shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white border-transparent'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            <span>2. Hướng Dẫn Từng Bước (A-Z)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('SQL')}
            className={`px-4 py-2.5 rounded-t-xl transition-all border-b-2 flex items-center gap-2 ${
              activeTab === 'SQL'
                ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 border-emerald-500 shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white border-transparent'
            }`}
          >
            <Code2 className="w-4 h-4" />
            <span>3. SQL Schema & Khởi Tạo Bảng</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-xs flex-1">
          {/* ========================================================================= */}
          {/* TAB 1: CONFIGURATION & DIRECT CONNECTION */}
          {/* ========================================================================= */}
          {activeTab === 'CONFIG' && (
            <div className="space-y-5">
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/60 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="font-bold text-emerald-900 dark:text-emerald-300">
                    Kết nối tài khoản Supabase của bạn
                  </h4>
                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                    Nhập <strong>Project URL</strong> và <strong>Anon Public Key</strong> từ trang quản trị Supabase Dashboard của bạn để đồng bộ trực tiếp toàn bộ dữ liệu Menu, Bàn, Đơn hàng, Chấm công và Bảng lương lên đám mây.
                  </p>
                </div>
              </div>

              {/* Form Inputs */}
              <form onSubmit={handleTestAndSave} className="space-y-4 bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
                <div className="space-y-1.5">
                  <label className="block font-black text-slate-800 dark:text-slate-200 text-xs">
                    Supabase Project URL <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="https://xyzabcdefghijklmnop.supabase.co"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono text-xs focus:ring-2 focus:ring-emerald-500 outline-hidden"
                  />
                  <span className="text-[11px] text-slate-400">
                    Tìm tại: Supabase Dashboard &gt; Project Settings &gt; API &gt; Project URL
                  </span>
                </div>

                <div className="space-y-1.5">
                  <label className="block font-black text-slate-800 dark:text-slate-200 text-xs">
                    Supabase Anon Public Key (API Key) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    value={anonKey}
                    onChange={(e) => setAnonKey(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono text-xs focus:ring-2 focus:ring-emerald-500 outline-hidden"
                  />
                  <span className="text-[11px] text-slate-400">
                    Tìm tại: Supabase Dashboard &gt; Project Settings &gt; API &gt; Project API keys (anon / public)
                  </span>
                </div>

                {/* Test Result Message */}
                {testResult && (
                  <div
                    className={`p-3.5 rounded-xl border flex items-center gap-2.5 animate-in fade-in text-xs font-semibold ${
                      testResult.success
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-200'
                        : 'bg-rose-50 border-rose-300 text-rose-800 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-200'
                    }`}
                  >
                    {testResult.success ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                    )}
                    <span>{testResult.message}</span>
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <div className="flex items-center gap-2">
                    <button
                      type="submit"
                      disabled={isTesting || !url || !anonKey}
                      className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-2 shadow-md transition cursor-pointer"
                    >
                      {isTesting ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Đang kiểm tra kết nối...</span>
                        </>
                      ) : (
                        <>
                          <Zap className="w-4 h-4" />
                          <span>Lưu & Kiểm Tra Kết Nối</span>
                        </>
                      )}
                    </button>

                    {savedConfig.isConnected && (
                      <button
                        type="button"
                        onClick={handleDisconnect}
                        className="px-3.5 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-rose-600 font-bold hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                      >
                        Xóa kết nối
                      </button>
                    )}
                  </div>

                  <a
                    href="https://supabase.com/dashboard"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 font-semibold"
                  >
                    <span>Mở Supabase Dashboard</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </form>

              {/* Data Safety Notice */}
              <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/60 space-y-1.5">
                <h5 className="font-bold text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  Chính sách bảo toàn dữ liệu đặc biệt của KAME POS:
                </h5>
                <ul className="list-disc list-inside space-y-1 text-stone-700 dark:text-stone-300 text-[11px] leading-relaxed">
                  <li>
                    <strong>Bảo toàn Doanh thu khi xoá món:</strong> Khi bạn xoá hoặc ẩn bất kỳ món ăn nào trong Menu, toàn bộ lịch sử bán hàng và số tiền doanh thu theo từng tháng trước đó hoàn toàn <strong>KHÔNG</strong> bị thay đổi.
                  </li>
                  <li>
                    <strong>Bảo toàn Lịch sử lương khi xoá nhân viên:</strong> Khi nhân viên nghỉ việc hoặc bị xóa khỏi danh sách, toàn bộ phiếu lương đã quyết toán và lịch sử chấm công các tháng trước đó vẫn được lưu trữ nguyên vẹn để xuất Excel hoặc in ấn bất kỳ lúc nào.
                  </li>
                </ul>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: STEP-BY-STEP INTEGRATION GUIDE */}
          {/* ========================================================================= */}
          {activeTab === 'GUIDE' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Step 1 */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center">
                      1
                    </span>
                    <h4 className="font-black text-slate-900 dark:text-white">Tạo Dự Án Supabase Mới</h4>
                  </div>
                  <p className="text-slate-600 dark:text-slate-300 text-xs leading-relaxed">
                    Truy cập{' '}
                    <a
                      href="https://supabase.com"
                      target="_blank"
                      rel="noreferrer"
                      className="text-emerald-600 font-bold underline"
                    >
                      supabase.com
                    </a>{' '}
                    &gt; Đăng nhập &gt; Chọn <strong>New Project</strong> &gt; Đặt tên (ví dụ: <code className="bg-slate-200 dark:bg-slate-700 px-1 py-0.5 rounded">kame-pos</code>) &gt; Chọn khu vực gần nhất (ví dụ: Singapore) &gt; Nhấn <strong>Create New Project</strong>.
                  </p>
                </div>

                {/* Step 2 */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center">
                      2
                    </span>
                    <h4 className="font-black text-slate-900 dark:text-white">Khởi Tạo Bảng Bằng SQL Schema</h4>
                  </div>
                  <p className="text-slate-600 dark:text-slate-300 text-xs leading-relaxed">
                    Trên menu trái của Supabase, chọn <strong>SQL Editor</strong> &gt; Nhấn <strong>New Query</strong> &gt; Chuyển sang tab <strong>3. SQL Schema</strong> trong bảng này, bấm <strong>Sao chép toàn bộ SQL</strong> &gt; Dán vào Supabase và nhấn <strong>RUN</strong>.
                  </p>
                </div>

                {/* Step 3 */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center">
                      3
                    </span>
                    <h4 className="font-black text-slate-900 dark:text-white">Lấy API Keys</h4>
                  </div>
                  <p className="text-slate-600 dark:text-slate-300 text-xs leading-relaxed">
                    Vào <strong>Project Settings</strong> (biểu tượng bánh răng góc dưới trái) &gt; Chọn tab <strong>API</strong> &gt; Sao chép 2 giá trị: <strong>Project URL</strong> và <strong>anon / public key</strong>.
                  </p>
                </div>

                {/* Step 4 */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center">
                      4
                    </span>
                    <h4 className="font-black text-slate-900 dark:text-white">Dán Vào App & Sử Dụng</h4>
                  </div>
                  <p className="text-slate-600 dark:text-slate-300 text-xs leading-relaxed">
                    Chuyển sang tab <strong>1. Nhập URL & API Key</strong> &gt; Dán 2 thông tin vừa sao chép &gt; Bấm <strong>Lưu & Kiểm Tra Kết Nối</strong>. Hệ thống sẽ kết nối trực tiếp đến database của bạn!
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: SQL SCHEMA VIEWER */}
          {/* ========================================================================= */}
          {activeTab === 'SQL' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white">
                    PostgreSQL 15+ Schema & Security Rules
                  </h4>
                  <p className="text-slate-500 text-xs">
                    Tự động tạo bảng: zones, users, products, categories, tables, orders, order_items, timekeeping, payrolls, void_logs, expenses.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleCopySQL}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center gap-2 shadow-md transition cursor-pointer"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? 'Đã sao chép SQL!' : 'Sao chép toàn bộ SQL'}</span>
                </button>
              </div>

              <div className="relative rounded-2xl border border-slate-800 bg-slate-950 text-slate-200 p-4 font-mono text-[11px] leading-relaxed max-h-[380px] overflow-y-auto">
                <pre className="whitespace-pre-wrap">{SUPABASE_SQL_SCHEMA}</pre>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Server className="w-4 h-4 text-emerald-500" />
            <span>KAME POS Hybrid Storage (Local State + Supabase Cloud Engine)</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 text-xs font-bold transition hover:opacity-90"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
