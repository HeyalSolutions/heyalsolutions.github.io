---
title: "A SaaS platform at home, Part 1: Staging and CI on hardware under the desk"
description: "A multi-tenant platform's staging cluster, CI runners and backups on one desktop and a spare laptop: Talos, Cilium, Argo CD and Postgres operators, rebuilt from Git, with nothing configured by hand."
pubDate: 2026-12-15
heroImage: ../../assets/blog/generated/home-platform.jpg
heroAlt: "A desktop tower and a laptop under a desk, with lines rising from them into a stack of cluster layers"
tags: [kubernetes, talos, cilium, argo-cd, gitops, homelab, ci]
service: platform-engineering
series:
  id: home-platform
  title: "A SaaS platform at home"
  part: 1
cta: platform
---

A three-node staging cluster with real storage costs money every month, and most of the day it does nothing.
For the multi-tenant platform behind [Multi-tenancy by construction](/blog/multi-tenancy-shared-tables-or-database-per-tenant/),
staging and the heavy CI jobs run on hardware we already owned: one desktop and a spare laptop. Production never
runs here. Everything else does, and none of it is configured by hand.

This post is how that's laid out and why. The rest of the series is what broke.

## The hardware

| Machine | Memory | Runs |
| --- | --- | --- |
| Desktop | 64 GB | Proxmox: `staging` (3 Talos VMs, 14 GB each), `ci` (13 GB), `backup-home` (3 GB) |
| Spare Intel laptop | 32 GB | Talos on bare metal: `ci-laptop`, for the kind and database test jobs |
| Workstation | 32 GB | Runs the bootstrap. Never a dependency of anything |

