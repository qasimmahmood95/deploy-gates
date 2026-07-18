/** Amounts are decimal strings, never floats — this is a custody-style API. */
export interface AssetBalance {
  asset: string;
  amount: string;
}

export interface AccountBalances {
  accountId: string;
  asOf: string;
  balances: AssetBalance[];
  recentTransactionIds: string[];
}

export type TransactionState = 'pending' | 'confirmed' | 'failed';

export interface TransactionStatus {
  transactionId: string;
  status: TransactionState;
  updatedAt: string;
}
