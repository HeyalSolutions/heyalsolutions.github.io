---
title: "First look at loft.sh using GitOps"
description: "Installation and configuration of loft.sh with Flux"
pubDate: 2022-03-15
heroImage: ../../assets/blog/loft.jpg
heroAlt: "Container in the sky"
changes: "Loft has since refocused on vCluster (loft.sh now redirects to vcluster.com), so the product, Helm chart, CLI and docs referenced here have changed. Flux's documentation has also moved to fluxcd.io/flux."
---

## The problem
I spend my days building bespoke kubernetes platforms for companies. They aim for consolidation and increased standardisation.
Often the companies are transitioning from on-prem to cloud and the first step on this journey for many organisations is to
give every team its own cloud account. 

This leads to every team choosing different technology to deploy, build, run, monitor and debug their systems. These usually range
from click-ops (using the console) to fully automated systems using in-house tooling and scripts, and everything between.

You can already see the problem... Nobody can move teams without re-learning how to build, ship and run their systems. There is
no standard documentation. Infosec can't easily integrate and provide good-practice patterns and alerting across the organisation.

This then leads to a period of consolidation and building "Standards". These unwieldy documents describe what and why things should be done.
They often don't specify HOW they should be done. The reason? Every team's setup is different. There are 50, 100, different ways 
things are being done. 

## The Idea
Wouldn't it be better to provide one way to do something, that one way already has the security, logging and monitoring 
tools built-in? In comes the need for a consolidated platform. Companies usually land on Kubernetes because it can be "Multi-cloud" (A topic for another day).

The problem with this is building it. Unlike with the cloud where your provider manages the day-to-day operations of your 
underlying platform (from managing disk damage with servers to managing the entire platform like with serverless), Kubernetes 
requires you to build, customize and run it. 

The additional challenge is that Kubernetes as a platform is complex, infinitely customizable and expensive (because the people
who know how to build and run these systems are in high demand!)

## The solution

I have spent several years building bespoke PaaS offerings on kubernetes for large organisations, think 100s-1000s developers and 10s-100s of teams.

Every time there is a base level of "stuff" that needs building/configuring to run even a basic multi-tenant cluster. 
- Network Isolation
- Authentication
- RBAC
- Tenant Isolation
- Policy Enforcement
- Resource limits
- Financial reporting (cost allocation)

The list goes on... but you get the idea. These things take time (and therefore money) to build and configure.

As Kubernetes use becomes more widespread there needs to be a better way to lay down these building blocks. I've been thinking for
a long time that this should be packaged up and productised. We shouldn't be building the same things every time we want 
multi-tenant kubernetes!

Looks like [loft.sh](https://loft.sh) have done just that. I'm going to go through installing loft.sh on a new kubernetes 
cluster with [Flux](https://github.com/fluxcd/flux2) using GitOps techniques, just like I would do for work.

## Getting started

Get authenticated with a new Kubernetes cluster, I'm using a [Civo](https://civo.com) k3s cluster.

Install the Flux CLI [using their instructions](https://fluxcd.io/flux/get-started/), and set up your GitHub token and user.


Once configured this should show a similar output

```sh 
$ flux check --pre
► checking prerequisites
✔ Kubernetes 1.22.2+k3s1 >=1.20.6-0
✔ prerequisites checks passed

```

Then we can install Flux2, which should create a github repo, install the flux controllers and start reconciling against 
that repo. This means changes we make in that repository will be reflected in the cluster.

```sh 
flux bootstrap github \
  --owner=$GITHUB_USER \
  --repository=loft-resources \
  --branch=main \
  --path=./clusters/dev \
  --personal
```

The bootstrap command above does the following:

- Creates a git repository `loft-resources` on your GitHub account
- Adds Flux component manifests to the repository
- Deploys Flux Components to your Kubernetes Cluster
- Configures Flux components to track the path `/clusters/dev/` in the repository

Now we can clone that repository

```sh 
git clone https://github.com/$GITHUB_USER/loft-resources
cd loft-resources
```

Once inside that repository we can create a Helm source to add the loft Helm repo to our cluster.

```sh 
flux create source helm loft \
  --url=https://charts.loft.sh/ \
  --export > clusters/dev/loft-source.yaml
```

Next we need to set some Helm values and install the loft chart, create the following file at `loft-values.yaml` replacing your email appropriately.


```yaml
admin:
  email: demo@example.com
```


```sh
flux create hr loft \
  --target-namespace=loft \
  --create-target-namespace=true \
  --source=HelmRepository/loft \
  --chart=loft \
  --values=loft-values.yaml \
  --export > clusters/dev/loft-release.yaml
    
```

If we add everything to git and commit

```sh 

git add -A && git commit -m "Add Loft chart" && git push 

```

we should then see that loft is installed! 

Install the loft cli from [the downloads page](https://github.com/loft-sh/loft/releases) and re-set the admin password.
We need to do this because we didn't pass in a password when generating the release, the reason is that we would have to check-in the 
password.

> We could have created a secret with the password and passed it into flux's helm release as a "values-from" argument, but for simplicity we didn't.

```sh 
# run this and follow the prompt
loft reset password
```

We can login by port-forwarding the loft service

```sh 
# port forward, then go to localhost:9898 and login with your email and password
kubectl port-forward service/loft 9898:443 --namespace loft
```

navigate to `https://localhost:9898` and login

![loft image](../../assets/blog/loft-dashboard.png)


## Conclusion

This was a basic installation of [loft.sh](https://loft.sh) using Flux, we could now use the loft provided CRDs to 
build a more complex multi-tenant system. All our config is stored in Github and we could apply this same installation
to another cluster or another 10 clusters very quickly!

### Next steps 

Start to build out templates for teams to get pre-configured environments at the click of a button! 
Loft provides a set of CRDs to customize every aspect of the installation, a good start would be creating some app templates
to deliver pre-configured applications into the cluster.
