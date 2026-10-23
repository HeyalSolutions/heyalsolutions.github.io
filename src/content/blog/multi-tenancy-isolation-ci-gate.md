---
title: "Multi-tenancy by construction, Part 3: A CI gate that fails when a table can leak"
description: "Row-Level Security only protects the tables that have it. A migration gate that checks every table, view, function and unique index, and the four ways isolation quietly breaks."
pubDate: 2026-11-03
heroImage: ../../assets/blog/generated/mt-gate.jpg
heroAlt: "A row of table icons passing through a checkpoint, with one held back and marked in amber"
tags: [multi-tenancy, saas, postgres, security, ci]
service: platform-engineering
series:
  id: multi-tenancy
  title: "Multi-tenancy by construction"
  part: 3
cta: multi-tenancy
---

[Part 2](/blog/multi-tenancy-row-level-security/) put Row-Level Security on every tenant-owned table. The word doing the
work in that sentence is *every*. RLS protects the tables that have it, and a new table added six months from now by
someone who's never read the design doc has it only if something checks.

So something checks. After migrations run in CI, a function walks the application schema and fails the build if
anything in it could read or reveal data across tenants. New tables are covered automatically, because the gate
doesn't know or care which tables exist.

## What the gate looks for

The obvious checks first. Every table in the `app` schema must have:

- a `tenant_id` column that is `NOT NULL`;
- row-level security enabled **and** forced;
- a policy named `tenant_isolation` covering both `USING` and `WITH CHECK`.

Then the four that people miss.

### Views run as their owner

A view executes with the permissions of whoever created it, and the owner is the migration role, which RLS doesn't
apply to unless the view is created with `security_invoker = true`. A perfectly innocent reporting view over a
protected table returns every tenant's rows. The gate fails any view in `app` without `security_invoker`.

### Materialized views have no RLS at all

You can't put a policy on one. If you need a materialized view, it goes in a separate schema with its own access
rules and its own tenant filtering in the query layer. In `app`, the gate rejects them outright.

### SECURITY DEFINER functions

Same problem as views: the function runs as its owner and skips RLS. Sometimes that's the point, for a carefully
written helper. The gate allows a `SECURITY DEFINER` function only if its comment starts with `rls-reviewed:` and a
reason, so the exception is visible in the migration and in code review.

### Unique indexes without `tenant_id`

This one is subtle. Suppose `projects` has a unique index on `name` alone. Tenant B tries to create a project called
"Acme migration" and gets a duplicate-key error, because tenant A already has one. B has just learned something about
A's data. The gate fails any unique index on an `app` table that doesn't include `tenant_id`. The only exception is a
single-column unique index on a server-generated `id`.

## Testing the gate itself

A gate nobody tests is a gate that silently stopped working. The test suite includes bad fixtures: a view without
`security_invoker`, a materialized view, an unreviewed `SECURITY DEFINER` function, and a unique index missing the
tenant column. Each one must make the gate fail. If a Postgres upgrade or a refactor changes the catalog queries,
these tests are what notices.

## Per-table isolation tests, generated

Alongside the gate, a test runs for every table, generated from the catalog so new tables are included:

1. With tenant A in context, insert a row.
2. Switch to tenant B. `SELECT`, `UPDATE` and `DELETE` against that row affect zero rows.
3. Insert with an explicit `tenant_id = A` while B is in context. It fails.
4. Reference a tenant-A parent from a tenant-B child. The composite foreign key rejects it.
5. With no tenant in context at all, every table returns zero rows and every insert fails.

None of this is clever. It's a few hundred lines of SQL and a test file. What it buys is that isolation is a
property of the schema that CI proves on every pull request, rather than a convention that holds until it doesn't.
