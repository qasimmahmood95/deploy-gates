import type { ProviderBalances, ProviderTransactionStatus } from './types.js';

export interface ProviderClient {
  getBalances(accountId: string): Promise<ProviderBalances | null>;
  getTransactionStatus(transactionId: string): Promise<ProviderTransactionStatus | null>;
}

export class ProviderRequestError extends Error {
  constructor(path: string, status: number) {
    super(`provider request failed: GET ${path} -> ${status}`);
    this.name = 'ProviderRequestError';
  }
}

/** null means "not found"; any other non-2xx response is an error. */
async function getJson<T>(baseUrl: string, path: string): Promise<T | null> {
  const res = await fetch(new URL(path, baseUrl));
  if (res.status === 404) return null;
  if (!res.ok) throw new ProviderRequestError(path, res.status);
  return (await res.json()) as T;
}

export function createProviderClient(baseUrl: string): ProviderClient {
  return {
    getBalances: (accountId) => getJson(baseUrl, `/balances/${accountId}`),
    getTransactionStatus: (transactionId) =>
      getJson(baseUrl, `/transactions/${transactionId}/status`),
  };
}
