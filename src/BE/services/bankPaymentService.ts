import { BankRepository } from '../repositories/bankRepository';
import { OrderRepository } from '../repositories/orderRepository';
import { BankTransactionRecord } from '../../shared/types';
import { AppValidationError } from '../../shared/errorCatalog';

export class BankPaymentService {
  public static sanitizeBankContent(text: string): string {
    if (!text) return '';
    return text
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, ' ');
  }

  public static processWebhook(payload: any, authHeader?: string, webhookSecret?: string) {
    if (webhookSecret && authHeader && authHeader !== `Apikey ${webhookSecret}` && authHeader !== webhookSecret) {
      throw new AppValidationError('ME00010');
    }

    const rawItems: any[] = Array.isArray(payload?.data)
      ? payload.data
      : Array.isArray(payload)
      ? payload
      : [payload || {}];

    const processedTxs: BankTransactionRecord[] = [];
    const activeOrders = OrderRepository.getAllInMemoryOrders();

    for (const item of rawItems) {
      const amount = Number(item.amountIn ?? item.amount ?? item.credit ?? 0);
      if (amount <= 0) continue;

      const content = String(item.transactionContent || item.description || item.content || item.body || '');
      const refNo = String(item.referenceNumber || item.referenceCode || item.refNo || item.id || `TX-${Date.now()}`);
      const account = String(item.accountNumber || item.subAccount || item.bankAccount || '');
      const gateway = String(item.gateway || item.bank || 'Sacombank');
      const txDate = String(item.transactionDate || item.when || new Date().toISOString());

      const sanitized = this.sanitizeBankContent(content);

      // Match against active orders in memory
      let matchedCode: string | undefined = undefined;
      for (const order of activeOrders) {
        const rawCode = this.sanitizeBankContent(order.orderCode || '');
        const cleanCode = rawCode.replace(/\s+/g, '');
        const sanitizedId = this.sanitizeBankContent(order.id || '');

        if (
          (cleanCode && sanitized.includes(cleanCode)) ||
          (rawCode && sanitized.includes(rawCode)) ||
          (sanitizedId && sanitized.includes(sanitizedId))
        ) {
          matchedCode = order.orderCode;
          break;
        }
      }

      const txRecord: BankTransactionRecord = {
        id: refNo,
        gateway,
        accountNumber: account,
        amountIn: amount,
        transactionDate: txDate,
        transactionContent: content,
        referenceNumber: refNo,
        matchedOrderCode: matchedCode,
        receivedAt: Date.now(),
      };

      BankRepository.addTransaction(txRecord);
      processedTxs.push(txRecord);
    }

    return {
      success: true,
      message: 'Đã nhận và lưu thông báo giao dịch ngân hàng',
      count: processedTxs.length,
      transactions: processedTxs,
    };
  }

  public static async checkStatus(
    orderCode: string,
    orderId: string,
    expectedAmount: number,
    apiKey?: string
  ) {
    const fifteenMinutesAgo = Date.now() - 15 * 60 * 1000;
    const sanitizedOrderCode = this.sanitizeBankContent(orderCode).replace(/\s+/g, '');
    const sanitizedOrderId = this.sanitizeBankContent(orderId).replace(/\s+/g, '');

    // 1. Search in-memory transactions
    let matchedTx = BankRepository.findMatchingTransaction((tx) => {
      if (tx.receivedAt < fifteenMinutesAgo) return false;
      const sanitizedMemo = this.sanitizeBankContent(tx.transactionContent).replace(/\s+/g, '');

      if (sanitizedOrderCode && sanitizedMemo.includes(sanitizedOrderCode)) {
        return true;
      }
      if (sanitizedOrderId && sanitizedMemo.includes(sanitizedOrderId)) {
        return true;
      }
      if (expectedAmount > 0 && Math.abs(tx.amountIn - expectedAmount) < 10 && sanitizedMemo.includes('KAME')) {
        return true;
      }
      return false;
    });

    // 2. Query SePay API if configured
    if (!matchedTx && apiKey) {
      try {
        const apiRes = await fetch('https://my.sepay.vn/userapi/transactions/list?limit=15', {
          headers: {
            Authorization: `Apikey ${apiKey}`,
            'Content-Type': 'application/json',
          },
        });
        if (apiRes.ok) {
          const apiData: any = await apiRes.json();
          const list = apiData?.transactions || [];
          for (const item of list) {
            const amount = Number(item.amount_in || item.amountIn || 0);
            const memo = String(item.transaction_content || item.description || '');
            const cleanMemo = this.sanitizeBankContent(memo).replace(/\s+/g, '');

            const isMatch =
              (sanitizedOrderCode && cleanMemo.includes(sanitizedOrderCode)) ||
              (sanitizedOrderId && cleanMemo.includes(sanitizedOrderId)) ||
              (expectedAmount > 0 && Math.abs(amount - expectedAmount) < 10 && cleanMemo.includes('KAME'));

            if (isMatch) {
              matchedTx = {
                id: String(item.id || item.reference_number || Date.now()),
                gateway: String(item.bank_brand_name || 'Sacombank'),
                accountNumber: String(item.account_number || ''),
                amountIn: amount,
                transactionDate: String(item.transaction_date || new Date().toISOString()),
                transactionContent: memo,
                referenceNumber: String(item.reference_number || item.id),
                matchedOrderCode: orderCode,
                receivedAt: Date.now(),
              };
              BankRepository.addTransaction(matchedTx);
              break;
            }
          }
        }
      } catch (apiErr) {
        console.warn('[BankPaymentService] SePay API call note:', apiErr);
      }
    }

    if (matchedTx) {
      return {
        success: true,
        paid: true,
        transaction: matchedTx,
      };
    }

    return {
      success: true,
      paid: false,
    };
  }

  public static simulateBankTransfer(orderCode: string, orderId: string, amount: number, tableName?: string) {
    const expectedAmount = Number(amount || 0);
    if (expectedAmount <= 0) {
      throw new AppValidationError('ME00005', ['Số tiền giả lập thanh toán', '1đ']);
    }

    const targetCode = orderCode || '#KM-01';
    const simulatedTx: BankTransactionRecord = {
      id: `SIM-FT${Date.now().toString().slice(-8)}`,
      gateway: 'Sacombank',
      accountNumber: 'SCMM9R7GUFDQJ3FFPB',
      amountIn: expectedAmount,
      transactionDate: new Date().toISOString(),
      transactionContent: `KAME ${tableName ? tableName + ' ' : ''}${targetCode.replace('#', '')} CHUYEN TIEN THANH TOAN`,
      referenceNumber: `FT${Date.now()}`,
      matchedOrderCode: targetCode,
      receivedAt: Date.now(),
    };

    BankRepository.addTransaction(simulatedTx);

    return {
      success: true,
      message: `Ngân hàng Sacombank đã báo có: +${expectedAmount.toLocaleString('vi-VN')}đ`,
      transaction: simulatedTx,
    };
  }

  public static getRecentTransactions(limit: number = 30) {
    return {
      success: true,
      transactions: BankRepository.getRecentTransactions(limit),
    };
  }
}
