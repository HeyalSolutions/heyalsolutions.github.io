---
title: "Multi-tenancy by construction, Part 1: Shared tables or a database per tenant?"
description: "The first decision in any multi-tenant SaaS: pooled tables with a tenant_id column, or a database per customer. Why we default to pooled, what it costs, and how to keep the door open."
pubDate: 2026-10-27
heroImage: ../../assets/blog/generated/mt-pooled-vs-silo.jpg
heroAlt: "One large table with rows in several colours beside a stack of small separate databases"
tags: [multi-tenancy, saas, postgres, architecture]
service: platform-engineering
series:
  id: multi-tenancy
  title: "Multi-tenancy by construction"
  part: 1
cta: multi-tenancy
draft: true
---

Every B2B product serves many customer organisations from one deployment. The first decision you make about how is
also the hardest one to change later: where does each tenant's data live?

This series is about building tenancy into a platform so that isolation holds by construction, not by discipline.
It comes from a reusable multi-tenancy foundation we've been designing and building: a control plane that owns
tenants, memberships, roles and SSO, and a library that product services embed. Each post takes one decision and
explains why we made it.

## The three options

1. **A database per tenant.** Strongest isolation, simplest story for auditors, and the easiest per-tenant restore.
   You also get one migration per customer, a connection pool per customer, and a fleet to operate.
2. **A schema per tenant.** The same migration fan-out as option one, in one database. It tends to combine the
   drawbacks of both approaches.
3. **Shared tables with a `tenant_id` column.** One schema, one migration, one set of indexes. Cheap per tenant,
   and easy to operate at scale. The weakness is obvious: one forgotten `WHERE tenant_id = …` leaks data.

## What we chose

Shared tables. For tens to thousands of B2B tenants with modest data each, run by a small team, the operational
simplicity wins. One migration path means every tenant is on the same version. One set of tables means fleet-wide
operations, reporting and usage metering are ordinary queries.

The forgotten-filter problem is real, and the next post is about it. The short version: we don't rely on code
review to catch a missing filter. Postgres Row-Level Security makes the forgotten filter return nothing.

## Keeping the escape hatch

Pooled is a default, not a prison. Some customers will be large enough, or regulated enough, that they need their own
database. The design keeps that possible with three rules:

- **Everything is addressable by `tenant_id`.** Every tenant-owned table has the column, every index leads with it,
  and there are no cross-tenant joins. A single tenant's data can be exported, imported elsewhere and deleted
  without touching anyone else's.
- **Placement is a lookup, not an assumption.** Every tenant has a record saying which set of data stores it lives
  in. Today every tenant is in the same one. Moving a tenant means changing a row, not changing application code.
- **Reference data is separate.** Shared catalogues such as countries live in their own schema with no tenant
  column. Everything in the application schema is tenant-owned. That line is what makes a move clean.

## What it costs

- **Noisy neighbours.** One tenant's runaway query or bulk import affects the others. Per-tenant rate limits, a
  `statement_timeout` on every transaction and `tenant_id`-leading indexes cover most of it. Hash partitioning by
  tenant is available later without code changes.
- **Per-tenant restore is logical, not a snapshot.** You can't restore one tenant by rolling back a database. You
  export and import their rows instead, which means export has to exist from day one anyway.

If you've already got a database per tenant and it works, keep it. If you're starting out, start pooled, enforce
isolation in the database, and keep the move possible. The rest of this series shows how.
