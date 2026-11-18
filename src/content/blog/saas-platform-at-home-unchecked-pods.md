---
title: "A SaaS platform at home, Part 4: Our image signature check let Pods in unchecked"
description: "A Kyverno policy meant to admit only signed images fetched every image from the registry on every admission. Under load it timed out, and a timeout meant 'allow'. Why the check was slow, what fail-open really meant, and how we made it fast and closed."
pubDate: 2027-01-07
heroImage: ../../assets/blog/generated/home-unchecked-pods.jpg
heroAlt: "A checkpoint barrier left raised while a queue of containers rolls through, one stamp clock running out"
tags: [kubernetes, kyverno, supply-chain, cosign, security, incidents, homelab]
service: platform-engineering
series:
  id: home-platform
  title: "A SaaS platform at home"
  part: 4
cta: platform
---

Every image the platform runs is signed with cosign, and a Kyverno policy checks the signature before a Pod is
admitted. It's the kind of control that looks good on a diagram. Then we looked at what it did during a busy
rollout, and found Pods that had been let in without being checked at all.

## Why the check was slow

Kyverno's image validation fetched each matched image's details from the registry, GHCR, on every admission
request. Its cache helps less than you'd hope: it only skips the signature lookup, not the image fetch, and only
when every signer in a check has signed. So each Pod cost 1 to 2.5 seconds of webhook time.

That's fine for one Pod. A rollout of every install at once is hundreds of admissions in a few minutes, plus every
Deployment, ReplicaSet and Job, because Kyverno by default also checks the controllers that create Pods. The
webhook started timing out.

## What a timeout meant

The policies were set to `failurePolicy: Ignore`, a common default chosen so that a broken Kyverno can't stop the
cluster creating Pods. We'd read it as "if Kyverno is down, don't block everything". What it actually says is
broader: if Kyverno doesn't answer in time, admit the request. Under load, "in time" stopped happening.

There was a subtlety that made it worse to reason about. When Kyverno *did* answer and the registry had returned
an error, the policy's own Deny action already refused the Pod, whatever `failurePolicy` said. So registry errors
failed closed, and only slowness failed open. The control held when the registry was broken and gave way when the
cluster was merely busy.

## The fix: fewer checks, then fail closed

Making the check stricter without making it cheaper would just have traded unchecked Pods for stuck rollouts. So
the change did both:

- **Check Pods only.** Every image runs in a Pod, so checking the Deployment, the ReplicaSet and then the Pod
  checked the same image three times. Kyverno's autogen rules are off for these policies.
- **Only when the image changes.** An UPDATE to a Pod re-checks only if an image changed, via a match condition.
- **One signer per check**, so the verify cache actually caches.
- **Fail closed where the policy denies**: `failurePolicy: Fail`, with a 30-second timeout. Audit-only policies and
  local kind clusters keep `Ignore`.

```yaml
failurePolicy: Fail
webhookConfiguration:
  timeoutSeconds: 30
autogen:
  podControllers:
    controllers: []
```

With a third of the checks and a cache that hits, admissions stay well inside the timeout, and if one doesn't,
the Pod waits rather than slipping through.

## The check that came out of it

Admission is one moment. To know nothing unsigned is *running*, we added an alert on Kyverno's background scan:
any running Pod whose image fails the signature policy pages. It would have told us about the unchecked Pods on
the day, instead of on the day we went looking.

One gap is written down rather than hidden: ephemeral debug containers (`kubectl debug`) aren't checked at
admission yet, and there's a ticket for it.

## The lesson

`failurePolicy` isn't a setting about Kyverno's health; it's what your security control does whenever it's slow.
If the honest answer is "allows anything", that's worth knowing before a busy afternoon tells you.
