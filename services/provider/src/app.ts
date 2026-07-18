import Fastify, { type FastifyInstance } from 'fastify';
import { accounts, transactions } from './fixtures.js';
import { health } from './health.js';

export function buildApp(): FastifyInstance {
  const app = Fastify({ logger: false });

  app.get('/health', async () => health());

  app.get<{ Params: { accountId: string } }>(
    '/balances/:accountId',
    async (request, reply) => {
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
      const transaction = transactions[request.params.id];
      if (!transaction) {
        return reply.status(404).send({ error: 'transaction not found' });
      }
      return transaction;
    },
  );

  return app;
}
