---
title: "Civo Kubernetes KUBE100: First Look at Managed k3s"
description: "What k3s is and how it differs from full Kubernetes, my experience on the beta of Civo's managed k3s service, contributing to its app marketplace, and other k3s tooling."
pubDate: 2020-01-07
heroImage: ../../assets/blog/civo-card.jpg
heroAlt: "Civo KUBE100 stickers"
changes: "The KUBE100 beta ended long ago and Civo Kubernetes is now generally available, the Civo CLI has been rewritten, OpenFaaS Cloud has been retired, and k3d's commands have changed (k3d cluster create)."
tags: [kubernetes, k3s, civo, open-source]
---

## The World's First Managed K3s

When Civo announced they were looking for Beta testers for their new managed Kubernetes offering I obviously jumped
at the chance. Free compute - never turn that down! (Thanks Civo)

#### KUBE100

Civo have been running a beta for their offering, it's called KUBE100, you can request to join [here](https://www.civo.com/kube100)

It's been great so far, there have been a few teething problems. They have all been resolved well, that's the point of a 
Beta, and Civo have been managing the process really well through a community slack group that you get access to when 
you are accepted for the beta.

Everyone is having a blast, or at least it appears that way, so well done & thanks Civo!


#### Civo cli

Civo provide a cli to manage clusters (as well as their other services). It's great, works well and is even packaged in a
docker container for those of us who don't have Ruby installed. With this it is easy to get the status of clusters, create 
new ones and even install marketplace apps.

![Civo CLI image](../../assets/blog/civo-cli.png)

### What is K3s?

According to Rancher, who took Kubernetes and made it smaller, it's a "Certified Kubernetes distribution built for IoT &
 Edge computing". You can check out the [k3s web page here](https://k3s.io) for more information.
 
What does this actually mean though? Well, it is small, really small. The master node process runs in under 500mb ram, and
worker nodes about 50mb. It's packaged for ARM64 and ARMv7 (think Raspberry Pi) and you can easily build installation 
scripts (or tools) that can detect the CPU architecture. This allows you to spin up clusters on anything from your home
raspberry pis to large bare-metal servers.

It's fast. Civo can spin up a k3s cluster for you in under 2 minutes. We will explore more on this later.

