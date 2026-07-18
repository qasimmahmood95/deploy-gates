# Gates are CI jobs wired with `needs`, not steps in a deploy script

- Status: accepted
- Date: 2026-07-18

## Context and Problem Statement

Both gates must block the deploy. That could be expressed two ways: a single
deploy script that runs contract verification and load tests inline and exits
early on failure, or separate CI jobs with the deploy job declaring `needs` on
both gates. Which architecture makes the gating trustworthy and legible?

## Decision Drivers

- Gates must be **independently visible**: a reviewer (or an incident
  retrospective) should see _which_ gate blocked a release at a glance.
- Gates must be **independently enforceable**: branch protection operates on
  status checks, i.e. on jobs — not on lines inside a script.
- Gates should run **in parallel**; they share no state.
- A gate you can quietly skip is decorative, not blocking.

## Considered Options

- Gates as separate CI jobs; deploy declares `needs` on both
- Gates as sequential steps inside one deploy script/job

## Decision Outcome

Chosen option: **gates as jobs**, because the platform then enforces what a
script would merely promise. With `needs: [compatibility-gate,
performance-gate, ...]`, the deploy job cannot start unless every gate
succeeded — that is scheduler semantics, not code someone can `|| true` around.
Each gate surfaces as its own named status check, which is precisely the unit
branch protection requires, so the same objects gate both the deploy job and
the merge to main. Failures are attributable without reading logs: the red job
_is_ the diagnosis, and the always-on summary job renders both verdicts side by
side.

The script approach couples unrelated failures into one opaque exit code,
serialises independent work, and — decisively — cannot be marked as a required
status check per gate. It also invites the quiet bypass: a script edit can skip
a gate without any visible change in the pipeline's shape, whereas removing a
`needs` edge is a reviewable one-line diff in the workflow.

This mirrors the repo's thesis: contract verification and performance
thresholds are the same kind of object — a machine-checkable release verdict —
so they get the same architectural treatment: one job per verdict, one `needs`
edge per enforcement.

### Consequences

- Good: platform-enforced blocking (`needs`), per-gate attribution, parallel
  execution, branch-protection integration for free.
- Good: adding a third gate (e.g. a security scan) is one job plus one `needs`
  entry — the architecture generalises.
- Bad: job-level isolation means each gate pays its own setup cost (checkout,
  compose up). Accepted: the gates stay independent and total CI time remains
  well under the ten-minute budget.
