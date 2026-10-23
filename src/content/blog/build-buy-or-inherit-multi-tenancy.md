---
title: "Build, buy or inherit: the foundations of a multi-tenant product"
description: "Every B2B product needs tenants, users, roles, invitations, SSO and support access. Three ways to get them, what each costs, and the expensive mistake that's easy to make while building them yourself."
pubDate: 2026-11-24
heroImage: ../../assets/blog/generated/biz-foundations.jpg
heroAlt: "Three building foundations side by side: one being poured, one delivered on a lorry, one already in place"
category: leadership
tags: [multi-tenancy, saas, security, build-vs-buy]
service: platform-engineering
cta: multi-tenancy
---

Before a B2B product does anything useful, it needs the same set of things every other B2B product needs: customer
organisations, the people in them, who's allowed to do what, how to invite someone, how to sign in with the
customer's own identity provider, and how your support staff get in to help without seeing everything.

None of it is the product. All of it has to exist, and getting it wrong is one of the few mistakes that can end a
company. Three ways to get it:

## Build it yourself

This is what most teams do, incrementally. A `customer_id` column here, an `is_admin` flag there, an SSO integration
when the first enterprise deal needs one.

**Upside:** no dependency, exactly what you need, and it starts cheap.

**Downside:** it's never finished, and it's rarely designed. We've reviewed products where tenancy was five years of
accumulated decisions, and nobody could say with confidence that one customer couldn't see another's data. Enterprise
security questionnaires ask that question directly.

The specific trap: the convenient way to link a user's SSO login to their existing account (matching on email
address) lets a malicious customer take over any account on your platform. It's a common bug, it's invisible until
it isn't, and we've written up why in [Never link accounts by a matching email](/blog/multi-tenancy-never-link-accounts-by-email/).
Teams building incrementally almost never catch it.

## Buy it

Identity and tenancy products exist: Auth0 and WorkOS for sign-in and SSO, Keycloak and Zitadel if you'd rather
run it yourself. They solve the authentication part well.

**Upside:** passwords, MFA, SSO brokering and the compliance that goes with them are someone else's problem.

**Downside:** they stop at "who is this?" The questions that matter for a multi-tenant product (which organisations
is this person in, what may they do in each, how is the data kept apart, how does support get in) are still yours.
Some products try to answer them too, and the cost is that your tenancy model lives inside a vendor's.

## Inherit it

The third option is to start from a foundation that already answers those questions: a control plane that owns
tenants, memberships, roles, invitations, SSO connections and support access, and a library each product service uses
to enforce isolation. New products adopt it rather than rebuild it.

This is what we've been building, and the engineering is written up in the
[Multi-tenancy by construction](/blog/multi-tenancy-shared-tables-or-database-per-tenant/) series. The business
argument is simpler than the engineering:

- **Isolation is enforced by the database and proved on every change**, which is the answer a security
  questionnaire wants.
- **Support access is a time-boxed, audited grant** the customer can see, which is what a SOC 2 auditor wants.
- **The second product costs nothing extra.** Tenancy is shared infrastructure, not a feature of one app.

## How to choose

- **Pre-product, one engineer:** buy authentication, build the minimum tenancy, and write down the rules you're
  deferring. Revisit before the first enterprise deal.
- **Shipping product, first enterprise customers arriving:** this is when "build incrementally" gets expensive.
  Get the isolation model reviewed before the security questionnaire does it for you.
- **More than one product, or a platform for several teams:** inherit. Building tenancy twice is the worst of all
  the options.

Whichever you pick, the question to ask is the same: "Can we show, not just say, that one customer can't reach
another's data?" If the answer involves the word "careful", it's a no.
