# Self-host the Pact Broker instead of using PactFlow

- Status: accepted
- Date: 2026-07-18

## Context and Problem Statement

The compatibility gate needs a broker: the consumer publishes contracts to it,
the provider publishes verification results back, and `can-i-deploy` reads the
verification matrix to issue the release verdict. Should this repo use the
hosted SaaS (PactFlow) or self-host the open-source Pact Broker?

## Decision Drivers

- The repo must be **reproducible by any reviewer** with `docker compose up` —
  no accounts, tokens, or third-party signups.
- No secrets anywhere is an enforced invariant (gitleaks from M0); a SaaS token
  would be the repo's first real secret.
- The exhibit should show the _mechanics_ of contract gating, not vendor
  onboarding.
- CI runs must be self-contained and free.

## Considered Options

- Self-hosted Pact Broker (docker compose: broker + postgres)
- PactFlow (hosted SaaS)

## Decision Outcome

Chosen option: **self-hosted broker**, because it keeps the whole exhibit
inside the repository. The broker and its postgres run behind a compose
profile; CI starts them per run, ephemeral and disposable, with local-only
dummy credentials that are deliberately public. A reviewer can run the entire
gate — publish, verify, `can-i-deploy` — without creating an account anywhere,
and the repo keeps its zero-secrets invariant intact.

PactFlow is the right call in a real organisation — managed persistence,
auth/SSO, UI polish, webhooks — but every one of those strengths is friction
here: a signup wall between the reviewer and the exhibit, an API token to
manage as a secret, and state that outlives the CI run for no benefit. An
ephemeral broker per CI run also sidesteps stale-matrix confusion: every run
demonstrates the full publish→verify→can-i-deploy cycle from a clean slate.

### Consequences

- Good: `docker compose --profile pact up` is the entire setup; the gate is
  fully reproducible offline and in CI.
- Good: no secrets, no third-party coupling, no billing surface.
- Bad: no persistent verification matrix across runs — acceptable because each
  CI run re-establishes the full cycle, which is exactly what the exhibit needs
  to show.
- Bad: no PactFlow-only features (webhooks driving provider builds,
  cross-branch matrices). Noted in the README as the production trade-off.
