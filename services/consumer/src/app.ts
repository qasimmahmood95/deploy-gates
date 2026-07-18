import Fastify, { type FastifyInstance } from 'fastify';
import { health } from './health.js';
import type { ProviderClient } from './provider-client.js';
import type { AccountOverview, ProviderTransactionStatus } from './types.js';

export interface AppOptions {
  providerClient: ProviderClient;
}

export function buildApp({ providerClient }: AppOptions): FastifyInstance {
  const app = Fastify({ logger: false });

  app.get('/health', async () => health());

  app.get<{ Params: { accountId: string } }>(
    '/accounts/:accountId/overview',
    async (request, reply) => {
      const balances = await providerClient.getBalances(request.params.accountId);
      if (!balances) {
        return reply.status(404).send({ error: 'account not found' });
      }

      const statuses = await Promise.all(
        balances.recentTransactionIds.map((id) =>
          providerClient.getTransactionStatus(id),
        ),
      );

      const overview: AccountOverview = {
        accountId: balances.accountId,
        asOf: balances.asOf,
        assetCount: balances.balances.length,
        balances: balances.balances,
        recentTransactions: statuses.filter(
          (s): s is ProviderTransactionStatus => s !== null,
        ),
      };
      return overview;
    },
  );

  return app;
}
