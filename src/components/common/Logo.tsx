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
              className={`${textClasses[size]} font-black tracking-tight text-white dark:text-[#FFFDF9] uppercase font-sans drop-shadow-xs`}
            >
              Kame-Tea
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-black bg-[#8D5B4C] text-white border border-[#A86F5D] uppercase tracking-wider shadow-xs">
              POS
            </span>
          </div>
          {showSubtitle && (
            <div className="flex items-center gap-1.5 text-[11px] text-[#EFE4D6] dark:text-[#EFE4D6] font-medium mt-0.5">
              <span className="text-[#FCEEE3] font-semibold">Trà Sữa Chuẩn Vị</span>
              <span className="text-[#C48B5E] font-bold">•</span>
              <span className="text-[#FFE6D5] font-bold">Ốc & Ăn Vặt</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};


