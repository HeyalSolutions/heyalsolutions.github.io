---
title: "How we work alongside your team, then leave"
description: "The point of bringing in outside engineers is to end up with a platform your own team owns. How we pair, train and hand over, and the signs an engagement is creating dependence instead."
pubDate: 2026-12-01
heroImage: ../../assets/blog/generated/biz-handover.jpg
heroAlt: "Two groups of people around one platform, with one group stepping back and the other holding the controls"
category: leadership
tags: [how-we-work, platform-engineering, training]
service: reviews-and-training
cta: platform
---

The best outcome of a consulting engagement is that you don't need the consultants any more. That sounds obvious,
and it's surprisingly rare, because the incentives point the other way. Here's how we try to make it happen, and
what to look for from anyone you bring in.

## Everything in your repositories, from day one

The platform lives in your Git, your cloud accounts and your CI from the first week. There's no "our environment"
that gets handed over at the end. Your engineers can see every change as it happens and review every pull request.
If the engagement ended tomorrow, you'd have everything.

## Pairing on real work

Training sessions have their place, and we run them. But most of what your team learns comes from building real
features of the platform alongside us. Early on we lead and they follow. Later they lead and we review. By the end
they're building things we haven't seen.

We've done this in banking, payments, logistics and at startups. On one platform we led, for a company with more
than a thousand engineers, most of them had never used Kubernetes.
Their platform engineers took on more of the platform's development as it matured, and by the end they understood
it well enough to keep building on it without us. That's in [the case study](/work/fintech-cloud-native-platform/),
and it's the outcome we aim for every time.

## Designing for the people who'll run it

A platform built by experts for experts is a platform only experts can run. We design the interfaces your product
teams touch to be deliberately small, so engineers can ship without first becoming Kubernetes specialists. The
same applies to the platform team: boring, well-documented choices over clever ones, and managed services wherever
they're good enough.

## Writing down the why

Every significant decision gets a short record: what was decided, what the alternatives were, and why. Six months
later, when someone asks "why is it like this?", the answer is in the repository, not in our heads.

## Signs an engagement is creating dependence

Whoever you work with, watch for these:

- **The platform lives somewhere you don't control**, to be handed over "at the end".
- **Your engineers are watching, not doing.** Demos and updates instead of pull requests with their names on.
- **Decisions aren't written down.** Only the consultants know why things are the way they are.
- **The tooling is theirs.** Proprietary frameworks, custom CLIs or private modules that leave with them.
- **The end date keeps moving**, and nobody can say what "done" looks like.

## What done looks like

Your team deploys, scales, monitors and upgrades the platform without asking us. New services and environments are
self-service. The decisions are documented. And we're on the end of an email for the odd question, not on the
critical path.
