# CLAUDE.md — deploy-gates

## What this project is

A portfolio showcase repo demonstrating **release gating as a unified concept**: a
deploy is allowed only when two independent, required CI gates are green —

1. **Compatibility gate** — Pact consumer-driven contracts, verified via a
   self-hosted Pact Broker and `can-i-deploy`
2. **Performance gate** — k6 scenario load tests with SLO thresholds as
   hard pass/fail criteria

The thesis: contract verification and performance thresholds are the same kind of
object — machine-checkable answers to "is this build safe to release?" — and belong
in the same gating architecture.

Audience: hiring managers and senior engineers in regulated fintech reviewing
this as evidence of test-architecture judgment. Every decision should survive an
interview follow-up question.

The repo is **public from day one** — the commit history and CI runs are part
of the exhibit. Write every commit, PR description, and CI log as if a
reviewer is watching, because they may be. (It is not linked from the profile
README until M5 completes; that is handled outside this repo.)

## What this project is NOT

- Not a product. The consumer and provider services are deliberately minimal
  (2–3 endpoints each). If a service grows features that don't serve the gating
  story, that's scope creep — stop.
- Not a Pact tutorial or a k6 tutorial. Assume the reader knows the tools;
  showcase the *architecture*.
- Not a load-tool comparison. Do NOT add autocannon (or any second load tool)
  to this repo — k6 is the only performance tool here. autocannon lives in
  VaultChain and is addressed in this repo only via ADR.
- No real money, keys, or crypto. The provider is a fictional, simplified
  read-only facade in the style of a digital-asset custody API (balances,
  transaction status). It references VaultChain in the README as sibling work
  but has no code dependency on it.

## Stack and conventions

- **Language:** TypeScript throughout, strict mode, ESM
- **Services:** Fastify for both consumer (thin BFF-style client service) and
  provider. SQLite or in-memory fixtures only — no external databases.
- **Contract layer:** Pact JS (consumer tests), Pact Broker self-hosted via
  `docker-compose` (broker + postgres), provider verification with published
  results, `can-i-deploy` in CI
- **Performance layer:** k6 (JS scenarios in `k6/`), scenario-based executors
  (ramping-vus for load, a spike scenario), thresholds on p95 latency and
  error rate. Thresholds fail the process — that IS the gate.
- **CI:** GitHub Actions. The deploy workflow has a fake `deploy` job that
  requires BOTH gate jobs. Gates must be genuinely blocking (job dependencies
  + required checks), not decorative.
- **Lint/format/test:** eslint + prettier, vitest for unit tests of the
  services themselves. All checks runnable locally via npm scripts and
  reproducible in CI.
- **Commits:** conventional commits, imperative mood, scoped
  (e.g. `feat(pact): add provider verification workflow`)
- **Docs:** ADRs in `docs/adr/` using MADR format. README written last,
  against the finished repo, not aspirationally.

## Repository layout

```
deploy-gates/
├── services/
│   ├── provider/          # custody-facade API (Fastify)
│   └── consumer/          # client service (Fastify)
├── pact/                  # consumer contract tests + verification config
├── k6/                    # load scenarios + threshold config
├── docker-compose.yml     # pact broker + services for local runs
├── .github/workflows/     # gate + deploy pipelines
└── docs/
    ├── adr/
    └── img/               # CI screenshots for README
```

## Quality gates for the build itself

Every milestone must pass before merge to main:

- `npm run lint`, `npm run typecheck`, `npm run test` all green
- CI green on the milestone PR
- No secrets anywhere (there should be none needed; broker creds are local
  docker defaults, clearly marked as such) — enforced by the gitleaks
  pre-commit hook and CI job from M0 onward
- Use a code-review subagent before opening each milestone PR; use a separate
  verification pass to run the full local stack (`docker-compose up` →
  contract tests → k6 smoke) end-to-end

## Milestones

### M0 — Scaffold
Repo init, workspace layout (npm workspaces for the two services), TS/eslint/
prettier/vitest config, CI skeleton running lint+typecheck+test, README stub,
LICENSE (MIT), conventional-commit tooling, and **gitleaks** as both a
pre-commit hook and a required CI job — the no-secrets invariant is enforced
from the first commit, not assumed.
**Done when:** empty-ish repo with all checks (including secret scan) green in CI.

### M1 — Services
Provider: 2–3 endpoints (e.g. `GET /balances/:accountId`,
`GET /transactions/:id/status`) with typed responses and fixture data.
Consumer: a service that calls the provider and exposes one aggregate endpoint.
Unit tests for both. Dockerfiles + compose entries.
**Done when:** `docker-compose up` serves both; vitest green.

### M2 — Compatibility gate (Pact)
Consumer pact tests generating contracts; broker in compose; publish step;
provider verification with state handlers; `can-i-deploy` wired into CI as a
required job. Include broker screenshots in `docs/img/`.
**Done when:** contract change on a branch turns the gate red in CI.

### M3 — Performance gate (k6)
Scenario scripts against the provider (steady load + spike), thresholds
(p95 < target, error rate < 1%) that fail CI on breach. Runs against the
composed stack in CI. Keep durations CI-friendly (minutes, not hours).
**Done when:** thresholds demonstrably pass on main and fail when tightened.

### M4 — The unified deploy gate
Deploy workflow: fake `deploy` job (echo + artifact) that depends on both gate
jobs; branch protection notes in README; a gate-status summary posted to the
job summary (GitHub step summary) showing both verdicts side by side.
**Done when:** deploy job provably skipped/blocked when either gate is red.

### M5 — Planted defects, ADRs, README
Two long-lived branches:
- `defect/contract-break` — provider renames a response field → Pact gate red
- `defect/perf-regression` — artificial latency in the provider → k6 gate red
Each with a red CI run linked from the README.
ADRs: (1) why k6 here vs autocannon elsewhere in the portfolio; (2) why a
self-hosted broker vs PactFlow; (3) why gates are jobs, not scripts.
Full README: thesis, architecture diagram, gate walkthrough, defect-branch
evidence links.
**Done when:** a reviewer can understand and verify the whole thesis from the
README alone in under five minutes.

## Instructions for Claude Code

- Work milestone by milestone; one PR per milestone; don't start M(n+1) until
  M(n) is merged.
- Prefer boring, readable code over clever code — this repo is read more than
  it is run.
- If a decision has more than one defensible option, make the call, note it in
  an ADR if significant, and move on. Do not block on questions unless a
  choice would be expensive to reverse.
- Never commit generated pact files with machine-specific paths; keep contract
  output deterministic.
- Keep CI total runtime under ~10 minutes so the gates feel usable, not
  theatrical.
