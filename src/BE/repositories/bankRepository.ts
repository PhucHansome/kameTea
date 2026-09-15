import { BankTransactionRecord } from '../../shared/types';

export class BankRepository {
  private static confirmedBankTransactions: BankTransactionRecord[] = [];

  public static addTransaction(tx: BankTransactionRecord): void {
    this.confirmedBankTransactions.unshift(tx);
    if (this.confirmedBankTransactions.length > 200) {
      this.confirmedBankTransactions.pop();
    }
  }

  public static getRecentTransactions(limit: number = 30): BankTransactionRecord[] {
    return this.confirmedBankTransactions.slice(0, limit);
  }

  public static findMatchingTransaction(predicate: (tx: BankTransactionRecord) => boolean): BankTransactionRecord | undefined {
    return this.confirmedBankTransactions.find(predicate);
  }
}
