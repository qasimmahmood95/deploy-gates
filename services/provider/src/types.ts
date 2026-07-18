/** Amounts are decimal strings, never floats. This is a custody-style API. */
export interface AssetBalance {
  asset: string;
  amount: string;
}

export interface AccountBalances {
  // DEFECT (defect/contract-break): renamed from `accountId` to `id`. The
  // provider and its own tests stay internally consistent, but this silently
  // breaks the consumer's published Pact contract, which only the
  // compatibility gate catches.
  id: string;
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
