---
title: "Build, then agree"
description: "When a change costs less than the conversation about it, the conversation should happen around the change itself. Where to draw the line, and what to do when the process still won't move."
pubDate: 2026-11-21
heroImage: ../../assets/blog/generated/build-then-agree.jpg
heroAlt: "A long row of discussion bubbles before a small piece of code, above a small piece of code followed by one comment, a pink tick and a flat line"
category: leadership
tags: [ai, engineering-process, pull-requests, delivery]
service: infrastructure-and-delivery
cta: delivery
series:
  id: delivery-after-ai
  title: Delivery after AI
  part: 1
---

I've started to feel uneasy in a very specific situation: watching a team spend longer talking about a change than it would take to make it.

You know the pattern. Someone spots a small problem. A ticket gets written. It's refined, estimated and discussed in a meeting. A few people weigh in on a thread. A week later the change gets approved, and it takes twenty minutes to do.

That always felt a bit wasteful. Now it feels wrong, because the cost of making the change has collapsed while the cost of deciding about it hasn't moved at all.

## What changed

Most of our delivery process was designed for a world where building things was expensive. If a change took a developer three days, it made sense to spend an hour making sure it was the right change. Deliberation was cheap compared with the work.

AI has flipped that ratio. For a large class of changes, such as a config tweak, a small refactor, a new endpoint or a fix to a flaky test, writing the code now takes minutes. Often the quickest way to answer "should we do this?" is to do it and look at the result.

The process didn't get the memo. We still treat a change as something to agree on before it exists, even when the change is cheaper than the agreement.

## What the process is actually protecting

To be fair to the committee, the cost of *writing* a change was never the only cost. Someone still has to own it. Process often guards things that haven't got any cheaper:

- **Understanding.** Someone has to know why the change exists, and that person may not be the one who made it.
- **Operations.** Someone gets paged at 3am if it goes wrong.
- **Visibility.** Other people need to know it happened, especially if it touches their area.
- **Priority.** Even a cheap change takes attention, and "should we do this at all?" is a real question.
- **Trust.** Some teams don't yet trust AI-written code, and more speed makes that worse rather than better.

So AI hasn't removed the need for care. It has moved the bottleneck from writing to reviewing and deciding. The problem is that most teams are still optimising for the old bottleneck.

## Where to draw the line

The most useful test I know is Amazon's distinction between one-way and two-way doors. The question isn't how big a change is. It's how easy it is to walk back.

| Two-way doors: build first | One-way doors: agree first |
| --- | --- |
| Internal refactors | Data migrations |
| Changes behind a feature flag | Public API contracts |
| Config and tooling tweaks | Security and permission boundaries |
| New internal endpoints | Anything that deletes or rewrites data |
| Test and CI fixes | Pricing, billing and customer-facing promises |

For one-way doors, slowing down is still the right call, however quickly the code appeared. For two-way doors, consensus before code is mostly ceremony. Being wrong is cheap, and the code itself is a better basis for discussion than a ticket description.

## Build, then agree

For two-way doors, I think the default should flip from "agree, then build" to "build, then agree". In practice that looks like this:

1. **Make the PR the proposal.** Instead of writing a ticket describing a change, open a pull request containing it. People can react to something real. The description says why the change exists, so the reason outlives the person who made it, and the PR is where someone can still say "not now".
2. **Keep it small.** A diff someone can review in five minutes gets a decision in five minutes. Because the change was cheap to make, closing it should be cheap too. If "no" isn't a normal outcome, you've just moved the queue from tickets to pull requests.
3. **Ship it dark.** Put anything with user impact behind a flag, so merging and releasing are separate decisions.
4. **Bring the way back.** Include a rollback plan, even if it's one line. It turns "what if this goes wrong?" into a solved problem.
5. **Write the ticket afterwards.** If someone needs a paper trail for planning or audit, link it to the merged change.

None of this skips review. It changes what gets reviewed, from a description of an idea to the idea itself.

## When it still doesn't change

Sometimes you do all of this and the team still wants to talk first. In my experience, that's rarely about speed. It usually points to one of three things:

- **Unclear decision rights.** Nobody is sure who is allowed to say yes, so everyone has to.
- **Low trust.** In the tools, in each other, or in the safety net of tests and monitoring.
- **Incentives.** Tickets closed and meetings attended are visible. Problems quietly fixed often aren't.

Those are worth naming directly, because faster tooling won't fix them. If anything, the gap between how fast we *can* change things and how slowly we *decide* to will just keep growing.

## The question I'm left with

I don't think the answer is "move fast and skip the process". The answer is to ask what each step in the process is protecting, and whether it still needs protecting in the same way.

When a change costs less than the conversation about it, the conversation should be about the change itself, with the code in front of us.

I'm curious whether others are feeling the same unease, or whether I'm missing something the process is quietly protecting. What does it take to get a twenty-minute fix into production where you work? Tell me on [LinkedIn](https://www.linkedin.com/in/alistair-hey/).
