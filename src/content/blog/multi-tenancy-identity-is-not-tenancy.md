---
title: "Multi-tenancy by construction, Part 5: Identity is not tenancy"
description: "Why the identity provider should know nothing about tenants, why memberships don't belong in the access token, and how a per-request lookup with a two-tier cache makes role changes apply in seconds."
pubDate: 2026-11-10
heroImage: ../../assets/blog/generated/mt-identity.jpg
heroAlt: "One person icon connected by lines to three tenant boxes, each line carrying a different role badge"
tags: [multi-tenancy, saas, identity, keycloak, security]
service: platform-engineering
series:
  id: multi-tenancy
  title: "Multi-tenancy by construction"
  part: 5
cta: multi-tenancy
---

A person signs in once. They might belong to three customer organisations with a different role in each: owner of
their own company's tenant, viewer in a client's, admin in a partner's. The design has to separate two questions that
are easy to blur: *who is this?* and *what may they do here?*

## The identity provider proves who

We use Keycloak as the identity provider. It holds credentials, does MFA and passkeys, and brokers SAML and OIDC for
customers who bring their own SSO. That's a lot of hard, risky code we don't have to write.

What Keycloak does **not** hold is tenancy. No tenant list, no memberships, no roles. Keycloak has an Organizations
feature that could model this, and we deliberately don't use it as the source of truth. The platform's own control
plane owns tenants, memberships and roles, and talks to Keycloak through one small adapter. Data-plane services only
verify OIDC tokens. Swap the identity provider later and you change one adapter and run an identity migration.

## Tokens identify the person only

The tempting shortcut is to put memberships and roles into the token as claims. Then every service can authorise
from the token alone, with no lookup. Three things go wrong:

- **People in many tenants get large tokens**, and the token goes on every request.
- **Role changes don't apply until the token is reissued.** Remove someone's admin rights and they keep them until
  their session refreshes, which could be hours.
- **The identity provider now knows about tenants**, which is exactly the coupling we were avoiding.

So tokens carry identity and nothing else. The tenant comes from the URL ([Part 4](/blog/multi-tenancy-tenant-in-the-url/)),
and the data plane resolves `(user, tenant)` to a membership and a set of permissions on every request.

## Making the lookup cheap

A lookup per request sounds expensive. It isn't, with two cache layers:

| Layer | TTL | Purpose |
|-------|-----|---------|
| In-process LRU | 30 seconds | Absorbs the burst of calls a single page load makes |
| Valkey (shared) | 5 minutes | Shared across replicas, survives restarts |

Both are invalidated by events. When a membership or role changes, the control plane publishes
`membership.updated`, and every replica drops that entry. A revoked admin loses their rights within seconds, not at
the next token refresh.

If the control plane is unreachable, services keep serving from cache for up to five minutes, then fail closed. A
tenancy outage degrades to "no new sessions and no role changes", not to "everything is down" and not to "everyone
is allowed".

## One identity, many memberships

The data model that falls out is small:

```
User ──< Membership(tenant, status) ──< Role ──< Permission
```

A user is global. A membership ties a user to one tenant with a status (invited, active, suspended) and one or more
roles. Permissions are strings like `projects:delete` that roles map to. Part 6 covers how code uses them.

A user with no active membership in the tenant they asked for gets `NOT_FOUND`, not `FORBIDDEN`. From the outside,
"not yours" and "doesn't exist" look identical, which is the point.

## Where this leaves per-tenant SSO

A customer that wants their staff to sign in with their own Okta or Entra gets a brokered identity provider in
Keycloak, created by the control plane and hidden from the login page. Home-realm discovery picks it from the email
domain. The person still ends up as one global user with memberships, and a verified identity from their IdP is
trusted only for that tenant's own verified domains. Part 8 is about why that last rule matters more than it looks.
