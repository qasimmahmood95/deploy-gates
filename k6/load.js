import http from 'k6/http';
import { check } from 'k6';

// The performance gate targets the provider directly (its latency is the SLO
// subject). Everything is overridable via env so the gate can be re-pointed or
// deliberately tightened to demonstrate a red run.
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3001';
const P95_MS = Number(__ENV.P95_MS || 250);
const ERROR_RATE = Number(__ENV.ERROR_RATE || 0.01);

// Only 200-returning endpoints, so http_req_failed reflects real errors rather
// than expected 404s.
const ENDPOINTS = [
  '/balances/acc-001',
  '/balances/acc-002',
  '/transactions/tx-1002/status',
];

export const options = {
  scenarios: {
    // Steady load: ramp to a sustained level and hold.
    steady: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '15s', target: 20 },
        { duration: '30s', target: 20 },
        { duration: '15s', target: 0 },
      ],
      gracefulRampDown: '5s',
      exec: 'hitProvider',
      tags: { scenario: 'steady' },
    },
    // Spike: a sharp burst after the steady phase, to test behaviour under a
    // sudden surge rather than a gradual ramp.
    spike: {
      executor: 'ramping-vus',
      startTime: '60s',
      startVUs: 0,
      stages: [
        { duration: '5s', target: 100 },
        { duration: '10s', target: 100 },
        { duration: '5s', target: 0 },
      ],
      gracefulRampDown: '5s',
      exec: 'hitProvider',
      tags: { scenario: 'spike' },
    },
  },
  // Thresholds are the gate: a breach makes k6 exit non-zero and fails CI.
  thresholds: {
    http_req_failed: [`rate<${ERROR_RATE}`],
    http_req_duration: [`p(95)<${P95_MS}`],
  },
};

export function hitProvider() {
  const path = ENDPOINTS[Math.floor(Math.random() * ENDPOINTS.length)];
  const res = http.get(`${BASE_URL}${path}`);
  check(res, {
    'status is 200': (r) => r.status === 200,
    'has json body': (r) =>
      String(r.headers['Content-Type']).includes('application/json'),
  });
}
