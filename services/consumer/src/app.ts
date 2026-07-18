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

      // Degrade gracefully: a recent-transaction status that is missing (404 ->
      // null) or that the provider can't serve right now (a thrown error) is
      // omitted from the overview rather than failing the whole aggregate. We
      // favour availability of the overview over completeness of this list.
      const statuses = await Promise.all(
        balances.recentTransactionIds.map((id) =>
          providerClient.getTransactionStatus(id).catch(() => null),
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
