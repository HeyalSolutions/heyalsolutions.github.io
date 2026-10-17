---
title: "Introducing Arkade - The Kubernetes app installer"
description: "A CLI with strongly-typed flags to install charts and apps to your cluster in one command."
pubDate: 2020-02-28
heroImage: ../../assets/blog/arkade-headline.png
heroAlt: "arkade headline image"
changes: "arkade has grown well beyond installing apps (arkade get now downloads dozens of CLI tools), and its app list, flags and defaults have changed. Tiller belonged to Helm 2, which reached end of life in 2020."
---

## Arkade! What is it?

[Arkade (ark for short)](https://get-arkade.dev) provides a clean CLI with strongly-typed flags to install charts and apps to your cluster in one command.

It's written in Golang and supported by [Alex Ellis](https://twitter.com/alexellisuk) and the [OpenFaaS Community](https://www.openfaas.com/).

I added the cert-manager, openfaas-ingress, kubernetes dashboard and docker-registry-ingress apps! Big thanks to Alex 
and the rest of the community for contributing all the other amazing apps.

### What's it for?
Installing apps on Kubernetes, this is a list of the currently supported apps:

```sh 
$ arkade install 

You can install: 
 - openfaas
 - nginx-ingress
 - cert-manager
 - openfaas-ingress
 - inlets-operator
 - metrics-server
 - chart
 - tiller
 - linkerd
 - cron-connector
 - kafka-connector
 - minio
 - postgresql
 - kubernetes-dashboard
 - istio
 - crosspane
 - mongodb
 - docker-registry
 - docker-registry-ingress
Run arkade install NAME --help to see configuration options.

```

Wow! That's a lot of apps! 

### Let's take a look 
The arkade cli is the [easiest installation method for OpenFaaS on kubernetes](https://docs.openfaas.com/deployment/kubernetes/#a-deploy-with-arkade-fastest-option).
I am going to show you just how easy it is to get OpenFaaS installed and ready to work using this cli. 
 
I have a Kubernetes cluster on DigitalOcean ready to go, with kubectl configured on my laptop.

We could install the basic default configuration like this:
```sh 
$ arkade install openfaas
```


However, I'm going to set an override for the Helm installation, so our functions scale down to 0 when they are idle, saving 
cluster resources. In the full helm command we would use `--set faasIdler.dryRun=false`, as you can see from the command below
we just pass the same flag in. Easy as that!

```sh 
$ arkade install openfaas --set faasIdler.dryRun=false
```

That should output the below message, showing it worked! 
```sh 
=======================================================================
= OpenFaaS has been installed.                                        =
=======================================================================

# Get the faas-cli
curl -SLsf https://cli.openfaas.com | sudo sh

# Forward the gateway to your machine
kubectl rollout status -n openfaas deploy/gateway
kubectl port-forward -n openfaas svc/gateway 8080:8080 &

# If basic auth is enabled, you can now log into your gateway:
PASSWORD=$(kubectl get secret -n openfaas basic-auth -o jsonpath="{.data.basic-auth-password}" | base64 --decode; echo)
echo -n $PASSWORD | faas-cli login --username admin --password-stdin

faas-cli store deploy figlet
faas-cli list

# For Raspberry Pi
faas-cli store list \
 --platform armhf

faas-cli store deploy figlet \
 --platform armhf

# Find out more at:
# https://github.com/openfaas/faas

Thanks for using arkade!

```


That's a lot deployed in one small command. We now have OpenFaaS installed in our cluster, ready for us to deploy serverless functions, microservices or containers.

> Note: You don't even need to remember all that information. Arkade has a command to print the info for any app again!
> ```sh 
> $ arkade info openfaas
> ```


With two more `arkade` commands we can set up TLS and ingress from the internet:

```sh 
$ arkade install cert-manager --wait
$ arkade install openfaas-ingress \
    --email example@example.com \
    --domain openfaas.example.com

```
> The wait flag can be used to wait for the helm chart to install and be ready before moving on to the next command.

So now we have OpenFaaS, cert-manager and some ingress records set up. Once DNS points at this 
cluster, we get a Let's Encrypt TLS certificate, so our installation is now secured on the 
`https://openfaas.example.com` domain.

Now that is actually it. We have OpenFaaS installed and secured with TLS in three commands, but let's go through an example
function to validate the installation.

Let's grab the OpenFaaS CLI:

```sh
$ curl -sSL https://cli.openfaas.com | sudo sh

# We need to login, so let's grab our password and login
$ export OPENFAAS_URL="https://openfaas.example.com"
$ PASSWORD=$(kubectl get secret -n openfaas basic-auth -o jsonpath="{.data.basic-auth-password}" | base64 --decode; echo)
$ echo $PASSWORD | faas-cli login --username admin --password-stdin
```

Now we can deploy an example function

```sh 
$ faas-cli store deploy figlet

# And test it out with

$ echo "IT'S WORKING" | faas-cli invoke figlet

 ___ _____ _ ____   __        _____  ____  _  _____ _   _  ____ 
|_ _|_   _( ) ___|  \ \      / / _ \|  _ \| |/ /_ _| \ | |/ ___|
 | |  | | |/\___ \   \ \ /\ / / | | | |_) | ' / | ||  \| | |  _ 
 | |  | |    ___) |   \ V  V /| |_| |  _ <| . \ | || |\  | |_| |
|___| |_|   |____/     \_/\_/  \___/|_| \_\_|\_\___|_| \_|\____|

```

### Where has it come from?

It was spun out of the [k3sup](https://github.com/alexellis/k3sup) codebase to allow the `k3sup` cli to be lean and focused
on creating [k3s](https://k3s.io/) clusters.

While the `k3sup app install` commands work on any Kubernetes cluster, there were some people who wouldn't even look at 
its functionality because they thought it was just for k3s clusters. It's not! It installs helm charts and applications
onto any kubernetes cluster using strongly typed flags and sensible defaults, while still allowing users to set the more
obscure helm flags when they need to.

This new direction will allow the `arkade` cli to be more focused on providing cluster admins with the abstractions to 
let them move faster with more safety. 

### Get involved

[Arkade](https://github.com/alexellis/arkade) is on github, so pop over and give it a star to show your support. 

You can find the developers through the [OpenFaaS community](https://docs.openfaas.com/community/) to talk about new 
features, how you can contribute and more.
