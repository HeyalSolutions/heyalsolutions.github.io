---
title: "What a two-week platform review actually gives you"
description: "What arrives at the end of our fixed-price review, who it's for, how much of your team's time it takes, and how to tell whether it's worth it compared with doing it in-house."
pubDate: 2026-11-10
heroImage: ../../assets/blog/generated/biz-review.jpg
heroAlt: "A two-week calendar with a report document at the end, its findings ranked by size"
category: leadership
tags: [platform-review, kubernetes, terraform, cost]
service: reviews-and-training
cta: platform-review
draft: true
---

A platform review is a short, fixed-price look at how your cloud infrastructure, Kubernetes and delivery pipelines
are built and run, by someone who has seen a lot of them. This post is about what you get for the money, so you can
decide whether it's worth it.

## What arrives at the end

- **A written report with every finding ranked by impact and effort.** Not a list of everything that's imperfect.
  A list of what matters, in the order to tackle it, with the reasoning.
- **A short list of quick wins** your team can do in the next few weeks. There are always some. Extended-support
  fees, over-provisioned workloads and a long-lived access key or two tend to appear in most reports.
- **A suggested order for the bigger changes**, roughly a quarter's worth, so you can plan and budget.
- **A walkthrough session** with your engineers and anyone else who needs to hear it, and a follow-up call a month
  later as you make changes.

## What it takes from you

About half a day of your team's time in total, spread across a few engineers. Read-only access to your repositories,
cloud accounts and clusters. We never need write access to production for a review.

## Who it's for

The pattern we see is a platform that works, mostly, but is slower, more expensive or more fragile than it should be,
and a team that's too close to it to see which of the hundred things on their list actually matters. Common triggers:

- A funding round, an audit or a big customer's security questionnaire is coming and you want to know what they'll
  find first.
- You're about to hire a platform lead and want a baseline, or you've just hired one and want them to start with a
  map.
- The cloud bill went up and nobody can say exactly why.
- Something broke badly, and the post-mortem said "we should look at the whole thing".

## Compared with doing it in-house

Your own engineers can review the platform. Two things make it hard: they built it, so the decisions that look odd
from outside look normal to them, and they have a day job. An internal review tends to take a quarter of someone's
attention for a couple of months and land as a wiki page.

A review from outside costs from £10,000 plus VAT, takes two weeks, and lands as a ranked list that's already been
checked with your team so there are no surprises in the walkthrough. We wrote up what tends to be in those lists in
[What we find when we audit a Kubernetes platform](/blog/platform-audit-findings/).

## What it isn't

It isn't a sales exercise for a bigger engagement. Most reviews end with your team doing the work, and the report is
written for that. If something in it does need outside help, we'll say so, and you can get it from anyone.

If you want to see the full scope, timeline and price, it's all on [the platform review page](/platform-review/).
