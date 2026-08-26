import React, { useState } from 'react';
import { KAME_LOGO_URL } from '../../assets/logo';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showSubtitle?: boolean;
  className?: string;
  variant?: 'full' | 'iconOnly';
}

export const Logo: React.FC<LogoProps> = ({
  size = 'md',
  showSubtitle = true,
  className = '',
  variant = 'full',
}) => {
  const [imgError, setImgError] = useState(false);

  const sizeClasses = {
    sm: 'w-9 h-9',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24',
  };

  const textClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-xl',
    xl: 'text-2xl',
  };

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* KAME Official Circular Logo Image */}
      <div
        className={`${sizeClasses[size]} rounded-full border-2 border-amber-800/40 dark:border-amber-600/50 shadow-md shadow-amber-900/10 shrink-0 overflow-hidden bg-amber-50 flex items-center justify-center transition-transform hover:scale-105 duration-200`}
      >
        {!imgError ? (
          <img
            src={KAME_LOGO_URL}
            alt="KAME - Ốc, Ăn Vặt & Trà Sữa"
            className="w-full h-full object-cover"
            onError={() => setImgError(true)}
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-full h-full bg-amber-500 text-white font-black flex items-center justify-center text-lg">
            K
          </div>
        )}
      </div>

      {/* Brand Typography */}
      {variant !== 'iconOnly' && (
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span
              className={`${textClasses[size]} font-black tracking-wider text-slate-900 dark:text-white uppercase font-sans`}
            >
              KAME
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-100 text-amber-900 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300 dark:border-amber-800 uppercase tracking-wider">
              POS
            </span>
          </div>
          {showSubtitle && (
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              <span>Vị trà đậm đà chuẩn gu</span>
              <span className="text-amber-500 font-bold">•</span>
              <span className="text-amber-700 dark:text-amber-400 font-semibold">Ốc & Ăn Vặt</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};


