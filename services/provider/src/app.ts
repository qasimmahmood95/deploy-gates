import Fastify, { type FastifyInstance } from 'fastify';
import { setTimeout as sleep } from 'node:timers/promises';
import { accounts, transactions } from './fixtures.js';
import { health } from './health.js';

// DEFECT (defect/perf-regression): simulates a slow downstream dependency
// (e.g. an unindexed lookup or a chatty upstream call) added to the data
// endpoints. Functionally everything still works: unit tests, contract
// verification, and the compose smoke all stay green. Only the k6 SLO
// thresholds (steady p95 < 250ms) catch it, turning the performance gate red.
const ARTIFICIAL_LATENCY_MS = 350;

export function buildApp(): FastifyInstance {
  const app = Fastify({ logger: false });

  app.get('/health', async () => health());

  app.get<{ Params: { accountId: string } }>(
    '/balances/:accountId',
    async (request, reply) => {
      await sleep(ARTIFICIAL_LATENCY_MS);
      const account = accounts[request.params.accountId];
      if (!account) {
        return reply.status(404).send({ error: 'account not found' });
      }
      return account;
    },
  );

  app.get<{ Params: { id: string } }>(
    '/transactions/:id/status',
    async (request, reply) => {
      await sleep(ARTIFICIAL_LATENCY_MS);
      const transaction = transactions[request.params.id];
      if (!transaction) {
        return reply.status(404).send({ error: 'transaction not found' });
      }
      return transaction;
    },
  );

  return app;
}
