---
title: "What comes after code review"
description: "I merged 870 pull requests in a month and read almost none of them line by line. The checking didn't stop. It moved into screenshots, CI, continuous tests in staging and production, and a short list of changes a person still reads in full."
pubDate: 2026-12-02
heroImage: ../../assets/blog/generated/after-code-review.jpg
heroAlt: "A row of pull requests passing through automated checks, with one lifted out of the line and outlined in pink for a person to read"
category: leadership
tags: [ai, code-review, testing, ci, engineering-process]
service: infrastructure-and-delivery
cta: delivery
series:
  id: delivery-after-ai
  title: Delivery after AI
  part: 2
---

In [One engineer, an AI, and 890 pull requests](/blog/building-a-platform-with-claude/) I wrote that a human
merges every change. What I didn't dwell on is how little of the code that human read.

Of the 870 pull requests merged in that month, I read almost none line by line. The ones I did read all touched
security. I skimmed the rest, looked at screenshots for anything with a UI, and relied on the checks for
everything else.

That sounds reckless. I think it's where most teams are heading, and that the useful question isn't whether
people should read every line. It's where the checking goes when they don't.

## Reading every line was always a sample

Line-by-line review made sense when people wrote code slowly. A reviewer could keep up, and a second pair of eyes
was the best check available.

At 30 pull requests a day, that stops being true. Reading everything either becomes the bottleneck, so changes
queue up waiting for a reviewer, or it turns into a rubber stamp. The rubber stamp is the worse outcome, because
it looks like assurance and isn't.

There's a second problem. Some bugs only exist when the code runs. A reviewer can read a diff carefully, find
nothing wrong, and be right about the diff while the system still breaks.

## Where the checking went

On the platform build, the checking moved to four places.

**Pictures, not diffs.** Any pull request that changes what someone sees carries screenshots: light and dark, at
phone width, in the states that matter. I review what the change does, not how it's written.

**CI that runs the system.** Pull request checks bring up a local Kubernetes cluster with
[kind](https://kind.sigs.k8s.io/) and deploy into it. That caught problems a diff never shows, because it's the
first time the change meets everything else.

**Continuous testing in staging.** Tests run against staging after every merge, followed by smoke tests that check
the basics still work. This found the most interesting problems. Several were ordering errors in Argo CD
deployments, where resources were applied in the wrong order. Each pull request was fine on its own. The problem
only showed up when they ran together, and nobody reading the diffs would have caught it.

**Continuous tests in production.** Some tests keep running in production to check the guardrails are still in
place. They don't test features. They test that the things which must never happen still can't.

When one of these catches something late, the first fix is the cheapest check that would have caught it earlier.
Over time, more of the checking moves left, into the pull request.

## Where a person still reads every line

Two kinds of change still get a full human read:

- **Security.** Authentication, permissions, secrets, and anything that changes who can see or do what.
- **Changes that can't be undone.** Database migrations, anything that deletes or rewrites data, and anything
  else where "roll it back" isn't an option.

These are the one-way doors from [Build, then agree](/blog/build-then-agree/). Everything else is a two-way door.
If it's wrong, it gets reverted, and running the code is a better check than reading it.

## Where this is going

I think line-by-line review will become rare. It will be kept for the changes where data could be lost or
security could be weakened. Almost every other change can be reversed, and for those, review time is better spent
on the checks than on the diff.

That only holds if a few things are true:

- **Rollback is real.** A two-way door has to open both ways. If reverting a change takes a day, it isn't a
  two-way door.
- **Staging is close to production.** The Argo CD ordering errors were caught because staging deploys the same way
  production does.
- **The checks are trusted.** If people routinely re-run red builds until they go green, the checks aren't doing
  the job reading used to do.

## Where to start

You don't need an AI writing your code to try this. Two changes help any team:

1. **Write down your one-way doors.** Make the paths that hold migrations, authentication and permissions
   need a named reviewer, using CODEOWNERS or your platform's equivalent. Everything else can go through on green
   checks and a skim.
2. **Ask a different question after incidents.** Not "why didn't the reviewer spot this?", but "what check would
   have caught this, and how early?"

Review doesn't go away. It moves to the places it actually catches things.
