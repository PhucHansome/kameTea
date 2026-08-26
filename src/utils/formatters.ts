/**
 * Utility functions for formatting currency and numbers in Vietnamese format
 */

/**
 * Format a number as Vietnamese Dong (e.g. 150000 -> "150.000")
 */
export const formatVND = (amount: number | undefined | null): string => {
  if (amount === undefined || amount === null || isNaN(amount)) return '0';
  return Math.round(amount).toLocaleString('vi-VN');
};

/**
 * Format a number as full currency string (e.g. 150000 -> "150.000 đ")
 */
export const formatVNDFull = (amount: number | undefined | null): string => {
  return `${formatVND(amount)} đ`;
};

/**
 * Format raw input string into formatted thousand separated string (e.g. "150000" -> "150.000")
 */
export const formatMoneyInput = (value: number | string | undefined | null): string => {
  if (value === undefined || value === null || value === '') return '';
  const cleanDigits = String(value).replace(/\D/g, '');
  if (!cleanDigits) return '';
  return Number(cleanDigits).toLocaleString('vi-VN');
};

/**
 * Parse a formatted string with dots (e.g. "150.000" or "1.500.000") back to a number
 */
export const parseMoneyInput = (value: string | number | undefined | null): number => {
  if (value === undefined || value === null || value === '') return 0;
  if (typeof value === 'number') return isNaN(value) ? 0 : value;
  const cleanDigits = String(value).replace(/\./g, '').replace(/,/g, '').replace(/\D/g, '');
  return cleanDigits ? Number(cleanDigits) : 0;
};
