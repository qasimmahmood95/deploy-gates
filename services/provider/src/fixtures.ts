import type { AccountBalances, TransactionStatus } from './types.js';

// Fixed timestamps keep responses deterministic, which matters once these
// payloads become contract examples (M2).
export const accounts: Record<string, AccountBalances> = {
  'acc-001': {
    accountId: 'acc-001',
    asOf: '2026-07-01T00:00:00.000Z',
    balances: [
      { asset: 'BTC', amount: '1.25000000' },
      { asset: 'ETH', amount: '10.50000000' },
      { asset: 'USDC', amount: '25000.00000000' },
    ],
    recentTransactionIds: ['tx-1001', 'tx-1002'],
  },
  'acc-002': {
    accountId: 'acc-002',
    asOf: '2026-07-01T00:00:00.000Z',
    balances: [{ asset: 'BTC', amount: '0.05000000' }],
    recentTransactionIds: ['tx-1003'],
  },
};

export const transactions: Record<string, TransactionStatus> = {
  'tx-1001': {
    transactionId: 'tx-1001',
    status: 'confirmed',
    updatedAt: '2026-06-30T12:00:00.000Z',
  },
  'tx-1002': {
    transactionId: 'tx-1002',
    status: 'pending',
    updatedAt: '2026-06-30T18:30:00.000Z',
  },
  'tx-1003': {
    transactionId: 'tx-1003',
    status: 'failed',
    updatedAt: '2026-06-29T09:15:00.000Z',
  },
};
