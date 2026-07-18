# Use k6 for the performance gate (autocannon stays in VaultChain)

- Status: accepted
- Date: 2026-07-18

## Context and Problem Statement

This repo needs a performance gate: load scenarios with SLO thresholds that fail
CI as hard pass/fail criteria. The sibling portfolio project (VaultChain)
already uses autocannon for throughput benchmarking. Should this repo reuse
autocannon, adopt k6, or carry both?

## Decision Drivers

- The gate needs scenario semantics (ramping load, a distinct spike phase) and
  built-in thresholds that turn SLO breaches into a non-zero exit.
- The repo is an exhibit: the tool choice should be legible to a reviewer in
  minutes.
- A portfolio should demonstrate breadth deliberately, not duplicate tooling in
  one repo.

## Considered Options

- k6
- autocannon
- Both in this repo, compared side by side

## Decision Outcome

Chosen option: k6, because thresholds and multi-scenario executors are built-in
primitives. `thresholds` on `p(95)` and error rate fail the process without
glue code, and `ramping-vus` scenarios express steady-vs-spike load directly.
The gate's pass/fail criteria live in the scenario definition rather than in a
wrapper script a reviewer has to trust.

autocannon remains the right tool where it lives (VaultChain). It is excellent
for quick single-endpoint throughput benchmarking, but scenario orchestration
and thresholds would need hand-rolled harness code, which is exactly the
machinery k6 ships natively. Carrying both tools here was rejected as scope
creep: this repo demonstrates gating architecture, not a load-tool comparison,
and the portfolio shows range better with each repo making one deliberate
choice.

### Consequences

- Good: the k6 script is the gate. Thresholds, scenarios, and exit behaviour
  are declared in one reviewable file (`k6/load.js`).
- Good: the portfolio demonstrates two tools across two repos, each fit for its
  purpose.
- Bad: k6 is a separate Go binary rather than an npm dependency, so CI installs
  it via an action and local runs need a native install.
