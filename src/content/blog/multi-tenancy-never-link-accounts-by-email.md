---
title: "Multi-tenancy by construction, Part 8: Never link accounts by a matching email"
description: "The cross-tenant account takeover hiding in per-tenant SSO: a customer's own identity provider can assert any email it likes. Why an email claim is trusted only for that tenant's verified domains, and linking needs proof."
pubDate: 2026-11-19
heroImage: ../../assets/blog/generated/mt-email-link.jpg
heroAlt: "An identity provider icon asserting an email address toward a user account, blocked by a verification barrier"
tags: [multi-tenancy, saas, identity, sso, security, keycloak]
service: platform-engineering
series:
  id: multi-tenancy
  title: "Multi-tenancy by construction"
  part: 8
cta: multi-tenancy
draft: true
---

This is the one post in the series that describes a bug we designed in, found in a review, and designed back out.
It's worth a post because the bug is common, and the products that have it mostly don't know.

## The convenient rule

When someone signs in through an identity provider for the first time, you get an email address and often an
`email_verified: true` claim. If a user with that email already exists, the convenient thing is to link the new
identity to that account. The person who used a password last year and now arrives through their company's SSO
keeps their history and memberships. Keycloak will do this for you: set `trustEmail=true` on the identity provider
and pick the first-broker-login flow that "automatically sets the existing user".

That rule is fine for an identity provider **you** run. It is not fine for a **tenant's** SSO connection.

## The attack

Any tenant admin can point their SSO connection at an identity provider they control. That provider can assert
`email_verified: true` for *any* address. `victim@gmail.com`. `ceo@othercorp.com`.

With the convenient rule, the malicious tenant's IdP signs in as the victim's email, the platform finds the existing
account, links the new identity to it, and the attacker is now signed in as the victim. Not just in the attacker's
tenant: as the victim's **global account**, with every membership it holds in every other tenant. One malicious
customer can take over accounts platform-wide.

## The rules that replace it

1. **An email claim from a tenant connection is trusted only for that tenant's verified domains.** If the tenant has
   verified `corp.com` and bound it to the connection, then `alice@corp.com` from that connection is trusted. Any
   other address is recorded as an unverified claim and is never used to link accounts, accept invitations, drive
   discovery or set the user's primary email.
2. **Linking to an existing account requires proof of control of that account.** When a new identity's email matches
   an existing user, the person re-authenticates as the existing account, or completes a verification email sent to
   it, before the link is made. No identity-provider claim links by itself. In Keycloak terms: every tenant IdP has
   `trustEmail=false`, and the first-broker-login flow's only path to an existing user is "confirm link, then
   re-authenticate or verify by email". The automatic authenticator is never used, the realm config is declared in
   Git, and a test asserts it.
3. **A verified domain grants tenancy decisions, not account ownership.** Verifying `corp.com` lets a tenant offer
   SSO to, enforce SSO for, and auto-join people with `@corp.com` addresses into *its own* tenant. It doesn't let the
   tenant take over an existing `@corp.com` account or touch that account's memberships elsewhere.
4. **New users created from an untrusted claim have no verified email** until they prove it. An unverified user can't
   accept invitations or be found by email for auto-join.
5. **Attribute sync never changes a primary email silently.** A changed email from an IdP is recorded on the identity;
   the primary email changes only through the verified email-change flow.
6. **Every link and unlink is a security audit event**, and the account's verified address gets a notification:
   "a new sign-in method was added".

## The test

The control-plane test suite includes a malicious tenant whose IdP asserts `email_verified` for an address outside
its domains. The expected outcome is a brand-new, unverified user. It must never link to the existing account, never
join a tenant, never accept an invitation. A second test reads the Keycloak realm configuration and fails if any
tenant IdP has `trustEmail=true` or an automatic-link flow.

Keycloak's first-broker-login flow is now part of the security boundary. That's uncomfortable, and it's why the
flow is declared in Git and the tests re-run on every Keycloak upgrade.

## The cost

A person moving an existing account onto their company's SSO sees one extra confirmation step. That's it. Against
"one customer can take over any account on the platform", it's not a close call.
