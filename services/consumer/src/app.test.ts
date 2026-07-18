import { describe, expect, it } from 'vitest';
import { buildApp } from './app.js';
import type { ProviderClient } from './provider-client.js';
import type { ProviderBalances, ProviderTransactionStatus } from './types.js';

const balances: ProviderBalances = {
  accountId: 'acc-001',
  asOf: '2026-07-01T00:00:00.000Z',
  balances: [
    { asset: 'BTC', amount: '1.25000000' },
    { asset: 'ETH', amount: '10.50000000' },
  ],
  recentTransactionIds: ['tx-1001', 'tx-1002'],
};

const statuses: Record<string, ProviderTransactionStatus> = {
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
};

function stubClient(): ProviderClient {
  return {
    getBalances: async (accountId) => (accountId === 'acc-001' ? balances : null),
    getTransactionStatus: async (id) => statuses[id] ?? null,
  };
}

describe('consumer app', () => {
  it('reports health', async () => {
    const app = buildApp({ providerClient: stubClient() });
    const res = await app.inject({ method: 'GET', url: '/health' });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ status: 'ok', service: 'consumer' });
  });

  it('aggregates balances and transaction statuses into an overview', async () => {
    const app = buildApp({ providerClient: stubClient() });
    const res = await app.inject({ method: 'GET', url: '/accounts/acc-001/overview' });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({
      accountId: 'acc-001',
      asOf: '2026-07-01T00:00:00.000Z',
      assetCount: 2,
      balances: balances.balances,
      recentTransactions: [statuses['tx-1001'], statuses['tx-1002']],
    });
  });

  it('404s when the provider does not know the account', async () => {
    const app = buildApp({ providerClient: stubClient() });
    const res = await app.inject({ method: 'GET', url: '/accounts/acc-999/overview' });
    expect(res.statusCode).toBe(404);
    expect(res.json()).toEqual({ error: 'account not found' });
  });

  it('omits transactions the provider no longer knows', async () => {
    const client = stubClient();
    client.getTransactionStatus = async (id) =>
      id === 'tx-1001' ? statuses['tx-1001']! : null;
    const app = buildApp({ providerClient: client });
    const res = await app.inject({ method: 'GET', url: '/accounts/acc-001/overview' });
    expect(res.statusCode).toBe(200);
    expect(res.json().recentTransactions).toEqual([statuses['tx-1001']]);
  });

  it('degrades instead of 500ing when a status lookup fails', async () => {
    const client = stubClient();
    client.getTransactionStatus = async (id) => {
      if (id === 'tx-1002') throw new Error('provider unavailable');
      return statuses[id] ?? null;
    };
    const app = buildApp({ providerClient: client });
    const res = await app.inject({ method: 'GET', url: '/accounts/acc-001/overview' });
    expect(res.statusCode).toBe(200);
    expect(res.json().recentTransactions).toEqual([statuses['tx-1001']]);
  });
});
