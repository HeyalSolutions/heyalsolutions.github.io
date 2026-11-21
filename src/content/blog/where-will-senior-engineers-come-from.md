---
title: "Where will the next senior engineers come from?"
description: "Junior hiring has all but stopped, just as AI removes the struggle most of us learned from. Why fundamentals matter more than ever, and why teams should keep hiring juniors anyway."
pubDate: 2027-01-20
heroImage: ../../assets/blog/generated/next-senior-engineers.jpg
heroAlt: "A path of small, uneven steps climbing upward, with the lowest steps missing and one pink step placed back at the start"
category: leadership
tags: [ai, careers, learning, hiring, engineering-culture]
service: reviews-and-training
cta: platform
series:
  id: delivery-after-ai
  title: Delivery after AI
  part: 9
---

Most of this series has been about how a team works when an AI writes most of the code. This last part is about the
people who aren't in the room: junior engineers.

Junior hiring has all but stopped. Across the teams I talk to, there's a distinct lack of it, and it's scary. Every
senior engineer, every tech lead and every engineering leader started as a junior. If nobody hires juniors now,
where does the next generation of leaders come from?

## How I learned

I learn by doing. I always have. Many evenings and weekends on the command line, breaking things and banging my head
against a problem until it gave way. A lot of it came from open source, like
[contributing to OpenFaaS](/blog/developing-openfaas/).

That struggle wasn't a side effect of learning. It was the learning. Spending an evening working out why a packet
never arrived is how you end up knowing how networks behave. It's also where instinct comes from: the sense that
something is wrong before you can say why. That's what made me say a check
[should take 15 seconds, not 15 minutes](/blog/kyverno-cli-15-minutes-to-15-seconds/).

## What AI takes away

AI removes a lot of that struggle. That's mostly good: nobody needs to suffer through boilerplate to prove a point.
But it also means you can ship something without understanding it.
[The platform team's new job](/blog/the-platform-teams-new-job/) described people pointing an AI at an internal
platform and getting it to do things they didn't understand at all. That's easy to do at any level, and it's
especially easy when you're new.

## Fundamentals matter more, not less

Look back at where this series moved the human work:

- reviewing [decisions](/blog/decision-records-are-the-new-code-review/) rather than diffs;
- understanding [the system, not the code](/blog/who-gets-paged-for-code-nobody-wrote/), when you're on call;
- deciding [the shape of a system](/blog/is-waterfall-back/) before building it.

All of that is judgement, and judgement rests on fundamentals. AI can write the code. Knowing whether it's right
needs you to understand what's underneath:

- how networks work;
- how autoscaling works, and what happens when it can't;
- how databases work;
- how to build reliable systems;
- how things fail.

Those used to be learned along the way, while writing the code. Now they have to be learned on purpose.

## Still learn by doing

The answer isn't to ban AI for juniors. It's to keep the doing. Run things, break things, and watch how they fail.
Fill up a disk. Kill a node and see what happens. Use AI to explain what you're looking at, not to skip looking.

The command line and a few evenings of frustration are still one of the best teachers there is.

## Keep hiring juniors

The most important thing teams can do is simple: don't stop hiring at junior levels.

It isn't charity. We learn from people questioning us. A junior asking "why do we do it this way?" makes a team
explain its decisions, and sometimes discover it can't. That questioning keeps senior engineers honest too,
including with themselves.

AI makes a senior engineer much more productive. It doesn't make a new senior engineer. That still takes a junior,
some time, and a team that's willing to be questioned.
