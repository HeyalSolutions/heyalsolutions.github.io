---
title: "How To Get Started Contributing to OpenFaaS"
description: "Get started contributing to OpenFaaS"
pubDate: 2020-01-04
heroImage: ../../assets/blog/of-contributing.jpg
heroAlt: "A selection of Open Source stickers and my laptop"
changes: "Several projects listed here (OpenFaaS Cloud, ofc-bootstrap and the open-source inlets) have since been retired, k3d's commands have changed (k3d cluster create), and Go modules have replaced GOPATH. Check the current OpenFaaS contributing guide before starting."
---

## New Year New You?
Don't bother with the Gym. We all know you won't keep it up. 

Why not give back to the programming community by contributing to an open source project that you use?

When I first started out it took me a while to get my IDE set up, all the dependencies installed and then once
I had this set up, picking a github issue and getting through the Pull Request (PR) process also seemed daunting. This 
still felt like a big deal even though I raise many PRs a day at work and push code into production frequently.
For some reason this "open" and new space felt very exposed.

Fortunately, I was helped through the process by [Alex](https://github.com/alexellis), who was always helpful and 
patient with my early contributions.

This post focuses mainly on code contributions. There are other types of contributions that are just as important and 
would be welcomed. Things like documentation, user guides, blog posts and helping members of the community on slack.

There's a good section in the [OpenFaaS docs](https://github.com/openfaas/faas/blob/master/CONTRIBUTING.md) on contributing too.

#### Maintainers are amazing!

Maintaining an open source project is hard, time consuming and often done for free. There are a load of great resources
on the internet about the things maintainers face.

It might be worth you doing a small amount of reading into this, so you know what to expect from a maintainer, and what
they expect from your contribution(s).

Here are some examples:

* [My condolences, you’re now the maintainer of a popular open source project](https://danielbachhuber.com/2015/06/26/my-condolences-youre-now-the-maintainer-of-a-popular-open-source-project/) - Daniel Bachhuber
* [The Five Pressures of Leadership](https://blog.alexellis.io/the-5-pressures-of-leadership/) - Alex Ellis
* [This twitter thread](https://twitter.com/balupton/status/438928812185620480) - Benjamin Lupton


## Setting up Golang

OpenFaaS is almost exclusively written in Golang. If you're not a strong Golang developer don't worry, it's quite easy to 
pick up. However, there are other contributions you could make to get started, then ease yourself into Golang at a later
date.

I like using the Goland IDE by JetBrains, but you can use VSCode or any other IDE that has Golang support, or even Vim/Emacs.

### To install Golang

Install Go from [go.dev](https://go.dev/dl/) or with your package manager, which should sort everything out for you.

You probably want to add these lines to your .bashrc or .zshrc so that `go` is available in new terminals and after you 
reboot.

```sh
export GOPATH=$HOME/go/
export PATH=$PATH:/usr/local/go/bin/
```

If `go version` prints a version, Go is set up correctly.

## Docker & Kubernetes

You will probably need access to Docker and Kubernetes while writing contributions to OpenFaaS. You can install 
Docker by following one of the many online guides. 

If you are using Kubernetes you will need to install `kubectl`. Best check online for the most up to date installation 
method for your Operating System.

I usually use a tool called [k3d](https://github.com/rancher/k3d) for creating Kubernetes environments, it creates a 
single node k3s cluster (Kubernetes compliant) inside a docker container. 

Once you have these tools installed you can create, connect to and delete kubernetes clusters like this

```sh
# Create a cluster
k3d create

# Connect to it
export KUBECONFIG="$(k3d get-kubeconfig --name='k3s-default')"
kubectl get nodes 


# Remove your cluster 
k3d delete
```

You should now have the tools to deploy an OpenFaaS installation quickly, and reset things when you need a fresh start.

## Finding an issue to work on
The best way to find something to work on is to look through the various OpenFaaS Repositories for issues that have the 
`help wanted` or `good first issue` type labels. 

[This search](https://github.com/openfaas/faas/issues?q=is%3Aissue+is%3Aopen+label%3A%22help+wanted%22) should show 
Issues in the main `openfaas/faas` repository that have the `help wanted` label.

There are loads of other moving parts of OpenFaaS ecosystem and projects maintained by Alex from OpenFaaS that have 
various open issues, some good places to look are:

* [faas-cli](https://github.com/openfaas/faas-cli/issues?q=is%3Aissue+is%3Aopen+label%3A%22help+wanted%22) The OpenFaaS CLI
* [OpenFaaS Cloud](https://github.com/openfaas/openfaas-cloud/issues?q=is%3Aissue+is%3Aopen+label%3A%22help+wanted%22) (OFC) 
* [ofc-bootstrap](https://github.com/openfaas-incubator/ofc-bootstrap/issues) a tool for provisioning OFC Clusters
* [openfaas.github.io](https://github.com/openfaas/openfaas.github.io/issues) The OpenFaaS Website
* [k3sup](https://github.com/alexellis/k3sup/issues) A tool by Alex for bootstrapping k3s clusters
* [faas-netes](https://github.com/openfaas/faas-netes/issues) The Kubernetes specific components to OpenFaaS

And many, many more...

You can look in the [contributing guide](https://github.com/openfaas/faas/blob/master/CONTRIBUTING.md#how-can-i-get-involved)
at what types of things you can get involved with

If in doubt, reach out to [the OpenFaaS community](https://docs.openfaas.com/community/).

## Forking the repository

To get started contributing you need to create your own copy of the repository you want to contribute to. 

So, login to Github, and find the repository you are looking to contribute to then click the "fork" button.

![Fork a github repository](../../assets/blog/github-fork.png)

## Creating a branch and committing your code

Once you have [cloned your fork](https://help.github.com/en/github/getting-started-with-github/fork-a-repo) to your 
computer you need to create a branch for you to work on.

You can do this by typing `git checkout -b <branch name>`. This creates your local branch to work on.


Once you have written your contribution and written tests (if a code change) and tested the change manually you should 
commit your code, 
```sh 
git add <files you have changed or added>
# then 
git commit -s 
```

This should open a commit window in your chosen editor (Vim by default)
In this file you should write the title, leave a blank line and then a description.
[This is a good blog about commit messages](https://chris.beams.io/posts/git-commit/)

Your IDE may also provide a mechanism to commit not using the command line, so feel free to use whatever you're most 
comfortable with

## Opening your PR

Before you open a PR on github you should read the [OpenFaaS Contributing guidelines](https://github.com/openfaas/faas/blob/master/CONTRIBUTING.md).
This is a requirement for opening a PR against OpenFaaS, and you have to check a box to confirm you have read it.

Once you have finished, you need to open a Pull Request (PR) on github.

Find your fork (copy of the repository) and then go to branches page. From here there's a "New pull request" button.

You will probably find a "pull request template", a list of questions you need to answer, like why you have made this 
change, how it's been tested and the impact of the change on existing users.

If you are creating a PR that "closes" an issue then you can add `Closes #<Issue Number>` in the box and github will 
close that issue when the PR is merged!

Fill in the questions inside the pull request box and submit!
![PR Template image](../../assets/blog/pr-template.png)

## That's it

After you have raised your PR someone should take a look at it, provide feedback or suggestions and let you know the 
next steps. You may need to make a change, update some docs or re-word commit messages.

You might also want to let [the OpenFaaS community](https://docs.openfaas.com/community/) know about it.


### Check this out

Alex Ellis, the maintainer of OpenFaaS did a call in early 2019 about contributing, you can find the recording here 

[![Contributing image](../../assets/blog/how-to-contribute.png)](https://www.youtube.com/watch?v=kOgHjU38Efg&feature=youtu.be)
