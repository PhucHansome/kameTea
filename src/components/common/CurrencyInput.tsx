import React, { useState, useEffect } from 'react';
import { formatMoneyInput, parseMoneyInput } from '../../utils/formatters';

interface CurrencyInputProps {
  id?: string;
  value: number;
  onChange: (val: number) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  required?: boolean;
  min?: number;
  suffix?: string;
  autoFocus?: boolean;
}

export const CurrencyInput: React.FC<CurrencyInputProps> = ({
  id,
  value,
  onChange,
  placeholder = '0',
  className = '',
  disabled = false,
  required = false,
  suffix = 'đ',
  autoFocus = false,
}) => {
  const [displayValue, setDisplayValue] = useState<string>(
    value ? formatMoneyInput(value) : ''
  );

  useEffect(() => {
    setDisplayValue(value ? formatMoneyInput(value) : '');
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawStr = e.target.value;
    const num = parseMoneyInput(rawStr);
    const formatted = formatMoneyInput(rawStr);
    setDisplayValue(formatted);
    onChange(num);
  };

  return (
    <div className="relative w-full flex items-center">
      <input
        id={id}
        type="text"
        inputMode="numeric"
        value={displayValue}
        onChange={handleChange}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        autoFocus={autoFocus}
        className={`w-full pr-8 ${className}`}
      />
      {suffix && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-stone-400 dark:text-stone-500 pointer-events-none select-none">
          {suffix}
        </span>
      )}
    </div>
  );
};
