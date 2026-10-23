---
title: "Signs your platform team has become a ticket queue"
description: "When every new service, environment or permission needs a request to another team, delivery slows in ways that don't show up on any dashboard. How to spot it, what it costs, and what the fix looks like."
pubDate: 2026-11-17
heroImage: ../../assets/blog/generated/biz-queue.jpg
heroAlt: "A long queue of request tickets waiting at a single desk, with one small self-service door beside it"
category: leadership
tags: [platform-engineering, delivery, devops]
service: platform-engineering
cta: platform
---

Most platform teams start as the people who know how the infrastructure works. Over time, without anyone deciding
it, they become the people you have to ask. A new environment is a ticket. A new service is a ticket. A permission
change, a DNS entry, a database, a secret: tickets.

The team is busy, the backlog is long, and product teams wait. Nobody is doing anything wrong, and delivery is
quietly slower than it should be.

## How to tell

- **Product teams can't do anything new without a request.** Deploying a change to an existing service is fine.
  Creating a new one, or a new environment, means waiting.
- **The wait is measured in weeks.** We've seen this in banks, payment providers and logistics companies. At one, a new environment took
  weeks, sometimes months, because it meant requests to several teams in sequence.
- **People have learned to work around it.** Shared environments nobody owns. "Temporary" credentials that are two
  years old. Services bolted onto existing ones because a new one was too slow to get.
- **The platform team's roadmap is mostly tickets.** Improvements keep slipping because requests keep arriving.
- **Knowledge lives in two or three heads.** When one of them is on holiday, certain kinds of ticket just wait.

## What it costs

The visible cost is platform engineers' time. The bigger cost is invisible: features that ship a month later than
they could, experiments that don't happen because the setup isn't worth it, and senior engineers on product teams
spending their mornings chasing.

It also sets the ceiling on how many teams the platform can support. A queue scales with the people answering it,
and hiring more of them is expensive and slow.

## What the fix looks like

The goal is that the platform team builds paved roads and product teams drive on them without asking. In practice:

1. **The common requests become self-service.** A new service or environment is a pull request against a template,
   reviewed automatically, and running in minutes. The platform team designs the template; they don't process the
   request.
2. **The interface is deliberately small.** Product teams shouldn't need to understand Kubernetes to use it. A few
   well-chosen settings cover most cases; the rest are defaults they can change later.
3. **Guard rails replace approvals.** Policy is enforced by the platform (what can be deployed, what it can access,
   what it costs), so there's no need for a human to check each request.
4. **The platform team's success is measured by how little they're asked.** Time from "we need a new service" to
   "it's running in production" is the number to watch.

On the engagement above, release lead time went from days or weeks to minutes, and new services went from a queue
to self-service. The full story is in [our case study](/work/fintech-cloud-native-platform/). The platform team
didn't shrink. They stopped processing tickets and started building the platform.

## Where to start

Look at the last thirty tickets the platform team closed. Group them. The biggest group is the first thing to make
self-service. It's usually environments or new services, and it's usually a few weeks of work to automate well.
