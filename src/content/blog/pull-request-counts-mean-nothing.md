---
title: "Pull request counts mean nothing now"
description: "Story points, pull requests per engineer and strict work-in-progress limits were built for a world where typing was the slow part. What to measure instead: how long an idea takes to reach production, and how much of it has to be redone."
pubDate: 2027-01-06
heroImage: ../../assets/blog/generated/pr-counts.jpg
heroAlt: "A tall, busy bar chart fading into the background, with a single steady pink line running across the front"
category: leadership
tags: [ai, metrics, dora, delivery, engineering-process]
service: infrastructure-and-delivery
cta: delivery
series:
  id: delivery-after-ai
  title: Delivery after AI
  part: 7
---

[One engineer, an AI, and 890 pull requests](/blog/building-a-platform-with-claude/) has a big number in the title.
It's a good headline. As a measure of anything, it's useless.

I could have done the same work in 200 pull requests, or in 2,000. The count depends on how I chose to split the
work, not on how much got done or whether any of it mattered.

That's true of several numbers teams still put on dashboards.

## Numbers that stopped meaning anything

**Pull requests per engineer per week.** I can split a task into so many pull requests it's funny. If the number
goes up when someone splits their work more finely, it measures habits, not output. Don't measure things that have
no impact.

**Story points.** Estimates were always partly a guess at how long the typing would take, and the typing is the
part that changed. I asked an AI how long it would take to build a new service. It said a day and a half. It took
ten minutes, was live in production ten minutes after that, and had significantly more features than the version
I'd have built by hand. A sprint planned in story points is planning around a cost that has mostly gone.

**Strict work-in-progress limits.** These existed because people lose time switching between tasks. I now regularly
work on five separate issues at once, each in its own thread. Strictly speaking I'm not working on five things.
I'm supervising five very fast, very keen colleagues who never need a coffee break. It's basically babysitting,
except the toddlers write Terraform.

The limit that matters now is how many threads one person can review and steer well, not how many tickets are
marked "in progress".

## The two numbers I watch

**Time to change.** How long it takes for an idea to become something running in production. This is broader than
the usual lead time, which starts at the commit. Now that the code takes minutes, most of the time is spent before
the commit: deciding what to build, waiting for a decision, waiting for a slot. That's where the delays hide, so
that's where the measurement has to start.

**Change failure rate.** How much of what ships gets reverted or reworked. It's the counterweight to speed. Shipping
twice as often doesn't help if half of it comes back. Rework counts too: a feature that was
[correct but not good](/blog/is-waterfall-back/) and had to be rebuilt is a failed change, even if nothing broke.

Together they answer the two questions that matter. How quickly can we act on an idea, and how often do we get it
right?

## On "10x engineers"

Most productivity claims about AI count output: lines of code, pull requests, tickets closed. They miss the point.

Writing code was never the hard part. It was sometimes one of the slow parts. The hard part has always been knowing
what code to write, when, and why. AI has made the slow part fast. It hasn't made the hard part easy.

What it has done is make experiments cheap. When building something takes ten minutes, you can try three approaches
and keep the best one, or build the feature and see whether anyone uses it, instead of arguing about it for a week.
That's the real change, and it doesn't show up in a pull request count.

## What to do instead

1. **Take pull request counts and story points off the dashboard.** If you need estimates for planning, estimate the
   decisions and dependencies, not the typing.
2. **Measure time to change from the idea, not the commit.** Find where ideas wait, and fix that.
3. **Measure change failure rate, including rework.** Speed without it is just churn.
4. **Make experiments normal.** If an idea is cheap to build, build it and look, then keep it or bin it.

The number in my headline was 890. The numbers I'd actually stand behind are how quickly an idea reached
production, and how little of it had to come back.
