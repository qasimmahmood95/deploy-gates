# deploy-gates

> **Work in progress** — built milestone by milestone; the full README lands with M5.

A showcase of **release gating as a unified concept**: a deploy is allowed only when
two independent, required CI gates are green —

1. **Compatibility gate** — Pact consumer-driven contracts, verified via a
   self-hosted Pact Broker and `can-i-deploy`
2. **Performance gate** — k6 scenario load tests with SLO thresholds as hard
   pass/fail criteria

The thesis: contract verification and performance thresholds are the same kind of
object — machine-checkable answers to "is this build safe to release?" — and belong
in the same gating architecture.

## Status

- [x] M0 — Scaffold (workspaces, lint/typecheck/test, secret scanning, CI skeleton)
- [x] M1 — Services (provider + consumer)
- [x] M2 — Compatibility gate (Pact)
- [x] M3 — Performance gate (k6)
- [x] M4 — The unified deploy gate
- [ ] M5 — Planted defects, ADRs, full README

## Development

Requires Node >= 22.

```sh
npm ci
npm run lint
npm run typecheck
npm run test
```

To run the full stack (provider on :3001, consumer on :3000):

```sh
docker compose up --build
curl http://localhost:3000/accounts/acc-001/overview
```

### Compatibility gate (Pact)

The consumer's expectations of the provider are pinned as a Pact contract. The
consumer test generates the contract; the provider verifies it satisfies it.

```sh
npm run test:pact     # consumer test -> generates the contract in pact/pacts/
npm run pact:verify   # provider verifies it against the generated contract
```

In CI these run against a self-hosted **Pact Broker** (behind the `pact` compose
profile): the contract is published, the provider verification result is
published back, and `can-i-deploy` reads both to decide whether the pair is safe
to release — that `can-i-deploy` check is the gate. Broker credentials in
`docker-compose.yml` are local/CI-only defaults, not secrets.

### Performance gate (k6)

Two [k6](https://k6.io) scenarios run against the provider — a steady ramping load
and a spike — with thresholds on p95 latency and error rate. A breach makes k6 exit
non-zero, which fails CI: the thresholds _are_ the gate.

```sh
k6 run k6/load.js                 # against a locally running provider on :3001
P95_MS=1 k6 run k6/load.js        # tighten the p95 threshold to force a red run
```

The steady scenario carries the primary SLO; the spike is a looser resilience check
(`SPIKE_P95_MS`, `SPIKE_ERROR_RATE`) so burst noise can't flake it. All thresholds and
the target are overridable via env (`BASE_URL`, `P95_MS`, `ERROR_RATE`, `SPIKE_*`), so
the gate can be re-pointed or deliberately tightened. M5 adds a committed red run via
the `defect/perf-regression` branch.

Secret scanning is enforced by [gitleaks](https://github.com/gitleaks/gitleaks) — as
a pre-commit hook locally (install gitleaks to enable it) and as a required CI job.

## The unified deploy gate

Both gates are just CI jobs, so the deploy is expressed as a job that **depends on
both** (alongside the rest of the board):

```yaml
deploy:
  needs: [checks, compose-smoke, compatibility-gate, performance-gate, secret-scan]
```

With GitHub Actions' default `needs` semantics, `deploy` runs only when every job it
needs succeeds. If either the compatibility gate or the performance gate is red, the
`deploy` job never runs — the gate is genuinely blocking, not decorative. The two
release gates are the headline dependency; the other jobs are there because a real
deploy shouldn't ship a build with failing tests or a leaked secret either.

A separate `gate status summary` job runs `if: always()` and writes both gate verdicts
side by side to the run's job summary, so a red run shows exactly which gate blocked the
deploy.

`deploy` deliberately runs on every green build, pull requests included, so that a red
gate visibly skips it (that's how M5's defect branches demonstrate the block). A real
pipeline would additionally guard the deploy to `main` with
`if: github.event_name == 'push' && github.ref == 'refs/heads/main'` — here it stays
open so the gating is observable on branches.

### Branch protection

To make the gates enforce on `main`, mark them as **required status checks** in the
repository's branch-protection rule (Settings → Branches → branch protection for
`main`):

- `compatibility gate (pact)`
- `performance gate (k6)`
- `lint / typecheck / test`
- `secret scan (gitleaks)`

With these required, a PR cannot merge unless every gate is green, and the `deploy`
job cannot run for a build that hasn't passed both gates.

## License

[MIT](LICENSE)
