---
title: "The platform team's new job"
description: "When product teams can point an AI at your internal platform and get it to do almost anything, what breaks first isn't CI capacity. It's people using the platform in ways nobody intended, without talking to you. What platform teams should do about it."
pubDate: 2027-01-13
heroImage: ../../assets/blog/generated/platform-team-new-job.jpg
heroAlt: "Lines of work flowing along a paved path with guardrails, and one line veering off the edge stopped by a pink section of rail"
category: leadership
tags: [ai, platform-engineering, internal-platforms, guardrails, engineering-process]
service: platform-engineering
cta: platform
series:
  id: delivery-after-ai
  title: Delivery after AI
  part: 8
---

When product teams start building with AI, I expected the first thing to break on the platform side to be
capacity. On my own platform it was: in
[One engineer, an AI, and 890 pull requests](/blog/building-a-platform-with-claude/), the CI runners became a queue
and nothing went green for hours.

On the internal platforms I've worked on with other teams, what breaks first is different. It's people.

## Creative ways around the rules

Faster teams don't just ship more. They try more things, and some of those things are ways around the platform's
rules. They use the platform for things it wasn't built for, or in ways nobody expected.

AI makes this much easier. Anyone can point their AI at the internal platform's codebase and ask it to make
something work. It will find a way. It doesn't know whether that way is supported, and the person asking often
doesn't understand what it did either. I've seen some genuinely creative workarounds come out of that.

Each one works on the day. The problem comes later, when the platform changes underneath it and something nobody
on the platform team knew about breaks.

## Nobody talks to the platform team

The frustrating part is that it doesn't have to happen this way. The platform teams I've worked with run office
hours, post regular updates, publish release notes, and document everything they support. People still don't
talk to them first.

I think part of the reason is that trying is now faster than asking. In [Build, then agree](/blog/build-then-agree/)
I argued that for changes that are easy to undo, building first is the right default. For a team's own code, it
is. But a workaround on a shared platform isn't easy to undo, because the person who has to undo it isn't the
person who built it. It's a one-way door for somebody else.

## What the job becomes

### Find out what people actually do

Platform teams now need to spend much more time researching how the platform is really used. Not how the docs say
it's used, or how it was designed to be used, but what teams are actually running on it and why. Every workaround
is a sign of a need the platform doesn't meet yet.

### Be clear about what's supported

Say plainly what the platform supports and what it expects from the teams using it. And say just as plainly that
workarounds and undocumented uses aren't supported and may break without warning.

That isn't a threat. It's the honest position, and it gives people a reason to have the conversation first. The
message is simple: if you need something the platform doesn't do, talk to us before you build around it.

### Build guardrails and patterns, not exceptions

The longer-term fix is to make the supported way the easy way:

- **Guardrails** that stop unsupported uses early, ideally in CI before anything reaches a cluster.
  [Your CI pipeline is your most senior reviewer](/blog/ci-is-your-most-senior-reviewer/) covers how.
- **Patterns** that show the right way to do common things: templates, examples and reference setups that teams
  can copy.

Patterns matter more now than they used to, because AI copies what it finds. If someone points their AI at your
platform and the clearest example it finds is a good pattern, that's what it will build. If the clearest example is
someone else's workaround, it'll build that instead.

## From ticket queue to guardrails

[Signs your platform team has become a ticket queue](/blog/platform-team-ticket-queue/) was about platform teams
that do everything on request. AI pushes teams in the other direction: nobody waits for the platform team any more,
whether or not they should.

Neither extreme works. The platform team's new job sits in between. It decides what's supported, makes that the
easiest path, puts guardrails on the rest, and keeps finding out what people actually need, so there's less reason
to go around it.
