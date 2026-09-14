import React, { useState } from 'react';
import { Building2, ShieldCheck, Copy, Check } from 'lucide-react';
import { usePOS } from '../../context/POSContext';
import { findBank, buildVietQRUrl } from '../../utils/vietnameseBanks';

export interface SacombankQRProps {
  amount?: number;
  orderCode?: string;
  tableName?: string;
  size?: 'sm' | 'md' | 'lg' | 'receipt';
  showDetails?: boolean;
  compact?: boolean;
  className?: string;
  bankCode?: string;
  bankName?: string;
  bankAccount?: string;
  accountHolder?: string;
}

export const SacombankQR: React.FC<SacombankQRProps> = ({
  amount,
  orderCode,
  tableName,
  size = 'md',
  showDetails = true,
  compact = false,
  className = '',
  bankCode: propBankCode,
  bankName: propBankName,
  bankAccount: propBankAccount,
  accountHolder: propAccountHolder,
}) => {
  const { settings } = usePOS();
  const [copiedMemo, setCopiedMemo] = useState(false);
  const [copiedAccount, setCopiedAccount] = useState(false);
  const [imgError, setImgError] = useState(false);

  const bankName = propBankName || settings.bankName || 'Sacombank';
  const bankCode = propBankCode || settings.bankCode || 'STB';
  const bankAccount = propBankAccount || settings.bankAccount || 'SCMM9R7GUFDQJ3FFPB';
  const accountHolder = propAccountHolder || settings.accountHolder || 'TRẦN THẾ KIỆM';

  const matchedBank = findBank(bankCode) || findBank(bankName);
  const displayBankName = matchedBank?.shortName || bankName;
  const effectiveBankCode = matchedBank?.code || bankCode || 'STB';

  const transferMemo = orderCode
    ? `KAME ${tableName ? tableName + ' ' : ''}${orderCode.replace('#', '')}`
    : 'KAME POS';

  const vietQrUrl = buildVietQRUrl({
    bankCodeOrBin: effectiveBankCode,
    bankAccount,
    amount: amount || 0,
    memo: transferMemo,
    accountHolder,
    template: 'compact2',
  });

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
    if (compact) return 'w-36 h-36';
    switch (size) {
      case 'sm':
        return 'w-32 h-32';
      case 'receipt':
        return 'w-36 h-36';
      case 'lg':
        return 'w-64 h-64';
      case 'md':
      default:
        return 'w-44 h-44 sm:w-48 sm:h-48';
    }
  };

  // THERMAL RECEIPT PRINTING MODE
  if (size === 'receipt') {
    return (
      <div className={`flex flex-col items-center justify-center text-center p-1 ${className}`}>
        <div className="bg-white p-1 border-2 border-black rounded-lg inline-block">
          {!imgError ? (
            <img
              src={vietQrUrl}
              alt={`QR ${displayBankName}`}
              onError={() => setImgError(true)}
              className="w-32 h-32 object-contain mx-auto"
            />
          ) : (
            <div className="w-32 h-32 flex items-center justify-center border border-dashed border-black text-[10px] font-mono">
              [QR {displayBankName}]
            </div>
          )}
        </div>

        <div className="mt-1 space-y-0.5 text-[10px] text-stone-900 font-mono">
          <p className="font-bold uppercase tracking-wider">{displayBankName}</p>
          <p className="font-black text-[11px] text-black">STK: {bankAccount}</p>
          <p className="text-[10px] font-bold uppercase">{accountHolder}</p>
          {amount && amount > 0 && (
            <p className="font-black text-[11px]">{amount.toLocaleString('vi-VN')} VNĐ</p>
          )}
        </div>
      </div>
    );
  }

  // COMPACT MODE (Designed for zero-scroll modals & tight POS displays)
  if (compact) {
    return (
      <div className={`w-full flex flex-col items-center text-center ${className}`}>
        {/* Sleek Compact QR Box */}
        <div className="relative p-2.5 bg-white dark:bg-stone-900 rounded-2xl shadow-md border border-blue-500/60 dark:border-blue-500/40 w-full max-w-[260px] flex flex-col items-center">
          {/* Bank Header Bar */}
          <div className="w-full flex items-center justify-between pb-1.5 mb-1.5 border-b border-stone-100 dark:border-stone-800 text-[11px]">
            <div className="flex items-center gap-1">
              <Building2 className="w-3 h-3 text-blue-600" />
              <span className="font-black text-blue-600 dark:text-blue-400 tracking-wide">
                {displayBankName}
              </span>
            </div>
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 flex items-center gap-0.5">
              <ShieldCheck className="w-2.5 h-2.5" />
              Napas 24/7
            </span>
          </div>

          {/* QR Image */}
          <div className="w-36 h-36 bg-white p-1 rounded-xl flex items-center justify-center border border-stone-200 overflow-hidden shadow-2xs">
            {!imgError ? (
              <img
                src={vietQrUrl}
                alt={`Mã QR ${displayBankName}`}
                onError={() => setImgError(true)}
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-stone-500 text-[10px] p-2 text-center">
                <Building2 className="w-6 h-6 text-stone-400 mb-1" />
                <span>Không tải được ảnh QR</span>
              </div>
            )}
          </div>

          {/* Compact Account & Memo Details */}
          <div className="mt-2 w-full pt-1.5 border-t border-dashed border-stone-200 dark:border-stone-800 text-[11px] space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-stone-400 text-[10px]">STK:</span>
              <button
                type="button"
                onClick={() => handleCopy(bankAccount, 'acc')}
                className="font-mono font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1 hover:underline cursor-pointer"
                title="Nhấn để chép STK"
              >
                <span>{bankAccount}</span>
                {copiedAccount ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-2.5 h-2.5 text-stone-400" />}
              </button>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-stone-400 text-[10px]">Chủ TK:</span>
              <span className="font-bold uppercase text-stone-800 dark:text-stone-200 text-[10px] truncate max-w-[170px]">
                {accountHolder}
              </span>
            </div>

            <div className="flex items-center justify-between pt-0.5 border-t border-stone-100 dark:border-stone-800/60">
              <span className="text-stone-400 text-[10px]">Nội dung:</span>
              <button
                type="button"
                onClick={() => handleCopy(transferMemo, 'memo')}
                className="font-mono font-bold text-amber-700 dark:text-amber-300 flex items-center gap-1 hover:underline cursor-pointer"
                title="Nhấn để chép nội dung"
              >
                <span className="truncate max-w-[160px]">{transferMemo}</span>
                {copiedMemo ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-2.5 h-2.5 text-stone-400" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // STANDARD EXPANDED MODE
  return (
    <div className={`flex flex-col items-center text-center space-y-2.5 ${className}`}>
      {/* Badge Bank Header */}
      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-xs font-bold shadow-2xs">
        <Building2 className="w-3.5 h-3.5 text-blue-600" />
        <span>Mã QR Ngân Hàng {displayBankName}</span>
      </div>

      {/* Main QR Card */}
      <div className="relative p-3.5 bg-white dark:bg-stone-900 rounded-2xl shadow-lg border border-blue-500/70 max-w-[270px] w-full flex flex-col items-center">
        {/* Brand Header */}
        <div className="w-full flex items-center justify-between pb-2 mb-2 border-b border-stone-100 dark:border-stone-800 text-xs">
          <span className="font-black text-blue-600 tracking-wider">{displayBankName}</span>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 flex items-center gap-1">
            <ShieldCheck className="w-3 h-3" />
            Xác thực 24/7
          </span>
        </div>

        {/* QR Image */}
        <div className={`${getDimensions()} bg-white p-1.5 rounded-xl flex items-center justify-center shadow-inner border border-stone-200 overflow-hidden`}>
          {!imgError ? (
            <img
              src={vietQrUrl}
              alt={`Mã QR ${displayBankName}`}
              onError={() => setImgError(true)}
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-stone-400 text-xs">
              <Building2 className="w-8 h-8 text-stone-400 mb-1" />
              <span>Không tải được mã QR</span>
            </div>
          )}
        </div>

        {/* Account Info */}
        <div className="mt-2.5 w-full pt-2 border-t border-dashed border-stone-200 dark:border-stone-700 text-center">
          <p className="text-[10px] text-stone-500 font-medium">Chủ tài khoản:</p>
          <p className="text-xs font-black text-stone-900 dark:text-stone-100 tracking-wide uppercase">
            {accountHolder}
          </p>
        </div>
      </div>

      {/* Details Box */}
      {showDetails && (
        <div className="w-full max-w-[270px] bg-white dark:bg-stone-900 p-2.5 rounded-xl border border-stone-200 dark:border-stone-800 text-xs space-y-1.5 text-left shadow-2xs">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-stone-500">Ngân hàng:</span>
            <span className="font-bold text-blue-600 dark:text-blue-400 font-sans">
              {displayBankName} ({effectiveBankCode})
            </span>
          </div>

          <div className="flex items-center justify-between text-[11px]">
            <span className="text-stone-500">Số tài khoản:</span>
            <button
              type="button"
              onClick={() => handleCopy(bankAccount, 'acc')}
              className="font-mono font-black text-blue-600 dark:text-blue-400 flex items-center gap-1 hover:underline transition cursor-pointer"
              title="Nhấn để sao chép STK"
            >
              <span>{bankAccount}</span>
              {copiedAccount ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-2.5 h-2.5 text-stone-400" />}
            </button>
          </div>

          <div className="flex items-center justify-between text-[11px]">
            <span className="text-stone-500">Chủ tài khoản:</span>
            <span className="font-bold uppercase text-stone-900 dark:text-stone-100">
              {accountHolder}
            </span>
          </div>

          {amount && amount > 0 && (
            <div className="flex items-center justify-between pt-1 border-t border-stone-100 dark:border-stone-800 text-[11px]">
              <span className="text-stone-500">Số tiền:</span>
              <span className="font-black text-amber-600 dark:text-amber-400 font-mono">
                {amount.toLocaleString('vi-VN')}đ
              </span>
            </div>
          )}

          <div className="flex items-center justify-between pt-1 border-t border-stone-100 dark:border-stone-800 text-[11px]">
            <span className="text-stone-500">Nội dung CK:</span>
            <button
              type="button"
              onClick={() => handleCopy(transferMemo, 'memo')}
              className="font-mono font-bold text-stone-800 dark:text-stone-200 flex items-center gap-1 hover:text-amber-600 transition cursor-pointer"
              title="Nhấn để sao chép nội dung"
            >
              <span className="truncate max-w-[150px]">{transferMemo}</span>
              {copiedMemo ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-2.5 h-2.5 text-stone-400" />}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
