---
title: "Multi-tenancy by construction, Part 12: Audit every change, in the same transaction"
description: "Who changed what, when and why, for every tenant across every app: operation records from middleware, row diffs from a trigger, both written in the business transaction, and coverage enforced like RLS."
pubDate: 2026-12-03
heroImage: ../../assets/blog/generated/mt-audit.jpg
heroAlt: "A timeline of change records chained together, each stamped with an actor, flowing into a sealed archive"
tags: [multi-tenancy, saas, audit, postgres, compliance]
service: platform-engineering
series:
  id: multi-tenancy
  title: "Multi-tenancy by construction"
  part: 12
cta: multi-tenancy
---

A customer asks who deleted a document last Thursday. If the answer is "let me check the logs", you don't have an
audit trail. Logs are sampled, short-lived and, in practice, editable. Enterprise and regulated customers expect a
timeline they can search and export, and support needs the same thing to answer "what happened".

## All changes, not important ones

The first design question is whether to audit everything or only what matters. "What matters" is decided once, by
whoever writes the feature, and it's usually wrong in hindsight. The change nobody thought was important is the one
a customer asks about. Writes are a small fraction of traffic, so recording all of them is affordable.

So: every mutating operation, in the control plane and in every product service, produces an audit record. Reads
aren't audited, except reads an app declares sensitive (exports, downloads of personal data, impersonated reads) and
denied attempts.

## Two layers, one transaction

Application code knows the actor, the operation and the reason, but can forget to record. The database sees every
row change but doesn't know who or why. Change data capture from the write-ahead log sees everything but runs outside
the transaction and loses the request context. The design uses two layers and makes both transactional:

- **Operation records** from the request middleware: actor, impersonator, operation, target, outcome, reason and
  request id for every mutating operation. App code does nothing.
- **Change records** from a generic trigger on every tenant-owned table: the before/after diff of each row, tagged
  with the actor and request from the transaction settings the database helper already sets
  ([Part 2](/blog/multi-tenancy-row-level-security/)).

Both are written to an outbox table **in the same transaction as the change**. A change can't commit without its
record, and a record can't exist for a change that rolled back. A relay publishes the outbox to a JetStream stream,
and a platform audit service stores the records.

## "Why" is a field

Every operation accepts an optional reason, as a header or a body field. Staff actions, impersonated writes and bulk
operations require one. Jobs, webhooks and schedules record their **cause**: the parent request, the schedule, the
webhook event. A timeline entry can always be followed back to a person or a trigger.

## Coverage is enforced

Like RLS, audit coverage is checked rather than assumed:

- The migration gate fails if a tenant-owned table has no audit trigger. Opting out needs a declared reason, such as
  a derived or cache table.
- Every API operation declares `audit: auto`, `sensitive-read` or `skip(reason)`. Mutations default to `auto`.
- The cross-tenant harness ([Part 11](/blog/multi-tenancy-cross-tenant-test-harness/)) asserts that each mutation produced
  exactly one operation record with the right actor, impersonator and tenant, and that rolled-back calls produced
  none.

## Append-only and tamper-evident

The audit service stores records in a partitioned, append-only schema with a per-tenant hash chain, and archives
sealed days to object storage with object lock. Each tenant's archive is encrypted with its own key. That last part
is what makes erasure possible inside immutable storage: delete the key, and the tenant's history is unreadable
even though the objects remain.

## What it costs

Every write also writes outbox rows. Write-heavy tables need batching or an explicit opt-out. Diffs can contain
personal data, so fields must be redactable and the store has to honour erasure, which the per-tenant keys and
actor pseudonymisation handle. And it's one more stateful component with its own backup and restore test.

In return, one service gives every app a searchable "who changed what, when and why" per tenant, and no feature
anyone writes from now on can forget to be audited. That's the pattern this whole series has been about: make the
right thing structural, then check it in CI, so it holds for the code nobody has written yet.
