import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { PactV4, MatchersV3, SpecificationVersion } from '@pact-foundation/pact';
import { afterAll, describe, expect, it } from 'vitest';
import { createProviderClient } from '../../services/consumer/src/provider-client.js';

const { like, eachLike, string, regex } = MatchersV3;

// Amounts are decimal strings; the consumer requires that shape, so the
// contract asserts it with a regex rather than a bare type match.
const decimalString = (example: string) => regex('^\\d+\\.\\d+$', example);
const isoTimestamp = (example: string) =>
  regex('^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}\\.\\d{3}Z$', example);

const here = dirname(fileURLToPath(import.meta.url));

const pact = new PactV4({
  consumer: 'consumer',
  provider: 'provider',
  dir: resolve(here, '../pacts'),
  logLevel: 'warn',
  spec: SpecificationVersion.SPECIFICATION_VERSION_V4,
});

describe('consumer -> provider contract', () => {
  afterAll(() => {
    // Nothing to tear down; PactV4.executeTest manages the mock per interaction.
  });

  it('fetches balances for an existing account', async () => {
    await pact
      .addInteraction()
      .given('account acc-001 exists')
      .uponReceiving('a request for the balances of acc-001')
      .withRequest('GET', '/balances/acc-001')
      .willRespondWith(200, (b) => {
        b.headers({ 'Content-Type': 'application/json' });
        b.jsonBody({
          accountId: string('acc-001'),
          asOf: isoTimestamp('2026-07-01T00:00:00.000Z'),
          balances: eachLike({
            asset: string('BTC'),
            amount: decimalString('1.25000000'),
          }),
          recentTransactionIds: eachLike('tx-1001'),
        });
      })
      .executeTest(async (mockServer) => {
        const client = createProviderClient(mockServer.url);
        const balances = await client.getBalances('acc-001');
        expect(balances).not.toBeNull();
        expect(balances?.accountId).toBe('acc-001');
        expect(balances?.balances[0]).toEqual({ asset: 'BTC', amount: '1.25000000' });
        expect(balances?.recentTransactionIds).toEqual(['tx-1001']);
      });
  });

  it('returns null when the account is unknown', async () => {
    await pact
      .addInteraction()
      .given('account acc-999 does not exist')
      .uponReceiving('a request for the balances of a missing account')
      .withRequest('GET', '/balances/acc-999')
      .willRespondWith(404, (b) => {
        b.headers({ 'Content-Type': 'application/json' });
        b.jsonBody({ error: like('account not found') });
      })
      .executeTest(async (mockServer) => {
        const client = createProviderClient(mockServer.url);
        expect(await client.getBalances('acc-999')).toBeNull();
      });
  });

  it('fetches the status of an existing transaction', async () => {
    await pact
      .addInteraction()
      .given('transaction tx-1002 exists with status pending')
      .uponReceiving('a request for the status of tx-1002')
      .withRequest('GET', '/transactions/tx-1002/status')
      .willRespondWith(200, (b) => {
        b.headers({ 'Content-Type': 'application/json' });
        b.jsonBody({
          transactionId: string('tx-1002'),
          status: regex('pending|confirmed|failed', 'pending'),
          updatedAt: isoTimestamp('2026-06-30T18:30:00.000Z'),
        });
      })
      .executeTest(async (mockServer) => {
        const client = createProviderClient(mockServer.url);
        const status = await client.getTransactionStatus('tx-1002');
        expect(status).toEqual({
          transactionId: 'tx-1002',
          status: 'pending',
          updatedAt: '2026-06-30T18:30:00.000Z',
        });
      });
  });
});
