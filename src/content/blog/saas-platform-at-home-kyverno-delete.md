---
title: "A SaaS platform at home, Part 3: The security policy that wouldn't let us delete anything"
description: "Retiring an app left its namespaces stuck in Terminating for hours, and stalled every deploy behind them. Two admission policies were checking deletes as well as creates. How one denied delete froze a GitOps pipeline, and the fix."
pubDate: 2027-01-05
heroImage: ../../assets/blog/generated/home-kyverno-delete.jpg
heroAlt: "A namespace box stuck half-faded, with a shield in front of its last remaining object"
tags: [kubernetes, kyverno, argo-cd, gitops, incidents, homelab]
service: platform-engineering
series:
  id: home-platform
  title: "A SaaS platform at home"
  part: 3
cta: platform
---

We retired an app from staging: removed its install from Git and let Argo CD prune it. Hours later its two
namespaces were still `Terminating`, and nothing newer had deployed anywhere on the cluster.

## What we saw

Each namespace had a condition explaining itself:

```
NamespaceDeletionContentFailure: … admission webhook "validate.kyverno.svc-fail"
  denied the request: resource NetworkPolicy/…/ai-relay-egress was blocked …
  restrict-install-netpol: peers-in-own-install
```

and the same for a CiliumNetworkPolicy in the other namespace.

Deleting a namespace deletes everything in it, one object at a time, through the API server like any other
request. Two of our Kyverno policies matched DELETE as well as CREATE and UPDATE. One of the NetworkPolicies no
longer passed the current rules (it had been grandfathered in, reported in audit mode), and the other was a policy
the cluster generates itself. Kyverno refused to delete them, so the namespace couldn't finish deleting.

## How one denied delete froze everything

The app-of-apps Application in Argo CD, which renders every other Application, was waiting for those namespaces to
go before finishing its sync. Until it finished, it didn't move to newer commits. So every merge to `main` after
that point sat in Git, and staging's per-commit smoke check was stuck on an old commit.

<div style="overflow-x: auto">
<svg viewBox="0 0 760 140" role="img" aria-labelledby="kd-diagram-title" style="min-width: 640px; width: 100%; height: auto; font-family: inherit">
  <title id="kd-diagram-title">A chain of five boxes: the app is removed from Git, Argo CD prunes its namespaces, the namespace deletes its NetworkPolicy, Kyverno denies the delete, and the app-of-apps waits forever so no newer commit deploys.</title>
  <defs>
    <marker id="kd-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M0 0 10 5 0 10z" style="fill: var(--color-brand-500)"/>
    </marker>
  </defs>
  <g style="font-size: 13px; fill: var(--color-ink-900)">
    <rect x="10" y="40" width="130" height="60" rx="10" style="fill: var(--color-surface); stroke: var(--color-ink-300)"/>
    <text x="75" y="66" text-anchor="middle" style="font-weight: 600">App removed</text>
    <text x="75" y="84" text-anchor="middle" style="fill: var(--color-ink-600); font-size: 12px">from Git</text>
    <rect x="160" y="40" width="130" height="60" rx="10" style="fill: var(--color-surface); stroke: var(--color-ink-300)"/>
    <text x="225" y="66" text-anchor="middle" style="font-weight: 600">Argo CD</text>
    <text x="225" y="84" text-anchor="middle" style="fill: var(--color-ink-600); font-size: 12px">prunes namespaces</text>
    <rect x="310" y="40" width="130" height="60" rx="10" style="fill: var(--color-surface); stroke: var(--color-ink-300)"/>
    <text x="375" y="66" text-anchor="middle" style="font-weight: 600">Namespace</text>
    <text x="375" y="84" text-anchor="middle" style="fill: var(--color-ink-600); font-size: 12px">deletes its policy</text>
    <rect x="460" y="40" width="130" height="60" rx="10" style="fill: var(--color-ink-100); stroke: var(--color-accent-400); stroke-width: 2"/>
    <text x="525" y="66" text-anchor="middle" style="font-weight: 600">Kyverno</text>
    <text x="525" y="84" text-anchor="middle" style="fill: var(--color-ink-600); font-size: 12px">denies DELETE</text>
    <rect x="610" y="40" width="140" height="60" rx="10" style="fill: var(--color-surface); stroke: var(--color-ink-300)"/>
    <text x="680" y="66" text-anchor="middle" style="font-weight: 600">App-of-apps</text>
    <text x="680" y="84" text-anchor="middle" style="fill: var(--color-ink-600); font-size: 12px">waits, nothing ships</text>
    <g style="stroke: var(--color-brand-500); stroke-width: 2; fill: none">
      <path d="M140 70H158" marker-end="url(#kd-arrow)"/>
      <path d="M290 70H308" marker-end="url(#kd-arrow)"/>
      <path d="M440 70H458" marker-end="url(#kd-arrow)"/>
      <path d="M590 70H608" marker-end="url(#kd-arrow)"/>
    </g>
  </g>
</svg>
</div>

A security policy on two objects in an app nobody used any more had stopped every deploy to the cluster.

## The fix

The two policies now match `CREATE` and `UPDATE` only:

```yaml
match:
  any:
    - resources:
        kinds: [NetworkPolicy]
        operations: [CREATE, UPDATE]
```

Removing a network policy can't widen what an install can reach; in a namespace that defaults to deny, it can only
narrow it. Validating deletes was protecting nothing. Several of our other policies already scoped their
operations this way, which is how we knew it was safe. These two had simply been written without it.

Once the change synced, both namespaces finished deleting by themselves, the app-of-apps completed its sync, and
staging caught up with `main`.

## The checks that came out of it

- **A rule for policy authors.** A validating policy states its operations. If it guards what something *can do*,
  DELETE is almost never one of them.
- **An alert for a blocked deploy.** We now join Argo CD's sync metrics with Kyverno's denials by namespace, so "an
  Application can't sync because an admission policy keeps refusing it" pages, rather than showing up as a quiet
  staging that's hours behind.

## The lesson

Admission policies sit on every path through the API server, including the ones you don't think of as changes: a
namespace deleting its contents, a controller cleaning up, a finalizer finishing. Fail-closed policies are the
right default, which is exactly why each one should be as narrow as what it protects.
