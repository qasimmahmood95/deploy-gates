import { describe, expect, it } from 'vitest';
import { buildApp } from './app.js';

describe('provider app', () => {
  it('reports health', async () => {
    const app = buildApp();
    const res = await app.inject({ method: 'GET', url: '/health' });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ status: 'ok', service: 'provider' });
  });

  it('returns balances for a known account', async () => {
    const app = buildApp();
    const res = await app.inject({ method: 'GET', url: '/balances/acc-001' });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.accountId).toBe('acc-001');
    expect(body.balances).toContainEqual({ asset: 'BTC', amount: '1.25000000' });
    expect(body.recentTransactionIds).toEqual(['tx-1001', 'tx-1002']);
  });

  it('404s for an unknown account', async () => {
    const app = buildApp();
    const res = await app.inject({ method: 'GET', url: '/balances/acc-999' });
    expect(res.statusCode).toBe(404);
    expect(res.json()).toEqual({ error: 'account not found' });
  });

  it('returns status for a known transaction', async () => {
    const app = buildApp();
    const res = await app.inject({ method: 'GET', url: '/transactions/tx-1002/status' });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({
      transactionId: 'tx-1002',
      status: 'pending',
      updatedAt: '2026-06-30T18:30:00.000Z',
    });
  });

  it('404s for an unknown transaction', async () => {
    const app = buildApp();
    const res = await app.inject({ method: 'GET', url: '/transactions/tx-999/status' });
    expect(res.statusCode).toBe(404);
    expect(res.json()).toEqual({ error: 'transaction not found' });
  });
});
