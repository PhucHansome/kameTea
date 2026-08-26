import React, { useState } from 'react';
import { Building2, ShieldCheck, Copy, Check } from 'lucide-react';
import { usePOS } from '../../context/POSContext';

interface SacombankQRProps {
  amount?: number;
  orderCode?: string;
  tableName?: string;
  size?: 'sm' | 'md' | 'lg' | 'receipt';
  showDetails?: boolean;
  className?: string;
}

export const SacombankQR: React.FC<SacombankQRProps> = ({
  amount,
  orderCode,
  tableName,
  size = 'md',
  showDetails = true,
  className = '',
}) => {
  const { settings } = usePOS();
  const [copiedMemo, setCopiedMemo] = useState(false);
  const [copiedAccount, setCopiedAccount] = useState(false);
  const [imgError, setImgError] = useState(false);

  const accountHolder = settings.accountHolder || 'TRẦN THẾ KIỆM';
  const bankAccount = settings.bankAccount || 'SCMM9R7GUFDQJ3FFPB';
  const bankName = settings.bankName || 'Sacombank';
  const transferMemo = orderCode
    ? `KAME ${tableName ? tableName + ' ' : ''}${orderCode.replace('#', '')}`
    : 'KAME POS';

  const vietQrUrl = `https://img.vietqr.io/image/Sacombank-${bankAccount}-compact2.png?amount=${
    amount || 0
  }&addInfo=${encodeURIComponent(transferMemo)}&accountName=${encodeURIComponent(accountHolder)}`;

  const handleCopy = (text: string, type: 'memo' | 'acc') => {
    navigator.clipboard.writeText(text);
    if (type === 'memo') {
      setCopiedMemo(true);
      setTimeout(() => setCopiedMemo(false), 2000);
    } else {
      setCopiedAccount(true);
      setTimeout(() => setCopiedAccount(false), 2000);
    }
  };

  // Dimensions based on size
  const getDimensions = () => {
    switch (size) {
      case 'sm':
        return 'w-32 h-32';
      case 'receipt':
        return 'w-36 h-36';
      case 'lg':
        return 'w-64 h-64';
      case 'md':
      default:
        return 'w-48 h-48 sm:w-56 sm:h-56';
    }
  };

  if (size === 'receipt') {
    return (
      <div className={`flex flex-col items-center justify-center text-center p-1 ${className}`}>
        {/* Sacombank QR Code optimized for thermal printing */}
        <div className="bg-white p-1.5 border-2 border-black rounded-lg inline-block">
          {!imgError ? (
            <img
              src={vietQrUrl}
              alt="Sacombank QR"
              onError={() => setImgError(true)}
              className="w-32 h-32 object-contain mx-auto"
            />
          ) : (
            <svg
              className="w-32 h-32 mx-auto text-black"
              viewBox="0 0 200 200"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect width="200" height="200" fill="white" />
              {/* Top-Left Finder */}
              <rect x="15" y="15" width="45" height="45" fill="black" rx="3" />
              <rect x="23" y="23" width="29" height="29" fill="white" rx="2" />
              <rect x="29" y="29" width="17" height="17" fill="black" rx="1" />
              
              {/* Top-Right Finder */}
              <rect x="140" y="15" width="45" height="45" fill="black" rx="3" />
              <rect x="148" y="23" width="29" height="29" fill="white" rx="2" />
              <rect x="154" y="29" width="17" height="17" fill="black" rx="1" />
              
              {/* Bottom-Left Finder */}
              <rect x="15" y="140" width="45" height="45" fill="black" rx="3" />
              <rect x="23" y="148" width="29" height="29" fill="white" rx="2" />
              <rect x="29" y="154" width="17" height="17" fill="black" rx="1" />

              {/* Data Modules */}
              <rect x="70" y="20" width="8" height="8" fill="black" />
              <rect x="85" y="20" width="16" height="8" fill="black" />
              <rect x="110" y="20" width="12" height="8" fill="black" />
              <rect x="68" y="36" width="14" height="8" fill="black" />
              <rect x="90" y="36" width="8" height="14" fill="black" />
              <rect x="105" y="36" width="14" height="8" fill="black" />
              <rect x="70" y="52" width="16" height="8" fill="black" />
              <rect x="95" y="52" width="20" height="8" fill="black" />
              <rect x="120" y="52" width="8" height="14" fill="black" />

              {/* Center Matrix */}
              <rect x="20" y="70" width="12" height="8" fill="black" />
              <rect x="40" y="70" width="16" height="8" fill="black" />
              <rect x="65" y="70" width="10" height="10" fill="black" />
              <rect x="85" y="70" width="8" height="14" fill="black" />
              <rect x="100" y="70" width="16" height="8" fill="black" />
              <rect x="125" y="70" width="12" height="8" fill="black" />
              <rect x="145" y="70" width="18" height="8" fill="black" />
              <rect x="170" y="70" width="10" height="10" fill="black" />

              <rect x="20" y="86" width="8" height="14" fill="black" />
              <rect x="35" y="86" width="14" height="8" fill="black" />
              <rect x="55" y="86" width="18" height="8" fill="black" />
              <rect x="80" y="86" width="12" height="12" fill="black" />
              <rect x="100" y="86" width="8" height="14" fill="black" />
              <rect x="115" y="86" width="18" height="8" fill="black" />
              <rect x="140" y="86" width="10" height="14" fill="black" />
              <rect x="160" y="86" width="20" height="8" fill="black" />

              <circle cx="100" cy="100" r="14" fill="white" />
              <rect x="90" y="93" width="20" height="14" rx="2" fill="black" />
              <text x="92" y="103" fill="white" fontSize="7" fontWeight="bold" fontFamily="sans-serif">STB</text>
            </svg>
          )}
        </div>

        <div className="mt-1 space-y-0.5 text-[10px] text-stone-900 font-mono">
          <p className="font-bold uppercase tracking-wider">{bankName}</p>
          <p className="font-black text-[11px] text-black">STK: {bankAccount}</p>
          <p className="text-[10px] font-bold uppercase">{accountHolder}</p>
          {amount && amount > 0 && (
            <p className="font-black text-[11px]">{amount.toLocaleString('vi-VN')} VNĐ</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center text-center space-y-3 ${className}`}>
      {/* Badge Sacombank Header */}
      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-xs font-bold shadow-2xs">
        <Building2 className="w-3.5 h-3.5 text-blue-600" />
        <span>Mã QR Ngân Hàng Sacombank</span>
      </div>

      {/* Main QR Card */}
      <div className="relative p-4 bg-white dark:bg-stone-900 rounded-3xl shadow-xl border-2 border-blue-500/80 max-w-[280px] w-full flex flex-col items-center">
        {/* Sacombank Brand Header */}
        <div className="w-full flex items-center justify-between pb-2 mb-2 border-b border-stone-100 dark:border-stone-800 text-xs">
          <span className="font-black text-blue-600 tracking-wider">Sacombank</span>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 flex items-center gap-1">
            <ShieldCheck className="w-3 h-3" />
            Xác thực 24/7
          </span>
        </div>

        {/* QR Canvas / Image */}
        <div className={`${getDimensions()} bg-white p-2 rounded-2xl flex items-center justify-center shadow-inner border border-stone-200 overflow-hidden`}>
          {!imgError ? (
            <img
              src={vietQrUrl}
              alt="Mã QR Sacombank"
              onError={() => setImgError(true)}
              className="w-full h-full object-contain"
            />
          ) : (
            <svg
              className="w-full h-full text-stone-900"
              viewBox="0 0 200 200"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Top-Left Finder */}
              <rect x="10" y="10" width="50" height="50" fill="#0f172a" rx="6" />
              <rect x="18" y="18" width="34" height="34" fill="white" rx="3" />
              <rect x="25" y="25" width="20" height="20" fill="#0f172a" rx="2" />
              
              {/* Top-Right Finder */}
              <rect x="140" y="10" width="50" height="50" fill="#0f172a" rx="6" />
              <rect x="148" y="18" width="34" height="34" fill="white" rx="3" />
              <rect x="155" y="25" width="20" height="20" fill="#0f172a" rx="2" />
              
              {/* Bottom-Left Finder */}
              <rect x="10" y="140" width="50" height="50" fill="#0f172a" rx="6" />
              <rect x="18" y="148" width="34" height="34" fill="white" rx="3" />
              <rect x="25" y="155" width="20" height="20" fill="#0f172a" rx="2" />

              {/* Center Matrix Elements */}
              <rect x="70" y="15" width="10" height="10" fill="#0f172a" rx="1" />
              <rect x="86" y="15" width="18" height="10" fill="#0f172a" rx="1" />
              <rect x="112" y="15" width="12" height="10" fill="#0f172a" rx="1" />
              <rect x="68" y="32" width="16" height="10" fill="#0f172a" rx="1" />
              <rect x="90" y="32" width="10" height="16" fill="#0f172a" rx="1" />
              <rect x="108" y="32" width="16" height="10" fill="#0f172a" rx="1" />
              <rect x="70" y="48" width="18" height="10" fill="#0f172a" rx="1" />
              <rect x="96" y="48" width="22" height="10" fill="#0f172a" rx="1" />
              <rect x="122" y="48" width="10" height="16" fill="#0f172a" rx="1" />

              <rect x="15" y="70" width="14" height="10" fill="#0f172a" rx="1" />
              <rect x="36" y="70" width="18" height="10" fill="#0f172a" rx="1" />
              <rect x="62" y="70" width="12" height="12" fill="#0f172a" rx="1" />
              <rect x="82" y="70" width="10" height="16" fill="#0f172a" rx="1" />
              <rect x="100" y="70" width="18" height="10" fill="#0f172a" rx="1" />
              <rect x="126" y="70" width="14" height="10" fill="#0f172a" rx="1" />
              <rect x="148" y="70" width="20" height="10" fill="#0f172a" rx="1" />
              <rect x="174" y="70" width="12" height="12" fill="#0f172a" rx="1" />

              <rect x="15" y="88" width="10" height="16" fill="#0f172a" rx="1" />
              <rect x="32" y="88" width="16" height="10" fill="#0f172a" rx="1" />
              <rect x="54" y="88" width="20" height="10" fill="#0f172a" rx="1" />
              <rect x="80" y="88" width="14" height="14" fill="#0f172a" rx="1" />
              <rect x="102" y="88" width="10" height="16" fill="#0f172a" rx="1" />
              <rect x="118" y="88" width="20" height="10" fill="#0f172a" rx="1" />
              <rect x="145" y="88" width="12" height="16" fill="#0f172a" rx="1" />
              <rect x="165" y="88" width="22" height="10" fill="#0f172a" rx="1" />

              {/* Central Sacombank Emblem */}
              <circle cx="100" cy="100" r="16" fill="white" />
              <rect x="88" y="91" width="24" height="18" rx="4" fill="#0284c7" />
              <text x="91" y="103" fill="white" fontSize="8" fontWeight="900" fontFamily="sans-serif">STB</text>
            </svg>
          )}
        </div>

        {/* Account Info as requested */}
        <div className="mt-3 w-full pt-2.5 border-t-2 border-dashed border-stone-200 dark:border-stone-700 text-center">
          <p className="text-[11px] text-stone-500 font-medium">Chủ tài khoản:</p>
          <p className="text-sm font-black text-stone-900 dark:text-stone-100 tracking-wide mt-0.5 uppercase">
            {accountHolder}
          </p>
        </div>
      </div>

      {/* Details Box */}
      {showDetails && (
        <div className="w-full max-w-[280px] bg-white dark:bg-stone-900 p-3 rounded-2xl border border-stone-200 dark:border-stone-800 text-xs space-y-2 text-left shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-stone-500">Ngân hàng:</span>
            <span className="font-bold text-blue-600 dark:text-blue-400 font-sans">
              Sacombank (STB)
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-stone-500">Số tài khoản:</span>
            <button
              type="button"
              onClick={() => handleCopy(bankAccount, 'acc')}
              className="font-mono font-black text-blue-600 dark:text-blue-400 flex items-center gap-1 hover:underline transition"
              title="Nhấn để sao chép STK"
            >
              <span>{bankAccount}</span>
              {copiedAccount ? (
                <Check className="w-3 h-3 text-emerald-500" />
              ) : (
                <Copy className="w-3 h-3 text-stone-400" />
              )}
            </button>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-stone-500">Chủ tài khoản:</span>
            <span className="font-bold uppercase text-stone-900 dark:text-stone-100">
              {accountHolder}
            </span>
          </div>

          {amount && amount > 0 && (
            <div className="flex items-center justify-between pt-1 border-t border-stone-100 dark:border-stone-800">
              <span className="text-stone-500">Số tiền thanh toán:</span>
              <span className="font-black text-amber-600 dark:text-amber-400 text-sm font-mono">
                {amount.toLocaleString('vi-VN')}đ
              </span>
            </div>
          )}

          <div className="flex items-center justify-between pt-1 border-t border-stone-100 dark:border-stone-800">
            <span className="text-stone-500">Nội dung CK:</span>
            <button
              type="button"
              onClick={() => handleCopy(transferMemo, 'memo')}
              className="font-mono font-bold text-stone-800 dark:text-stone-200 flex items-center gap-1 hover:text-amber-600 transition"
              title="Nhấn để sao chép nội dung"
            >
              <span>{transferMemo}</span>
              {copiedMemo ? (
                <Check className="w-3 h-3 text-emerald-500" />
              ) : (
                <Copy className="w-3 h-3 text-stone-400" />
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
