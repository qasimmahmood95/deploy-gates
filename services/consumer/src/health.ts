export interface HealthStatus {
  status: 'ok';
  service: string;
}

export function health(): HealthStatus {
  return { status: 'ok', service: 'consumer' };
}
