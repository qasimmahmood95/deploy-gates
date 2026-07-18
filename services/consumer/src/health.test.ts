import { describe, expect, it } from 'vitest';
import { health } from './health.js';

describe('health', () => {
  it('reports the consumer as ok', () => {
    expect(health()).toEqual({ status: 'ok', service: 'consumer' });
  });
});
