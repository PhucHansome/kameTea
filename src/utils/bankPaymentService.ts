/**
 * BANK PAYMENT SERVICE
 * SRP: Manages communication with Bank Webhook & Transaction Checking APIs.
 */

export interface BankTransaction {
  id: string;
  gateway: string;
  accountNumber: string;
  amountIn: number;
  transactionDate: string;
  transactionContent: string;
  referenceNumber: string;
  matchedOrderCode?: string;
  receivedAt: number;
}

export interface CheckPaymentResult {
  success: boolean;
  paid: boolean;
  transaction?: BankTransaction;
  message?: string;
}

/**
 * Polls the backend API to check if the bank has confirmed incoming funds for this order.
 */
export async function checkBankPaymentStatus(
  orderCode: string,
  orderId: string,
  amount: number,
  apiKey?: string
): Promise<CheckPaymentResult> {
  try {
    const params = new URLSearchParams({
      orderCode: orderCode || '',
      orderId: orderId || '',
      amount: String(amount || 0),
    });

    if (apiKey) {
      params.append('apiKey', apiKey);
    }

    const response = await fetch(`/api/payment/check-status?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      return { success: false, paid: false };
    }

    const data = await response.json();
    return {
      success: !!data.success,
      paid: !!data.paid,
      transaction: data.transaction,
    };
  } catch (error) {
    console.warn('[bankPaymentService] Polling check failed:', error);
    return { success: false, paid: false };
  }
}

/**
 * Simulates a bank transfer notification for instant testing in dev & staging without real money.
 */
export async function simulateBankPayment(
  orderCode: string,
  orderId: string,
  amount: number,
  tableName?: string
): Promise<{ success: boolean; message: string; transaction?: BankTransaction }> {
  try {
    const response = await fetch('/api/payment/simulate-bank-transfer', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        orderCode,
        orderId,
        amount,
        tableName,
      }),
    });

    if (!response.ok) {
      throw new Error('Simulation endpoint returned an error');
    }

    return await response.json();
  } catch (error: any) {
    return {
      success: false,
      message: error?.message || 'Không thể gửi lệnh giả lập ngân hàng',
    };
  }
}

/**
 * Fetches recent confirmed bank transactions.
 */
export async function getRecentBankTransactions(): Promise<BankTransaction[]> {
  try {
    const response = await fetch('/api/payment/recent-transactions');
    if (!response.ok) return [];
    const data = await response.json();
    return data.transactions || [];
  } catch {
    return [];
  }
}
