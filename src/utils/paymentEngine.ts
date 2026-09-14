import { OrderItem, PaymentMethodType } from '../types/pos';

export interface SettlementInput {
  subtotal: number;
  discountPercent: number;
  taxPercent: number;
  shippingFee: number;
  paymentMethod: PaymentMethodType;
  paymentDetails?: {
    cashAmount?: number;
    transferAmount?: number;
    shippingFee?: number;
  };
}

export interface SettlementBreakdown {
  subtotal: number;
  discountAmount: number;
  taxableAmount: number;
  taxAmount: number;
  shippingFee: number;
  totalAmount: number;
  cashAmountPaid: number;
  transferAmountPaid: number;
  changeAmount: number;
}

/**
 * Calculates subtotal for an order's active (non-cancelled) items.
 * Single Responsibility: Pure subtotal calculation.
 */
export function calculateOrderSubtotal(items: OrderItem[]): number {
  if (!items || !Array.isArray(items)) return 0;
  return items.reduce((sum, item) => {
    if (item.status === 'CANCELLED') return sum;
    const itemPrice = Math.max(0, Math.round(item.unitPrice || 0));
    const qty = Math.max(0, item.quantity || 0);
    return sum + itemPrice * qty;
  }, 0);
}

/**
 * Pure Function calculating financial settlement breakdown.
 * - Enforces whole integer VND (triệt tiêu floating-point errors).
 * - Handles all edge cases (Mixed payment with excess cash, zero total, invalid inputs).
 * - Implements SOLID: Single Responsibility, deterministic, zero side-effects.
 */
export function calculateSettlement(input: SettlementInput): SettlementBreakdown {
  const safeSubtotal = Math.max(0, Math.round(input.subtotal || 0));
  const safeDiscountPercent = Math.min(100, Math.max(0, input.discountPercent || 0));
  const safeTaxPercent = Math.max(0, input.taxPercent || 0);
  const safeShipping = Math.max(
    0,
    Math.round(input.paymentDetails?.shippingFee ?? input.shippingFee ?? 0)
  );

  // 1. Discount amount & Taxable base
  const discountAmount = Math.round((safeSubtotal * safeDiscountPercent) / 100);
  const taxableAmount = Math.max(0, safeSubtotal - discountAmount);

  // 2. Tax (VAT) & Total payable
  const taxAmount = Math.round((taxableAmount * safeTaxPercent) / 100);
  const totalAmount = Math.max(0, taxableAmount + taxAmount + safeShipping);

  let cashAmountPaid = 0;
  let transferAmountPaid = 0;
  let changeAmount = 0;

  // 3. Payment Method Allocation & Edge Cases
  switch (input.paymentMethod) {
    case 'CASH': {
      const rawCash = Math.max(
        0,
        Math.round(input.paymentDetails?.cashAmount ?? totalAmount)
      );
      cashAmountPaid = Math.min(rawCash, totalAmount);
      changeAmount = Math.max(0, rawCash - totalAmount);
      transferAmountPaid = 0;
      break;
    }

    case 'MIXED': {
      const rawMixedCash = Math.max(
        0,
        Math.round(input.paymentDetails?.cashAmount ?? 0)
      );

      if (rawMixedCash >= totalAmount) {
        // Customer paid all or more in cash
        cashAmountPaid = totalAmount;
        changeAmount = rawMixedCash - totalAmount;
        transferAmountPaid = 0;
      } else {
        cashAmountPaid = rawMixedCash;
        transferAmountPaid = Math.max(0, totalAmount - rawMixedCash);
        changeAmount = 0;
      }
      break;
    }

    case 'VIETQR':
    case 'SACOMBANK_QR':
    case 'TRANSFER':
    case 'CARD':
    default: {
      cashAmountPaid = 0;
      transferAmountPaid = totalAmount;
      changeAmount = 0;
      break;
    }
  }

  return {
    subtotal: safeSubtotal,
    discountAmount,
    taxableAmount,
    taxAmount,
    shippingFee: safeShipping,
    totalAmount,
    cashAmountPaid,
    transferAmountPaid,
    changeAmount,
  };
}
