import { clientFetch } from './clientApi';
import { BankTransactionRecord } from '../../shared/types';

export interface BankCheckResult {
  success: boolean;
  paid: boolean;
  transaction?: BankTransactionRecord;
}

export const bankApi = {
  checkStatus: async (
    orderCode: string,
    orderId: string,
    amount: number,
    apiKey?: string
  ): Promise<BankCheckResult> => {
    return clientFetch<BankCheckResult>('/api/payment/check-status', {
      params: { orderCode, orderId, amount, apiKey },
    });
  },

  simulateBankTransfer: async (payload: {
    orderCode: string;
    orderId: string;
    amount: number;
    tableName?: string;
  }): Promise<{ success: boolean; message: string; transaction: BankTransactionRecord }> => {
    return clientFetch('/api/payment/simulate-bank-transfer', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  getRecentTransactions: async (): Promise<{ success: boolean; transactions: BankTransactionRecord[] }> => {
    return clientFetch('/api/payment/recent-transactions');
  },
};
