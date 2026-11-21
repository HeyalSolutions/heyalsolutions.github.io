---
title: "Who gets paged for code nobody wrote?"
description: "When an AI writes most of the code, the person on call can't have read it. They never could have read all of it. What on-call looks like when the job is understanding the system, and an agent triages the alert before you've finished reading it."
pubDate: 2026-12-30
heroImage: ../../assets/blog/generated/who-gets-paged.jpg
heroAlt: "An alert splitting three ways: into a code fix, into a corrected alert, and into a single pink line that pages a person"
category: leadership
tags: [ai, on-call, incidents, observability, engineering-process]
service: platform-engineering
cta: platform
series:
  id: delivery-after-ai
  title: Delivery after AI
  part: 6
---

[Build, then agree](/blog/build-then-agree/) listed the things a slow process protects that haven't got any
cheaper. One of them was operations: someone still gets paged at 3am if it goes wrong.

So who is that someone, when an AI wrote the change and nobody read it line by line?

On the platform I've been building, it's me. Just me. Here's what that looks like, and what I think it means for
teams.

## Nobody understands all the code

The worry behind the question is that the person on call won't understand the code that broke. That's true. It was
also true before AI.

Nobody on a team of any size understands all of its code. On-call has always relied on knowing the system: what
talks to what, what normal looks like, where to look first, and what's safe to do in a hurry. AI makes that more
obvious, because the share of code anyone has personally read is now much smaller. It doesn't change what the
person on call needs to know.

So my rule is simple. The person on call needs to understand the system and its runbooks, not the code. Every alert
on the platform has a runbook, 114 of them, saying what it means and what to check first.

## An agent triages first

In staging, every alert goes to an agent before it goes to me. The agent looks at what fired and decides between
three outcomes:

1. **A code fix is needed.** It finds the change that caused it and fixes it, through a pull request like any other
   change.
2. **It's flaky.** The alert or the test is wrong, not the system, so the alert or test needs changing.
3. **A person is needed.** Then the pager goes off.

The agent only does this in staging. That's deliberate. Staging is where most problems should show up, and it's
the right place to build trust in an agent's judgement before anything else.

## What the alerts actually are

Most alerts come from one of two places.

**Code changes.** Something merged and broke something. With the change identified, these are usually quick fixes.

**Capacity.** The platform runs on a homelab with no autoscaling, so it runs out of room in ways a cloud
cluster wouldn't. [We fixed a memory problem and the API server paid for it](/blog/saas-platform-at-home-oom-api-server/)
is one example.

Then there's the third kind, which is the most important to deal with: **flaky tests.** A timeout that's slightly
too short, or a race condition that fails one run in fifty. The tempting fix is to retry until it passes. The right
fix is a better test. An alert or a test that cries wolf teaches everyone to ignore it, and then it's worse than
having nothing.

## Your on-call buddy

The biggest change isn't the triage. It's what happens when a person does get paged.

By the time you've read the alert title, an AI working alongside you can have found the change that caused it, read
the logs, and suggested a fix or a way to stop the damage. Searching for the right dashboard and reading through
recent commits stops being the slow part.

What's left for the person is judgement. Is the suggested fix right? Is the mitigation safe? Should this wait until
morning? Those are system questions, which is why understanding the system matters more than knowing the code.

## What on-call needs now

1. **A runbook for every alert.** Written for whoever picks it up, whether that's a person or an agent.
2. **Every alert ends in one of three places.** A fix to the code, a fix to the alert or test, or a person. Nothing
   gets acknowledged and forgotten.
3. **Fix flakiness, don't retry it.** Treat a flaky test or a noisy alert as a bug.
4. **Start the agent in staging.** Let it triage where mistakes are cheap, and widen what it does as you learn to
   trust it.
5. **Keep the system's story written down.** The person on call needs to know why things are the way they are,
   which is what [decision records](/blog/decision-records-are-the-new-code-review/) are for.

Who gets paged for code nobody wrote? The same person as always: someone who understands the system. The difference
is they no longer face it alone.
