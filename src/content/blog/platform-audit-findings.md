---
title: "What we find when we audit a Kubernetes platform"
description: "The ten things that turn up again and again when we first look at a team's Kubernetes, Terraform and pipelines, why they matter, and the smallest useful fix for each."
pubDate: 2026-11-07
heroImage: ../../assets/blog/generated/platform-audit.jpg
heroAlt: "A magnifying glass over a grid of cluster nodes, with a few highlighted in amber"
draft: true
---

A lot of our work starts the same way. A team has a Kubernetes platform that works, mostly, but it's slower, more
expensive or more fragile than it should be, and they'd like someone to look at it with fresh eyes.

Every platform is different, but the findings are remarkably consistent. These are the ten that turn up most often,
roughly in order of how often we see them. None of them are signs of a bad team. They're what happens when a platform
grows faster than the time anyone has to look after it.

For each one there's a quick way to check your own platform, and the smallest fix that makes a real difference.

<!-- TODO: an opening line about how many platforms this is based on, if you're happy to share a number -->

## 1. Terraform that doesn't match reality

**What we see:** `terraform plan` on a supposedly up-to-date environment shows a page of changes nobody can explain.
Someone fixed something in the console during an incident, a security group got edited by hand, or an apply failed
halfway months ago. Now nobody wants to run `apply`, because nobody knows what it'll do.

**Why it matters:** Infrastructure as code only helps if the code is true. Once people stop trusting the plan, changes
go back to the console, and the drift gets worse.

**Check yours:** Run a plan against every environment. If any of them isn't clean, you have drift.

**Smallest fix:** Run a scheduled plan in CI every night and alert on any change. Then work through the existing drift
one resource at a time, deciding whether the code or the console is right. Once plans are clean, keep them that way.

<!-- TODO: a real example of drift you've found, e.g. a hand-edited security group -->

## 2. Pipelines with admin keys

**What we see:** Long-lived AWS access keys stored as CI secrets, attached to a user with `AdministratorAccess`. Often
they were created by someone who has since left, and nobody knows what else uses them.

**Why it matters:** Those keys are the most valuable secret you have. Anyone who can change a workflow file, or any
compromised dependency in your build, can use them.

**Check yours:** In IAM, look for users with access keys, and when each key was last used and rotated. The IAM
credential report has all of this in one CSV.

