---
title: "From 15 minutes to 15 seconds: fixing a Kyverno CLI slowdown with Claude"
description: "Testing 500 Kyverno policies against 5,000 Kubernetes resources took 15 minutes when it should have taken seconds. Claude found the cause in the Kyverno source in about five minutes, and the fix is now released upstream."
pubDate: 2026-12-18
heroImage: ../../assets/blog/generated/kyverno-15-seconds.jpg
heroAlt: "A long faded bar for 15 minutes above a very short pink bar for 15 seconds"
category: engineering
tags: [kyverno, kubernetes, open-source, performance, ai, ci]
service: platform-engineering
cta: platform
---

On the platform I've been building, every pull request runs our Kyverno policies against the rendered Kubernetes
manifests, before anything reaches a cluster. [Your CI pipeline is your most senior reviewer](/blog/ci-is-your-most-senior-reviewer/)
covers why.

By the time we had about 500 policies and about 5,000 resources to test, that check took 15 minutes.

That's not a CI step. That's a coffee break. And it was wrong: evaluating policies against YAML is not a 15-minute
job. It should take seconds.

## "This shouldn't take 15 minutes"

My guidance to Claude was short. I asked why it was slow, and whether it could go and work it out.

It did, in about five minutes:

1. Got the [Kyverno](https://github.com/kyverno/kyverno) source.
2. Added tracing around the CLI's evaluation path.
3. Compiled it and ran it against our policies and resources.
4. Found the call that was taking the time.
5. Wrote a small reproduction that showed the problem without our code.
6. Drafted an issue for the Kyverno project, with the reproduction and a suggested fix.

It didn't go down any dead ends. It found the cause and suggested the fix in one pass.

## What it found

The CLI was re-compiling all 500 policies for every check, instead of compiling them once and reusing the result.

Each compile is quick, which is why nobody notices on a small repository. But the cost grows with policies multiplied
by resources, not policies plus resources. At 500 policies and 5,000 resources, a small cost done repeatedly
becomes 15 minutes.

## Upstream

Claude wrote the issue in Markdown. I read it, checked it said what I wanted to say, and opened it on the Kyverno
project myself.

Someone else in the community picked up the fix, and it was merged and released. I don't know whether they used
the suggested fix or wrote their own, and it doesn't matter. The same check now takes 15 seconds, for us and for
everyone else who runs the Kyverno CLI against a lot of policies.

## Dependencies aren't black boxes any more

Before, the realistic options for a slow open source tool were to live with it or work around it: split the job
into parallel chunks, cache the output, run the check less often. Finding out why meant cloning an unfamiliar
codebase, learning how it's laid out, building it, instrumenting it and reading traces. That's hours at best, and
most teams sensibly didn't spend them.

When finding out takes five minutes, the maths flips. The workaround becomes the expensive option, because you pay
for it on every run, forever, and so does everyone else using the tool. Fixing it upstream is now the cheap option.

## What still needed a person

Three things in this story weren't Claude's:

- **Noticing.** Knowing that this should take seconds, not minutes, and not accepting a slow check as normal.
- **Deciding to look.** Asking "why?" instead of reaching for a bigger CI runner.
- **Putting my name on it.** An issue on someone else's project uses its maintainers' time. I reviewed it before it
  went out, and I'd do the same every time.

So next time a tool is slow, ask why, and give your AI the source. A reproduction and a suggested fix, sent to the
maintainers, helps everyone who uses it.
