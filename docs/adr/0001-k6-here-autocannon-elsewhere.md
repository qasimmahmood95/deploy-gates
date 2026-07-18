# Use k6 for the performance gate (autocannon stays in VaultChain)

- Status: accepted
- Date: 2026-07-18

## Context and Problem Statement

This repo needs a performance gate: load scenarios with SLO thresholds that fail
CI as hard pass/fail criteria. The sibling portfolio project (VaultChain)
already uses autocannon for throughput benchmarking. Should this repo reuse
autocannon, or adopt k6 — and should it ever carry both?

## Decision Drivers

- The gate needs **scenario semantics** (ramping load, a distinct spike phase)
  and **first-class thresholds** that turn SLO breaches into a non-zero exit.
- The repo is an exhibit: the tool choice should be legible to a reviewer in
  minutes.
- A portfolio should demonstrate breadth deliberately, not duplicate tooling in
  one repo.

## Considered Options

- k6
- autocannon
- Both in this repo, compared side by side

## Decision Outcome

Chosen option: **k6**, because thresholds and multi-scenario executors are
built-in primitives — `thresholds` on `p(95)` and error rate fail the process
without glue code, and `ramping-vus` scenarios express steady-vs-spike load
directly. That makes the gate's pass/fail criteria part of the scenario
definition rather than a wrapper script a reviewer has to trust.

autocannon remains the right tool where it lives (VaultChain): it is excellent
for quick single-endpoint throughput benchmarking, but scenario orchestration
and thresholds would need hand-rolled harness code — exactly the machinery k6
ships natively. Carrying both tools here was rejected as scope creep: this repo
demonstrates _gating architecture_, not a load-tool comparison, and the
portfolio shows range better with each repo making one deliberate choice.

### Consequences

- Good: the k6 script _is_ the gate — thresholds, scenarios, and exit behaviour
  are declared in one reviewable file (`k6/load.js`).
- Good: the portfolio demonstrates two tools across two repos, each fit for its
  purpose.
- Bad: k6 is a separate Go binary rather than an npm dependency, so CI installs
  it via an action and local runs need a native install.