Staging has three nodes because a one-node kind cluster hides exactly the failures staging exists to find: CNI
behaviour, pods moving between nodes, a Postgres failover. Every node runs [Talos](https://www.talos.dev), which has
no SSH and no shell, so there's nothing to configure by hand even if you wanted to.

There was a Raspberry Pi for backups. It stopped booting in October. `backup-home` became a small VM instead, which
is a reminder that "always on and low power" is not the same as "always on".

## From an empty disk to Argo CD

The homelab has its own repository. `make up` builds the VMs, installs Talos and Cilium on all four clusters, and
stops at "Kubernetes with a network". Secrets come from 1Password at run time; the repo holds references only.

From there the platform's own Argo CD takes over staging, and everything else comes from Git: operators,
the Gateway, OpenBao, Keycloak, Postgres clusters, the apps. The list of things created outside Git is short and
written down: the credential Argo CD reads the repo with, the image pull secret, OpenBao's unseal key, and a few
API tokens. Each has its own make target, so even the exceptions are repeatable.

<div style="overflow-x: auto">
<svg viewBox="0 0 760 330" role="img" aria-labelledby="hp-diagram-title" style="min-width: 640px; width: 100%; height: auto; font-family: inherit">
  <title id="hp-diagram-title">The desktop runs three groups of Proxmox VMs: the three-node staging cluster, the ci cluster with build runners, and backup-home with an object-locked backup bucket. The laptop runs the ci-laptop cluster with the kind and database test runners. GitHub feeds Argo CD on staging and the runners on both machines. Staging writes backups to backup-home and is reached from the internet through a Cloudflare tunnel.</title>
  <defs>
    <marker id="hp-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M0 0 10 5 0 10z" style="fill: var(--color-brand-500)"/>
    </marker>
  </defs>
  <g style="font-size: 13px; fill: var(--color-ink-900)">
    <rect x="20" y="20" width="160" height="56" rx="10" style="fill: var(--color-surface); stroke: var(--color-ink-300)"/>
    <text x="100" y="44" text-anchor="middle" style="font-weight: 600">GitHub</text>
    <text x="100" y="62" text-anchor="middle" style="fill: var(--color-ink-600); font-size: 12px">repos, Actions jobs</text>
    <rect x="580" y="20" width="160" height="56" rx="10" style="fill: var(--color-surface); stroke: var(--color-ink-300)"/>
    <text x="660" y="44" text-anchor="middle" style="font-weight: 600">Cloudflare tunnel</text>
    <text x="660" y="62" text-anchor="middle" style="fill: var(--color-ink-600); font-size: 12px">public hosts</text>
    <rect x="20" y="110" width="500" height="200" rx="14" style="fill: none; stroke: var(--color-accent-400); stroke-width: 1.5; stroke-dasharray: 6 5"/>
    <text x="36" y="304" style="fill: var(--color-ink-500); font-size: 12px">Desktop (Proxmox, 64 GB)</text>
    <rect x="40" y="145" width="150" height="145" rx="8" style="fill: var(--color-ink-100); stroke: var(--color-ink-200)"/>
    <text x="115" y="168" text-anchor="middle" style="font-weight: 600">staging</text>
    <text x="115" y="188" text-anchor="middle" style="fill: var(--color-ink-600); font-size: 12px">3 Talos nodes</text>
    <text x="115" y="206" text-anchor="middle" style="fill: var(--color-ink-600); font-size: 12px">Argo CD, platform,</text>
    <text x="115" y="222" text-anchor="middle" style="fill: var(--color-ink-600); font-size: 12px">apps, smoke Job</text>
    <rect x="205" y="145" width="140" height="145" rx="8" style="fill: var(--color-ink-100); stroke: var(--color-ink-200)"/>
    <text x="275" y="168" text-anchor="middle" style="font-weight: 600">ci</text>
    <text x="275" y="188" text-anchor="middle" style="fill: var(--color-ink-600); font-size: 12px">build and light</text>
    <text x="275" y="204" text-anchor="middle" style="fill: var(--color-ink-600); font-size: 12px">job runners</text>
    <rect x="360" y="145" width="145" height="145" rx="8" style="fill: var(--color-ink-100); stroke: var(--color-ink-200)"/>
    <text x="432" y="168" text-anchor="middle" style="font-weight: 600">backup-home</text>
    <text x="432" y="188" text-anchor="middle" style="fill: var(--color-ink-600); font-size: 12px">object-locked</text>
    <text x="432" y="204" text-anchor="middle" style="fill: var(--color-ink-600); font-size: 12px">backup bucket</text>
    <rect x="560" y="145" width="180" height="145" rx="14" style="fill: none; stroke: var(--color-accent-400); stroke-width: 1.5; stroke-dasharray: 6 5"/>
    <text x="576" y="287" style="fill: var(--color-ink-500); font-size: 12px">Spare laptop (32 GB)</text>
    <rect x="580" y="172" width="140" height="95" rx="8" style="fill: var(--color-ink-100); stroke: var(--color-ink-200)"/>
    <text x="650" y="208" text-anchor="middle" style="font-weight: 600">ci-laptop</text>
    <text x="650" y="228" text-anchor="middle" style="fill: var(--color-ink-600); font-size: 12px">kind and database</text>
    <text x="650" y="244" text-anchor="middle" style="fill: var(--color-ink-600); font-size: 12px">test runners</text>
    <g style="stroke: var(--color-brand-500); stroke-width: 2; fill: none">
      <path d="M90 76V143" marker-end="url(#hp-arrow)"/>
      <path d="M160 60C240 70 260 110 270 143" marker-end="url(#hp-arrow)"/>
      <path d="M180 40C400 40 600 110 640 178" marker-end="url(#hp-arrow)"/>
      <path d="M190 260H358" marker-end="url(#hp-arrow)"/>
      <path d="M580 60C420 70 180 90 150 143" marker-end="url(#hp-arrow)"/>
    </g>
    <g style="font-size: 12px; fill: var(--color-ink-700)">
      <text x="274" y="252" text-anchor="middle">backups</text>
    </g>
  </g>
</svg>
</div>

## Cluster services, then installs

The platform splits everything into two levels. **Cluster services** run once per cluster and are shared: Argo CD,
Kyverno, cert-manager, the Gateway, OpenBao, Keycloak, the operators and monitoring. **Installs** hold an app's data
and run its code: their own Postgres, NATS and Valkey, in their own namespaces.

A shared service still gives each install its own slice of it: a Keycloak realm, an OpenBao mount, a bucket, a
listener. The rule for which side something falls on is simple: if it holds tenant data or runs the install's
code, it's per install. That's what lets several apps share one small cluster without a second Argo CD or a
second Keycloak each, and on a 64 GB desktop that's the difference between fitting and not.

## CI moved home too

GitHub's included Actions minutes for private repos ran out in October. Rather than pay per minute, every job now
runs on self-hosted runners (Actions Runner Controller) on the same hardware: light jobs and builds on `ci`, and the
kind and Testcontainers jobs on the laptop. If the house loses power, one repository variable sends every job back
to GitHub's runners without touching a workflow.

Runner capacity is small, and that shaped how we work: PR checks are path-filtered and kept to about five minutes,
and the full install on kind runs nightly rather than on every PR.

## Backups you've actually restored

Every stateful component ships with its backup, a restore written as code, and a test of that restore. Staging's
Postgres and OpenBao back up to an object-locked bucket on `backup-home`, and every night a job restores them into
a scratch namespace and checks the data is there. A backup you haven't restored is a hope, not a backup.

## Ship fast, verify in staging

Because staging is real (three nodes, Cilium, the same charts as production), it's where changes are verified.
After every merge, Argo CD syncs and a smoke Job named after the commit waits for everything to reach it, runs the
baseline tests against staging, and checks no paging alert is firing. If it fails, the page names the commit.

That trade, fast PRs and a staging that catches what static checks can't, is what the next three parts are about.
Each is a short story of something that broke, why, and the check that now catches it earlier.

## What it costs

Electricity, and hardware that was already in the house. No availability promise: if staging is down for an
evening, nobody's affected but us. For a team that wants a real staging environment without a real staging bill,
it's a better deal than it sounds, as long as you hold yourself to the same rule as production: nothing by hand.
