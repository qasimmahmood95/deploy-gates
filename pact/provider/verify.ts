import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import type { AddressInfo } from 'node:net';
import { Verifier, type VerifierOptions } from '@pact-foundation/pact';
import { buildApp } from '../../services/provider/src/app.js';

const here = dirname(fileURLToPath(import.meta.url));

/**
 * Provider states declared by the consumer contract. Our provider is backed by
 * static fixtures that already satisfy every state (acc-001 and tx-1002 exist,
 * acc-999 never does), so these handlers are assertions of intent rather than
 * data seeding. A stateful provider would seed/reset its store here instead.
 */
const stateHandlers = {
  'account acc-001 exists': async () => {
    // Fixture-backed; nothing to seed.
  },
  'account acc-999 does not exist': async () => {
    // Fixture-backed; acc-999 is intentionally absent.
  },
  'transaction tx-1002 exists with status pending': async () => {
    // Fixture-backed; nothing to seed.
  },
};

async function main(): Promise<void> {
  const app = buildApp();
  // Ephemeral port avoids clashing with a locally running provider.
  await app.listen({ port: 0, host: '127.0.0.1' });
  const { port } = app.server.address() as AddressInfo;

  const base: VerifierOptions = {
    provider: 'provider',
    providerBaseUrl: `http://127.0.0.1:${port}`,
    stateHandlers,
    logLevel: 'warn',
  };

  const brokerUrl = process.env.PACT_BROKER_BASE_URL;
  const branch = process.env.GIT_BRANCH;

  let options: VerifierOptions;
  if (brokerUrl) {
    // Broker mode (CI): pull the contract from the broker and publish the
    // pass/fail back so can-i-deploy can read it.
    options = {
      ...base,
      pactBrokerUrl: brokerUrl,
      publishVerificationResult: process.env.CI === 'true',
      providerVersion: process.env.GIT_COMMIT_SHA ?? 'dev',
      // Verify the consumer contract published from this same branch so a PR
      // verifies its own contract, not main's.
      consumerVersionSelectors: branch ? [{ branch }] : [{ mainBranch: true }],
      ...(process.env.PACT_BROKER_USERNAME
        ? { pactBrokerUsername: process.env.PACT_BROKER_USERNAME }
        : {}),
      ...(process.env.PACT_BROKER_PASSWORD
        ? { pactBrokerPassword: process.env.PACT_BROKER_PASSWORD }
        : {}),
      ...(branch ? { providerVersionBranch: branch } : {}),
    };
  } else {
    // Local mode: verify the contract the consumer test just generated.
    options = { ...base, pactUrls: [resolve(here, '../pacts/consumer-provider.json')] };
  }

  try {
    const output = await new Verifier(options).verifyProvider();
    console.log('Pact verification complete:\n', output);
  } finally {
    await app.close();
  }
}

main().catch((err) => {
  console.error('Pact verification failed:\n', err);
  process.exit(1);
});
