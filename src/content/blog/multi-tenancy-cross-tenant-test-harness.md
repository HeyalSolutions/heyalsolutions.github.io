---
title: "Multi-tenancy by construction, Part 11: Test isolation like an attacker"
description: "A cross-tenant test harness that calls every API operation as every kind of caller with the other tenant's ids, blocks merges on any leak, and keeps running in production as canary tenants."
pubDate: 2026-12-01
heroImage: ../../assets/blog/generated/mt-harness.jpg
heroAlt: "Two tenant boxes labelled alpha and beta, with every arrow from alpha toward beta's contents bouncing off"
tags: [multi-tenancy, saas, testing, security, ci]
service: platform-engineering
series:
  id: multi-tenancy
  title: "Multi-tenancy by construction"
  part: 11
cta: multi-tenancy
---

Isolation is a security property, so it gets its own test layer. Unit tests check that a feature works. The
cross-tenant harness checks that nothing works across tenants, and it does so by trying.

## Two tenants, every caller, every operation

The fixture is two tenants, `alpha` and `beta`, each with a user in every system role and a realistic dataset. The
harness reads the OpenAPI spec (and the GraphQL schema, where a service has one) and generates the test matrix:

```
for each operation:
  for each caller in [owner, admin, member, viewer, non-member,
                      service-account, staff-without-grant,
                      staff-read-only-grant, staff-full-grant]:
    call as alpha:<caller>, filling every id parameter with ids harvested from beta
    assert  no beta data in the response
    assert  beta's dataset checksum is unchanged
    assert  allow/deny matches what the role's permissions predict
    assert  each mutation produced exactly one audit record with the right actor and tenant
```

Any leak fails the build. Because operations come from the spec, a new endpoint is covered the day it's added.
Authors supply input generators for new request shapes, and nothing else.

The checksum assertion matters. "No beta data in the response" catches reads. Only comparing beta's data before
and after catches a write that returned `204` and quietly changed the wrong tenant.

## Context propagation tests

The harness covers the HTTP surface. A second set of tests covers the places tenant context travels that aren't
HTTP:

- A job enqueued under tenant A runs under A. An envelope with no tenant is rejected. A job for a tenant suspended
  after it was enqueued doesn't execute.
- Log lines and trace spans from handlers and jobs carry `tenant_id`, and never carry a marker email or body text
  planted in a canary request.
- The storage signer refuses absolute keys and traversal, and product pods can't reach the bucket directly.
- A client-supplied `X-Tenant-Id` never reaches a service. A flood of requests carrying tenant B's id from a
  non-member doesn't consume B's quota.
- Two tenants request the same page and API path; neither response contains the other's data, and tenant pages
  carry `Cache-Control: private, no-store`. Framework caches are caches too.
- An export or delete job deliberately written **without** a tenant filter still touches only its own tenant,
  because it runs under RLS and no role exists that can write past it.

## The existence oracle

One more that's easy to miss. For every unique constraint, the test inserts tenant A's value from tenant B and
expects success. If it fails with a duplicate-key error, tenant B has just learned that A has that value. The
[CI gate from Part 3](/blog/multi-tenancy-isolation-ci-gate/) stops unique indexes without `tenant_id` from existing;
this test proves the behaviour end to end.

## It doesn't stop at CI

**Canary tenants in production.** Two tenants, `canary-a` and `canary-b`, probe each other's ids every five
minutes. Anything other than `404` pages on-call. This is the only test that runs against the real configuration,
with the real gateway, the real identity provider and whatever someone changed by hand last Tuesday.

**A weekly integrity sampler** reads a sample of child rows and confirms each one's `tenant_id` matches its
parent's. It's the guard against manual database edits, and it runs under a read-only, audited role.

**An annual penetration test** focused specifically on tenant isolation, because the harness tests the threats we
thought of.

## Why generate rather than write

A hand-written isolation test suite is complete on the day it's written. Every endpoint added afterwards is covered
only if someone remembers. Generating from the spec, the catalog and the permission manifests means coverage is
the default and omission takes effort. That's the same principle as the RLS gate, applied one layer up.