Rancher do a better job at explaining all of the features and benefits in the [docs](https://docs.k3s.io/). 
We won't dwell on this much more here; there are lots of great resources on this already.


### How is k3s different from k8s?

That's a good question. Don't immediately expect that you can deploy your application onto k3s without having to do some 
extra work. If you're coming from a managed kubernetes service provided by one of the large cloud providers you get a 
lot of integrations out of the box.

For example, the first thing I did was to install the [gitlab helm chart](https://docs.gitlab.com/charts/), which sat in 
pending forever. This is because there was no default storage provider for the persistent volumes required by many apps.
Not to worry though, Civo provide a 1 click [Longhorn installation](https://www.civo.com/learn/cloud-native-stateful-storage-for-kubernetes-with-rancher-labs-longhorn) 
which can provide the persistent volumes required. 

![civo marketplace screenshot](../../assets/blog/civo-longhorn.png)

Andy Jeffries, the Civo CTO wrote a good blog post on [K8s vs k3s](https://www.civo.com/blog/k8s-vs-k3s) which is well 
worth a read if you have the time.

## The Civo Community

I mentioned the Civo slack earlier, which is great for asking questions about their k3s offering, but it has delivered much 
more than just a beta support channel to Civo. I have seen the group help each other out more times than I could count. 
Civo have done a great job of engaging the developers that have offered to beta test the service. 

This makes sense, there's a large section on their website about how they are community focused. This doesn't always 
mean that companies with this attitude actually follow through on this and deliver their vision. 

Civo have definitely focused on this, and you can tell.

![civo website community section](../../assets/blog/civo-community.png)

## Features provided by Civo

The managed k3s service provided by Civo is great, here are my highlights:

* Marketplace apps
* DNS entry for master node, for when your nodes are recycled
* Civo CLI
* Speed of cluster creation
* Clean and friendly Web UI
* Their constant stream of [blog posts](https://www.civo.com/blog)
* Their promotion of [community content](https://www.civo.com/blog/kube100-so-far#learn-guides-and-content)

## OpenFaaS Cloud

My main use for Civo's managed k3s is a platform to deploy and develop [OpenFaaS Cloud](https://github.com/openfaas/openfaas-cloud)

OpenFaaS cloud is a self-hosted PaaS for serverless, with built in CI&CD, dashboards and Git Flow. 
Here are the main Features:

* Portable - self-host or use the hosted Community Cluster (SaaS)
* Multi-user - use your GitHub/GitLab identity to log into your personal dashboard
* Automates CI/CD triggered by git push (also known as GitOps)
* Onboard new git repos with a single click by adding the GitHub App or a repository tag in GitLab
* Immediate feedback on your personal dashboard and through GitHub Checks or GitLab Statuses
* Sub-domain per user or organization with HTTPS
* Runtime-logs for your functions
* Fast, non-root image builds using buildkit from Docker

I have been contributing to OpenFaaS Cloud and needed a place to run, test and develop my new features. I used Civo's 
service to deploy my changes when I implemented runtime logs in OpenFaaS Cloud, you can see them here

![Runtime logs](../../assets/blog/runtime-logs.jpg)

#### Get involved!
The dashboard is written in React, if anyone is interested in contributing you can reach out through [the OpenFaaS community](https://docs.openfaas.com/community/). There's also lots of Golang code involved, if you
are more comfortable with that.


## I contributed to their App installers

Their kubernetes app installers are open source. When someone on slack noticed that the postgres app wasn't working 
I pulled down the [github repository](https://github.com/civo/kubernetes-marketplace) that contains the apps and 
committed a fix. This was swiftly merged and released to production, where several other people created clusters and 
verified that the app worked.

![Civo PR](../../assets/blog/civo-pr.png)

I didn't write the initial implementation but it was easy enough to get involved and fix the issue. Thanks to the Civo 
team for getting it merged and released so quickly!

## That issue Andy fixed while at Kubecon

There was an issue that seemed to be affecting my account's ability to spin up new clusters. I mentioned that I was having
problems on the Civo slack. I needed a cluster to deploy a new OpenFaaS Cloud installation that I was testing. I was deep 
in flow and wanted a cluster quickly, I turned to one of the other providers of managed kubernetes (who shall remain nameless).

Before that new cluster had finished building [Andy from Civo](https://twitter.com/andyjeffries) had, from his chair at 
Kubecon, tracked down the issue, added code, tested his fix and deployed it into production. I was even able to spin up 
a new cluster and connect using kubectl before my backup cluster was ready. That's fast... real fast. I owe Andy a drink 
for that. 

[![twitter image Andy fixing an issue FAST!](../../assets/blog/civo-andy-tweet.png)](https://twitter.com/alistair_hey/status/1197601237505650688)

 
## The magic recipe?

#### People
From where I sit, as a user, Civo have an amazing team. Everyone is helpful, knowledgeable and committed. They also have 
a great sense of humour, take the title image for this blog for example. 

They got those cards printed for me and mailed them to me after the Kubecon fix. We were having a joke about a job title
with as many toxic recruiter buzzwords as possible. They seem to have jammed a lot onto that small business 
card. Well done...

![civo-stickers](../../assets/blog/civo-card.jpg)

If a team are working together in this way then they can do great things! Good luck guys.

#### Community

Civo, as I have mentioned, are smashing this community thing. Keep it up!

It's great to see their engagement with the community. This is a great way for them to improve the state of Cloud Native,
 a space that is rapidly expanding and where they are providing some great content, resources and products. 

## Other cool k3s projects and tooling

It wouldn't be right not to mention some of the other tools I'm finding really useful in this space.

#### k3sup
If you want to quickly spin up k3s clusters on your own hardware you can use [k3sup](https://github.com/alexellis/k3sup). It's
maintained by [Alex Ellis](https://twitter.com/alexellisuk) and has contributions from loads of other people (including 
myself). 

I can create a new k3s cluster with just 3 commands: 

First install a master k3s node like this:<br>
```sh
k3sup install --ip 192.168.0.10 --user pi 
```

Then join the two workers:<br>
```sh
k3sup join --ip 192.168.0.20 --server-ip 192.168.0.10 --user pi
k3sup join --ip 192.168.0.30 --server-ip 192.168.0.10 --user pi
```


#### Arkade
[arkade](https://get-arkade.dev) is a kubernetes app installer, it can be used to quickly install apps with a set of default config, maintained
by Alex Ellis

Install it by following the instructions in the GitHub README, then install some applications on your new cluster:

```sh 
arkade install openfaas
arkade install cert-manager
arkade install postgresql
```

It's that easy!


#### k3d

Rancher love containers, and k3s is no exception. There is a tool called [k3d](https://github.com/rancher/k3d) that 
builds k3s clusters in docker containers. It's great for testing out stuff, then deleting the clusters once you're done. 
Quick, easy, no fuss.

```sh
# Create a cluster
k3d create

# Connect to it
export KUBECONFIG="$(k3d get-kubeconfig --name='k3s-default')"
kubectl get nodes 


# Remove your cluster 
k3d delete
```

I used k3d a lot. If you have not used it then give it a try!

## Thanks for reading!

If you need help with a cloud native platform or migration, [get in touch](/contact/).
