---
title: "One deployment or one per customer? The business case"
description: "Whether a B2B product runs every customer on one shared platform or gives each their own copy affects onboarding time, margin, security questionnaires and what you can promise. The trade-offs, without the engineering detail."
pubDate: 2026-11-03
heroImage: ../../assets/blog/generated/biz-pooled.jpg
heroAlt: "One large building with many doors beside a row of identical small houses"
category: leadership
tags: [multi-tenancy, saas, architecture, cost]
service: platform-engineering
cta: multi-tenancy
draft: true
---

Early in the life of a B2B product, someone makes a decision that shapes the next five years: does every customer
share one running system, or does each customer get their own copy?

Both are legitimate. Both are hard to reverse. Here's what each one means for the business, so you can have the
conversation with your engineers on equal terms.

## One copy per customer

Each customer gets their own database and often their own running application. It's how many products start,
because the first customer needed it yesterday and copying the deployment was the fastest way.

**What it gives you:** a strong isolation story ("your data is in its own database"), simple per-customer
restores, and the ability to run a customer in a specific region or on their own infrastructure.

**What it costs you:**

- **Onboarding time.** Each new customer is a deployment. We've seen this range from a morning to a fortnight,
  depending on how automated it is. It sets a floor under how fast sales can close.
- **Margin.** Every copy has a fixed cost whether the customer is large or small. Small customers can cost more to
  run than they pay.
- **Upgrades.** A release goes out as many times as you have customers. Some will be on old versions. Support has
  to know which.
- **Fleet operations.** "Which customers are affected?" becomes a question that takes a day to answer.

## One shared platform

Every customer's data lives in the same system, separated by design rather than by physical separation.

**What it gives you:** onboarding in minutes through a sign-up form, one release for everyone, near-zero marginal
cost per small customer, and fleet-wide reporting as a single query.

**What it costs you:**

- **The isolation has to be engineered**, and then proved. A bug in the wrong place can show one customer another's
  data. This is the thing enterprise security questionnaires ask about, and the answer needs to be better than
  "our developers are careful".
- **Noisy neighbours.** One customer's heavy usage can slow the others unless limits are built in.
- **Some customers will still want their own copy.** Regulated industries, data-residency requirements, or simply
  procurement policy. If the shared design didn't plan for that, it's a rewrite.

## What we recommend

For most B2B products: one shared platform, with isolation enforced by the database rather than by developer
discipline, tested on every change, and designed so a single large or regulated customer can be moved to their own
copy later without rewriting the product.

That last part is the piece most teams skip. It costs a little up front and saves the day the first enterprise deal
depends on it.

We've written up how the engineering side works in a series starting with
[Shared tables or a database per tenant?](/blog/multi-tenancy-shared-tables-or-database-per-tenant/). The short
version for this audience: the shared model is cheaper to run and faster to sell, and it's safe if the isolation is
structural. Ask your team which of those two words describes yours.
