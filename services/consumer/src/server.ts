import { buildApp } from './app.js';
import { createProviderClient } from './provider-client.js';

const port = Number(process.env.PORT ?? 3000);
const providerBaseUrl = process.env.PROVIDER_BASE_URL ?? 'http://localhost:3001';

const app = buildApp({ providerClient: createProviderClient(providerBaseUrl) });

app.listen({ port, host: '0.0.0.0' }).catch((err) => {
  console.error(err);
  process.exit(1);
});
