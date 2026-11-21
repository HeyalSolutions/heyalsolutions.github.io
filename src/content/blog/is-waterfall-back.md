---
title: "Is waterfall back?"
description: "Building with AI, I've spent more time planning than I have in years. Not on feature specs, which are now cheap to get wrong, but on the shape of the system and the order things arrive in. Agile isn't dead, but the two-week sprint might be."
pubDate: 2026-12-09
heroImage: ../../assets/blog/generated/is-waterfall-back.jpg
heroAlt: "A small connected plan of a system on the left, with many fast parallel lines of work flowing out of it to the right"
category: leadership
tags: [ai, planning, agile, architecture, engineering-process]
service: platform-engineering
cta: platform
series:
  id: delivery-after-ai
  title: Delivery after AI
  part: 3
---

In [Build, then agree](/blog/build-then-agree/) I argued that for most changes, the quickest way to decide is to
build the thing and look at it. So here's an awkward confession. While building a platform with an AI doing most of
the typing, I spent more time planning than I have in years.

Is waterfall back?

Not quite. But the planning came back, and it moved somewhere new.

## Where the planning time went

Very little of it went on features. Almost all of it went on two things:

- **How the pieces fit together.** Platform and technology choices, how services wire together, and which choices
  would block us later. The aim was a shape that wouldn't box us in.
- **What comes first, and what follows.** The order features arrive in, because each one builds on the last.

What got much less time was the minimum viable product. The four-week MVP, or the "sprint 0" spent setting up
repositories, pipelines and environments, now ships in minutes or hours. Debating how small the first version
should be stops making sense when the first version costs an afternoon.

## The roadmap arrives early

That speed changes what needs scoping. Things that would once have sat on the roadmap for a year now arrive within
weeks. If they're going to arrive that soon, the design has to make room for them now.

In practice, that meant scoping features in immediately that I would previously have left for "later". Not in
detail, but enough to know the foundations wouldn't need ripping out to fit them.

## Getting a feature wrong is nearly free

A few times, an AI thread built something that was correct but not good. It met the brief, but the brief wasn't
tight enough. It lacked a feature, or missed the nuance of what I actually wanted.

The cost was close to nothing. A quick look at the pull request or its screenshots showed the problem, and a
complete rework took a few minutes, while many other threads carried on with their own work.

That's the important bit. Agreeing on the detail of a feature up front still isn't worth it, because getting it
wrong is cheap and quick to fix. What's expensive is getting the foundations wrong, or building things in an order
that forces a rework of everything that came after.

## What waterfall got wrong, and what it got right

Waterfall front-loaded the detail. Months of specifications for features, which turned out wrong the moment real
people used them.

This front-loads the shape instead:

| Decide up front | Build, then agree |
| --- | --- |
| Platform and technology choices | How a feature behaves |
| How the pieces wire together | What a screen looks like |
| The order features arrive in | Naming and internal structure |
| Anything that's a one-way door | Anything that's easy to redo |

The left column is expensive to change once a lot has been built on it, and a lot gets built very quickly now. The
right column is cheap to change, so it's quicker to build it and look.

## Is agile dead?

No. But the two-week sprint might be.

A sprint demo every two weeks existed to get feedback. When you can ship every day, and make hundreds of changes a
week, waiting two weeks to find out whether something was right is far too slow. The feedback loop that agile was
built around is still the point. It's just much shorter than a sprint now.

## What could work

1. **Plan the shape first.** Before building, decide the technology, how things wire together and what comes in
   what order, and write it down.
2. **Scope the long-term roadmap now.** Not in detail, just enough that the foundations can carry it, because "next
   year" might be next month.
3. **Build features fast and judge them by looking.** Review the pull request and screenshots, and redo anything
   that's correct but not good. It costs minutes.
4. **Get feedback daily, not fortnightly.** Ship small changes every day and let people react to them.

Waterfall planned in detail because building was expensive. The planning that matters now is about the shape of
the system, because that's the part that's still expensive to change.
