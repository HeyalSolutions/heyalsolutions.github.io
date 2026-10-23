---
title: "Multi-tenancy by construction, Part 6: Permissions in code, roles in data"
description: "A small authorisation model that lets tenants define their own roles without a code change: permission strings owned by services, roles as data, and a resource-aware check you can grow into."
pubDate: 2026-11-12
heroImage: ../../assets/blog/generated/mt-permissions.jpg
heroAlt: "A code block checking one permission, beside an editable table mapping roles to permissions"
tags: [multi-tenancy, saas, authorization, rbac]
service: platform-engineering
series:
  id: multi-tenancy
  title: "Multi-tenancy by construction"
  part: 6
cta: multi-tenancy
---

Most products start with `if (user.role === 'admin')` scattered through the codebase. It works until the first
enterprise customer asks for a "billing manager" role that can see invoices but not members, and now every one of
those checks is a decision about whether billing managers count as admins.

The fix is one rule: **code checks permissions, never roles.** Roles are data that map to permissions, and tenants
can edit them.

## Permissions are owned by the service that enforces them

A permission is a string, `resource:action`, like `projects:delete` or `documents:read`. Each product service
declares the permissions it enforces, along with what the built-in roles get by default:

```yaml
kind: ProductService
metadata: { name: projects }
spec:
  permissions: [projects:read, projects:create, projects:update, projects:delete,
                documents:read, documents:write, exports:create]
  roleGrants:
    member: ["projects:*", "documents:*", exports:create]
    viewer: [projects:read, documents:read]
```

An operator registers these with the control plane whenever the service is deployed. Removing a permission from
the manifest flags it rather than deleting it, until no role references it. Deploying a new service is one
manifest, and its permissions exist everywhere the moment it's running.

## Four system roles, then custom ones

Every tenant gets the same seeded roles: **owner** (everything, including deleting the tenant), **admin** (members,
roles, domains, SSO, audit, all product permissions), **member** (product read and write), **viewer** (product read).
These are immutable. On top of them, tenant admins compose their own roles from the registered permissions.

The guard rails live in the control plane, not in each product:

- The last owner can't be removed, demoted or suspended.
- Nobody can grant a role containing permissions they don't hold themselves.
- Only owners grant `owner`.
- Service accounts can never hold `owner` or anything that manages members, roles, SSO or domains, so a leaked API
  key can't take over a tenant.

## Enforcement is one line

```ts
export const deleteProject = requires('projects:delete', async ({ id }: { id: string }) =>
  tenantDb.tx((q) => q.deleteFrom('projects').where('id', '=', id).execute()),
)
```

The request context carries a `Set<string>` of permissions, computed once from the cached membership
([Part 5](/blog/multi-tenancy-identity-is-not-tenancy/)). `requires` checks it before the handler runs. For branches inside
a handler there's `can('documents:write')`. Denial returns `FORBIDDEN` with the missing permission key and nothing
else.

A lint rule insists every API operation is either marked `tenantless` or declares a permission. An operation with
neither doesn't build. That's what turns "we check permissions" from a habit into a property.

## Leave room for resource-level checks

In v1 a permission applies across the whole tenant. If you can delete projects, you can delete any project. Plenty
of products eventually need more: project-level roles, groups, or "owners of this document". The expensive mistake
is to retrofit that into every call site.

So the signature is resource-aware from the start, even though the argument is ignored for now:

```ts
can('projects:delete', project)
requires('projects:delete', handler, { resource: 'project' })
```

When the day comes to add a relationship-based engine such as OpenFGA or SpiceDB, the call sites already say what
they're checking against. The change is in one place.

Ownership rules that exist today use distinct permissions instead: `documents:write:own` versus `documents:write`,
checked against data the database has already scoped to the tenant.
