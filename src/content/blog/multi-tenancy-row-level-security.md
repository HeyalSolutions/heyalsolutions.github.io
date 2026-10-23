---
title: "Multi-tenancy by construction, Part 2: Make the forgotten filter return nothing"
description: "Postgres Row-Level Security for a pooled multi-tenant database: the table pattern, why FORCE and NOBYPASSRLS matter, setting context per transaction, and composite foreign keys."
pubDate: 2026-10-29
heroImage: ../../assets/blog/generated/mt-rls.jpg
heroAlt: "A table of rows with a filter plane across it, letting through only the rows of one colour"
tags: [multi-tenancy, saas, postgres, security]
service: platform-engineering
series:
  id: multi-tenancy
  title: "Multi-tenancy by construction"
  part: 2
cta: multi-tenancy
draft: true
---

In [Part 1](/blog/multi-tenancy-shared-tables-or-database-per-tenant/) we chose shared tables with a `tenant_id` column.
That leaves the obvious risk: one query without `WHERE tenant_id = …` and a customer sees someone else's data.

Code review doesn't catch this reliably. Neither does an ORM scope that someone can bypass. The fix is to make the
database enforce it, so a forgotten filter returns zero rows and a mistaken write is rejected.

## The table pattern

Every tenant-owned table gets the same four things:

```sql
CREATE FUNCTION app.current_tenant() RETURNS text
LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('app.tenant_id', true), '') $$;

CREATE TABLE app.projects (
  id         text NOT NULL PRIMARY KEY,
  tenant_id  text NOT NULL DEFAULT app.current_tenant(),
  name       text NOT NULL,
  UNIQUE (tenant_id, id),
  UNIQUE (tenant_id, name)
);

ALTER TABLE app.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.projects FORCE  ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON app.projects
  USING      (tenant_id = app.current_tenant())
  WITH CHECK (tenant_id = app.current_tenant());
```

- **`tenant_id NOT NULL` with a default from the context.** Application code never sets it. An insert picks up the
  current tenant automatically, and an insert with no tenant in context fails.
- **`ENABLE` and `FORCE`.** `ENABLE` alone exempts the table's owner. `FORCE` applies the policy to the owner too,
  so a migration or a maintenance script run as the owner can't accidentally cross tenants.
- **One policy for reads and writes.** `USING` filters what you can see. `WITH CHECK` rejects rows you try to insert
  or update into another tenant. When no tenant is set, `current_tenant()` returns `NULL`, the predicate is `NULL`,
  and nothing matches. Deny by default.
- **A runtime role that can't bypass it.** The application connects as a role that doesn't own the tables and is
  created `NOBYPASSRLS`. Only migrations run as the owner.

## Setting the context

The tenant goes into a transaction-local setting, never a session-level one:

```ts
tx<T>(fn: (trx: Transaction<DB>) => Promise<T>): Promise<T> {
  const { tenantId, userId, requestId } = tenantCtx()
  return db.transaction().execute(async (trx) => {
    await sql`SELECT set_config('app.tenant_id', ${tenantId}, true),
                     set_config('app.user_id', ${userId}, true),
                     set_config('app.request_id', ${requestId}, true)`.execute(trx)
    return fn(trx)
  })
}
```

The `true` makes the setting last for the transaction only. That matters with PgBouncer in transaction pooling mode,
where the next transaction on the same connection could belong to a different tenant. A session-level `SET` would
leak across.

This `tx` function is the only way product code touches the database. A lint rule bans importing the raw pool
anywhere else, so there's no path that skips the context.

## Composite foreign keys

RLS stops you reading another tenant's rows. It doesn't stop you *referencing* them. A document in tenant A could
point at a project in tenant B if the foreign key is just `project_id`. Make the key composite:

```sql
FOREIGN KEY (tenant_id, project_id) REFERENCES app.projects (tenant_id, id)
```

Now the parent has to be in the same tenant as the child, and the database checks it on every write. It's also why
every table has a `UNIQUE (tenant_id, id)` constraint even though `id` is already the primary key.

## What RLS does not protect against

RLS makes a forgotten filter fail closed. It doesn't protect against an attacker who can run arbitrary SQL as the
runtime role, because that role can call `set_config` itself. SQL injection breaks isolation. So do raw SQL strings
built by hand. The defences for that are separate: parameterised queries only, lint rules banning `sql.raw` and any
`set_config` outside the database helper, no DDL for the runtime role, and tests that try to cross tenants.

Keep the explicit `WHERE tenant_id = …` in your queries too. RLS is the guarantee. The filter is for the query
planner, so it picks the `tenant_id`-leading index instead of scanning and filtering afterwards.

Next: how to be sure every table actually has this pattern, including the views and indexes that quietly bypass it.
