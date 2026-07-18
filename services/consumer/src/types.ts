// The consumer defines its own view of the provider's responses. This is the
// contract surface that Pact will formalize in M2.
export interface AssetBalance {
  asset: string;
  amount: string;
}

export interface ProviderBalances {
  accountId: string;
  asOf: string;
  balances: AssetBalance[];
  recentTransactionIds: string[];
}

export interface ProviderTransactionStatus {
  transactionId: string;
  status: 'pending' | 'confirmed' | 'failed';
  updatedAt: string;
}

export interface AccountOverview {
  accountId: string;
  asOf: string;
  assetCount: number;
  balances: AssetBalance[];
  recentTransactions: ProviderTransactionStatus[];
}
