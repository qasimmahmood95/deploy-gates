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
- [ ] M2 — Compatibility gate (Pact)
- [ ] M3 — Performance gate (k6)
- [ ] M4 — The unified deploy gate
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

Secret scanning is enforced by [gitleaks](https://github.com/gitleaks/gitleaks) — as
a pre-commit hook locally (install gitleaks to enable it) and as a required CI job.

## License

[MIT](LICENSE)
