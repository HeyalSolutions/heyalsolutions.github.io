---
title: "Your CI pipeline is your most senior reviewer"
description: "The judgement a senior engineer applies by eye, such as how apps use secrets, who they can talk to and how they call each other, only scales once it's written down as a check. With AI writing the code, that's no longer optional."
pubDate: 2026-12-16
heroImage: ../../assets/blog/generated/ci-senior-reviewer.jpg
heroAlt: "Pull requests passing through a pipeline of policy checks, with one stopped by a pink marker before it reaches the cluster"
category: leadership
tags: [ai, ci, policy-as-code, kyverno, contract-testing, engineering-process]
service: infrastructure-and-delivery
cta: delivery
series:
  id: delivery-after-ai
  title: Delivery after AI
  part: 4
---

In [What comes after code review](/blog/what-comes-after-code-review/) I said that when nobody reads every line,
the checking moves into the pipeline. That raises an obvious question: what goes into it?

The answer is the judgement your most senior engineers apply when they review. Most of it never gets written down.

## The judgement that lives in people's heads

Watch a senior engineer review a change to a platform and you'll see them catch things no linter does. A secret
passed in the wrong way. An app reaching out to a service it has no business talking to. A network rule that's
wider than it needs to be.

None of that is in the code being reviewed. It's in their head: the platform's expectations, built up over years
of seeing what goes wrong. That works while there are enough senior engineers and they have time to read
everything. It stops working when changes arrive faster than they can read.

## Platform expectations as policy

On the platform I've been building, those expectations live in [Kyverno](https://kyverno.io/), a policy engine for
Kubernetes. Each policy encodes one expectation about how workloads should behave:

- how apps use secrets;
- which other apps they're allowed to talk to;
- what networking they're allowed to set up.

A policy is short and readable. This one, adapted from Kyverno's sample library, says secrets are mounted as files
rather than passed in as environment variables:

```yaml
apiVersion: kyverno.io/v1
kind: ClusterPolicy
metadata:
  name: secrets-not-from-env-vars
spec:
  validationFailureAction: Enforce
  rules:
    - name: secrets-not-from-env-vars
      match:
        any:
          - resources:
              kinds: [Pod]
      validate:
        message: "Mount secrets as volumes, not environment variables."
        pattern:
          spec:
            containers:
              - name: "*"
                =(env):
                  - =(valueFrom):
                      X(secretKeyRef): "null"
```

The important part is where it runs. The same policies the cluster enforces also run as a CI check, against the
rendered manifests, on every pull request. A team finds out its change breaks a platform rule in the pull request,
before it touches a cluster. Not at deploy time, and not from a reviewer who happened to notice.

It's the same idea as [the CI gate that fails when a table can leak](/blog/multi-tenancy-isolation-ci-gate/) in the
multi-tenancy series, one layer down.

## Why AI makes this urgent

An AI writes code the way most code it learned from is written. That's open source and everything else that's
public, and most of it wasn't written with security or compliance first. It works, it looks reasonable, and it
doesn't know your rules.

So an AI will happily read a secret into an environment variable, or leave a network open, because that's what
thousands of examples do. A reviewer reading 30 pull requests a day will catch some of those. A policy catches
every one, the same way, every time, and it doesn't get tired at the end of the day.

The check isn't there because the AI is bad. It's there to encode best practice that the AI has no way of knowing
is yours.

## Between services: contract tests

Policies cover how a workload behaves on the platform. The other judgement I most often find living only in a
senior engineer's head, on client teams, is how a service calls the rest of the system. What it sends, what it
expects back, and which changes on the other side would break it.

That's what contract testing is for. Each service's expectations of the services it calls are written down as
tests, and run against the provider in CI, so a change that would break a caller fails before it merges. The
senior engineer who "just knows" that changing a field will break the billing service gets to stop being the only
safeguard.

## How to find your checks

1. **Read your last few hundred review comments.** Anything that comes up again and again is a check waiting to be
   written.
2. **Ask the incident question.** After anything goes wrong, ask what check would have caught it, and how early.
3. **Start by warning, then enforce.** Run a new policy in audit mode first, see what it would have blocked, fix
   the noise, then make it fail the build.

Your most senior reviewer should be the one that reads every pull request, never gets tired and applies the same
standard every time. It's only as good as what your senior engineers write into it, which makes writing those
checks one of the most valuable things they can spend their time on.