**Smallest fix:** Switch CI to OIDC, so pipelines get short-lived credentials and there's nothing to leak. GitHub
Actions, GitLab and most other CI systems support it. Then scope the role down, and give pull request plans a separate
read-only role. We covered the setup in
[Bootstrapping a private EKS cluster](/blog/bootstrapping-private-eks-argocd/#step-1-let-github-actions-into-aws-without-keys).

## 3. Clusters several versions behind

**What we see:** Clusters two or three minor versions behind, often in extended support. The last upgrade was painful,
so the next one keeps getting pushed back.

**Why it matters:** Extended support costs six times as much for the control plane, and the catch-up gets harder the
longer you leave it, since you can only move one version at a time. Add-ons and Helm charts fall behind too, and
eventually you can't upgrade one without the other.

**Check yours:** Compare each cluster's version with the
[EKS release calendar](https://docs.aws.amazon.com/eks/latest/userguide/kubernetes-versions.html).

**Smallest fix:** Upgrade non-production now, on its own, to learn what breaks. Then put upgrades on a schedule. We
wrote up [how we approach EKS upgrades](/blog/eks-upgrades-without-drama/).

## 4. Resource requests that don't match usage

**What we see:** Either no resource requests at all, or requests copied from a template and never revisited. Most
often it's the second: pods requesting a full CPU and 2 GB of memory while using a tenth of that.

**Why it matters:** The scheduler and the autoscaler both work from requests, not usage. Requests that are too high
mean you pay for nodes that sit idle. Requests that are missing mean noisy neighbours and pods getting evicted under
memory pressure.

**Check yours:** Compare requests with actual usage across the cluster. `kubectl top pods -A` gives a rough snapshot,
and your metrics stack can give you the trend. A cluster where usage is under 30% of requests has room to shrink.

**Smallest fix:** Set requests from observed usage, with headroom. Run the Vertical Pod Autoscaler in recommendation
mode to get suggested values without it changing anything. Set memory limits equal to memory requests, and think hard
before setting CPU limits at all, since they cause throttling even when the node has CPU to spare.

<!-- TODO: a real before/after number, e.g. "one client went from 40 nodes to 14" -->

## 5. Surprising network costs

**What we see:** NAT gateway charges that rival the cost of the clusters. Every image pull, every S3 request and every
call to an AWS API goes out through the NAT gateway and back, charged per gigabyte.

**Why it matters:** NAT data processing is charged on everything that passes through it, even traffic to AWS services
in the same region. A cluster that pulls large images often, or reads a lot from S3, can rack up thousands a month in
NAT charges alone.

**Check yours:** In Cost Explorer, filter on the `NatGateway-Bytes` usage type. If it's a big number, find out what's
sending the traffic with VPC flow logs.

**Smallest fix:** Add a gateway endpoint for S3, which is free and takes S3 traffic off the NAT gateway entirely.
Then add interface endpoints for whatever else is heavy, usually ECR. Pulling images through a cache in the same region
helps too.

## 6. Secrets in the wrong places

**What we see:** Secrets in Helm values files, in Git, or in Kubernetes Secrets that someone created by hand and nobody
can recreate. Sometimes all three for the same secret.

**Why it matters:** A Kubernetes Secret is base64-encoded, not encrypted. Secrets in Git are in every clone, forever.
And secrets created by hand are lost when the cluster is.

**Check yours:** Search your repos for anything that looks like a credential (gitleaks or trufflehog will do it), and
list the Secrets in each cluster that aren't managed by anything.

**Smallest fix:** Pick one source of truth, such as AWS Secrets Manager, and sync from it with External Secrets. Move
the most sensitive secrets first. Anything that has ever been in Git should be rotated, not just moved. There's an
example setup in our [Day 2 post](/blog/private-eks-day-2/#step-4-one-secret-store-and-a-first-real-secret).

## 7. Everyone is cluster-admin

**What we see:** One shared kubeconfig, or every engineer mapped to `system:masters`. Access was set up in a hurry when
the cluster was new and never revisited.

**Why it matters:** It makes every mistake a potential outage, and it makes it impossible to tell from the audit log
who did what.

**Check yours:** On EKS, list the access entries (or the `aws-auth` ConfigMap on older clusters) and see who gets which
policy.

**Smallest fix:** Give people access through your identity provider, with their own identity. Make read-only the
default, and keep admin for a small group or for break-glass. On EKS, move from `aws-auth` to access entries, which are
managed through the AWS API and so can live in Terraform.

## 8. Deploys that cause downtime

**What we see:** Single-replica deployments, no readiness probes, and no PodDisruptionBudgets. Every deploy, node
upgrade or autoscaler scale-down causes a short outage, which has become normal enough that nobody mentions it.

**Why it matters:** These outages are small, but they add up, and they make every change feel risky. Teams start
deploying less often, which makes each deploy bigger and riskier still.

**Check yours:** Look for Deployments with one replica, containers without a readiness probe, and workloads without a
PDB. Then watch what happens to error rates during a deploy.

**Smallest fix:** For anything user-facing: at least two replicas, a readiness probe that checks the app can actually
serve, and a PDB with `maxUnavailable: 1`. Add a `preStop` sleep of a few seconds, so the load balancer stops sending
traffic before the pod shuts down. A policy engine like Kyverno can then warn when new workloads are missing them.

## 9. Monitoring nobody looks at

**What we see:** Plenty of dashboards and plenty of alerts, all going to a Slack channel that everyone has muted.
Meanwhile, the first sign of a real outage is a customer emailing support.

**Why it matters:** Alerts that fire all the time teach people to ignore alerts. And the ones that matter get lost in
the noise.

**Check yours:** Count how many alerts fired last week, and how many of them someone acted on.

**Smallest fix:** Delete or silence every alert that nobody acts on. Then add a few that page on symptoms users would
notice, like error rates and latency for the main user journeys, rather than causes like CPU usage. Fewer, better
alerts beat more of them every time.

## 10. Backups nobody has restored

**What we see:** Backups configured for databases and clusters, sometimes with Velero, but never tested. Sometimes the
Terraform state bucket doesn't have versioning turned on, so a bad apply or an accidental delete is unrecoverable.

**Why it matters:** An untested backup is a guess. The time you find out it doesn't work is the time you need it.

**Check yours:** When was the last time someone restored something from backup, end to end, and timed it? Is
versioning on for your state buckets?

**Smallest fix:** Turn on versioning for state buckets today. Then schedule a restore test, even just once a quarter,
of your most important database to a scratch environment. Write down how long it took. If your clusters are built from
Git, test rebuilding one too. That's often the fastest disaster recovery plan there is.

## The common thread

Most of these come from the same place. The platform was built quickly, it worked, and the team moved on to the next
thing. Nobody had time to go back. None of the fixes above need a rewrite, and most of them are a few days' work each.
The hard part is making the time.

If you'd like someone to go through your platform and tell you which of these apply, and which to fix first, that's
exactly what our [platform reviews](/services/reviews-and-training/) cover. [Get in touch](/contact/).
