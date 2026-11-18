---
title: "A SaaS platform at home, Part 2: We fixed a memory problem and the API server paid for it"
description: "Giving one pod memory requests left Talos's out-of-memory controller a new favourite victim: kube-apiserver. Why it happened, the one-line ranking rule that fixed it, and the alerts that now catch it first."
pubDate: 2026-12-17
heroImage: ../../assets/blog/generated/home-oom.jpg
heroAlt: "A row of pods ranked by memory, with a crosshair settling on the control-plane pod at the end"
tags: [kubernetes, talos, memory, incidents, homelab]
service: platform-engineering
series:
  id: home-platform
  title: "A SaaS platform at home"
  part: 2
cta: platform
---

Staging's smoke test failed halfway through with "forbidden", on a change that had nothing to do with permissions.
The cause was a fix we'd made the day before.

## What happened

A node on staging ran short of memory. Talos, the Kubernetes OS we run, has its own out-of-memory controller that
steps in before the kernel does and kills a pod's whole cgroup to free memory. Its log said:

```
[talos] OOM controller triggered
[talos] Sending SIGKILL to cgroup … /kubepods/burstable/pod74df081d…
```

That pod was `kube-apiserver`. Every controller in the cluster lost its connection, the smoke test's next request
came back refused, and the page went out.

## Why the API server

Talos ranks pods by quality-of-service class, then by memory: BestEffort pods (no requests at all) first, then the
Burstable pod using the most memory.

The day before, we'd given `cilium-envoy` memory requests. It had been BestEffort, and the controller had killed it
twice that week. With requests set, there were no BestEffort pods left on the node. The next pick was the biggest
Burstable pod, and on a control-plane node that's the API server, at about 3 GB.

So the fix for one victim chose the next one, and the next one was the worst possible pick.

## The fix

Talos lets you replace the ranking with your own expression. The kubelet's static pods (the API server, controller
manager and scheduler) are easy to spot: their pod ids are a 32-character hash with no dashes, while every other pod
has a dashed UUID. So they score zero, and everything else keeps Talos's default ranking:

```
memory_max.hasValue() || path.matches("/pod[0-9a-f]{32}$") ? 0.0
  : ({Besteffort: 1.0, Burstable: 0.5, Guaranteed: 0.0,
      Podruntime: 0.0, System: 0.0}[class] * double(memory_current.orValue(0u)))
```

Now a workload pod goes first, and the control plane only if nothing else is left. `talosctl validate` compiles the
expression, so a typo fails before it reaches a node. It's a runtime setting, so nodes don't reboot to apply it.

## What it doesn't fix

It doesn't make more memory. The node still spikes into its limit; it just loses something cheaper when it does.
The real fix is sizing, and for that you need to know it's happening.

## The checks that came out of it

The rule we follow is that when something breaks late, we add the check that would have caught it as early and
cheaply as possible. This one gave us three alerts:

- **Node memory nearly full**: pods using over 90% of a node's allocatable memory for 15 minutes. Pages.
- **Container killed for memory**: a container ended `OOMKilled`, or with exit code 137, which on Talos usually
  means the OOM controller. Opens a ticket.
- **Controller restart storm**: containers in three or more namespaces exiting with errors within ten minutes, which
  is what losing the API server looks like from outside. Pages.

The first fires before the controller does. The other two say what happened when it fires anyway, with a runbook
that starts at `talosctl dmesg` rather than at the smoke test's confusing "forbidden".

## The lesson

Giving pods requests is right. But the OOM killer always picks someone, and every change to requests changes who.
Decide who should never be picked, and say so explicitly, before the kernel decides for you.
