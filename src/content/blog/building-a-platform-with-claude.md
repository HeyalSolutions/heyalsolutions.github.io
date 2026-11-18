---
title: "One engineer, an AI, and 890 pull requests"
description: "A month building a multi-tenant SaaS platform with Claude doing most of the typing. The output was never the hard part. The working agreement was: what we wrote down so many parallel threads of work didn't trip over each other, and where a person still decides."
pubDate: 2026-12-22
heroImage: ../../assets/blog/generated/claude-team.jpg
heroAlt: "Many parallel lanes of pull requests flowing into one branch, with a few decision gates along the way"
category: leadership
tags: [ai, engineering-process, pull-requests, ci, platform-engineering]
service: platform-engineering
cta: platform
---

Between 17 October and 18 November 2026, the repository behind the platform in
[Multi-tenancy by construction](/blog/multi-tenancy-shared-tables-or-database-per-tenant/) took 892 pull requests,
870 of them merged. Its homelab took 74 more. Along the way came 45 architecture decision records, 23 design
documents, 114 alert runbooks, and an app a household uses every day.

One engineer directed it. [Claude](https://www.anthropic.com/claude), working in many separate threads at once,
did most of the writing. If you lead an engineering team, the interesting part isn't the volume. It's that the
volume was only safe once the rules a good team keeps in its head were written down where an AI would read them.

## The output was never the bottleneck

Within the first week, writing code was no longer the slow part. What slowed things down was the same as on any
fast-growing team: work stepping on other work, CI queues, decisions made twice or not at all, and problems found
late. Every rule below came from one of those, usually the day after it hurt.

## Decide first, then build

Each piece of work starts with its design questions, asked one at a time: a short question, two to four options,
one marked as recommended, and always an "Other" where the owner can write their own answer. If the owner picks
Other, Claude questions it, sets out the trade-offs and what it would recommend instead, before building it.
Then a short summary of every decision, then code.

It's slower for the first ten minutes and much faster after, because the expensive mistake with a fast builder is
building the wrong thing well.

## Pull requests only, and fewer of them

No change goes to `main` directly, ever, including typos. Every change is a branch and a PR, and no agent merges
its own.

That turned out to need a second rule. On 13 November, with more than 20 PRs open, nothing went green for hours.
Nothing was failing. The CI runners (a few machines at home, see
[Part 1 of A SaaS platform at home](/blog/saas-platform-at-home/)) were a queue, and every time a PR merged
`main` "to stay current", its run went to the back. The fix was a rule about batching:

> One PR per feature or plan item, holding its code, tests, docs and changelog line. Fold follow-ups into the open
> PR. Merge `main` into a PR only for a real conflict, or just before it merges. Push when a piece of work is done,
> not after every commit.

## Lay files out so parallel work doesn't collide

Many threads working at once all wanted to edit the same few files: the changelog, the plan's status table, the
Makefile. So those were split: one file per changelog entry, one file per plan item, one `.PHONY` line per Makefile
target, one entry per line in shared lists. Conflicts mostly stopped.

Not all of them show up in Git, though. Two threads could each add database migration number 0042 without a
conflict, because they were different files. That one gets checked after every merge.

## Nothing found is left silent

When a change turns up an edge case it doesn't fix, it becomes a ticket labelled `known-issue`, linked from the PR
description and from a comment in the code at the spot it affects, and the owner hears about it in the report, not
just in the PR. A fast builder finds a lot of edges; this is what stops them being forgotten.

## Show the change

A PR that changes anything a person sees carries screenshots, taken from a local run with made-up people, in light
and dark, at phone width, in the states that matter. A PR or explanation that changes a structure or a flow
carries a diagram. Reviewing 30 PRs a day is only possible when you can see what each did without running it.

## Ship fast, verify in staging

PR checks are kept to about five minutes and only run what a change could break. The slow, thorough checks run
nightly and on staging after every merge, and a failure there is fixed before anything new merges. When something
breaks late, the first fix is the cheap check that would have caught it early. The other three parts of
[A SaaS platform at home](/blog/saas-platform-at-home/) are what that looked like in practice.

## Where a person still decides

- **Anything that changes the goal.** New features, design choices, trade-offs. Claude recommends; the owner picks.
- **Anything that can't be undone.** Changes to a running environment outside Git wait for an explicit "go" in
  the thread, and the owner's own tooling refuses destructive commands against staging regardless.
- **Merging.** Agents open and maintain PRs, and fix their own conflicts and failing checks without being asked.
  Humans merge.

## What it means for your team

Read back, the rules aren't about AI at all. Decide before building. Small, independent changes, but not so small
they swamp CI. Write down the edge cases. Show your work. Verify where it's real. They're a good team's working
agreement, the kind most teams keep as habit and folklore.

That's the actual lesson. An AI collaborator holds you to your process exactly as written, every time, in every
thread. If the process lives in people's heads, it won't be followed. If it's written down, it will be, at a pace
that makes the gaps obvious within days. Writing it down is worth doing either way.
