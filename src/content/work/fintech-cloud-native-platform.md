---
title: From hand-built VMs to a self-service cloud native platform
client: Established financial services brand, 1,000+ engineers
sector: Financial services
summary: We led the design and build of a new AWS platform for a household-name financial services company, replacing hand-rolled VMs and manual releases with a governed, self-service Kubernetes platform.
services:
  - platform-engineering
  - infrastructure-and-delivery
results:
  - Release lead time cut from days or weeks to minutes
  - New services and environments are self-service, where they once took weeks or months 
  - The entire platform is defined in Terraform and managed through GitOps
  - Product teams deploy, scale, monitor and upgrade their own services
duration: 6–12 months
team: A small team, working alongside the client's engineers
stack:
  - AWS
  - Amazon EKS
  - Terraform
  - Flux
  - Argo CD
  - cert-manager
  - External Secrets
  - Trivy
  - Amazon RDS
  - Amazon S3
order: 1
---

## The challenge

The client is a well-known financial services company with more than a thousand engineers. Its cloud estate had grown team by team, without a common design. There was no standard way to lay out accounts or networks, no consistent governance, and no clear picture of its security posture.

Most workloads ran on hand-built virtual machines. A new environment meant raising requests with other teams and waiting weeks, sometimes months. Delivery pipelines were missing or hand-crafted, so every release was slow, manual and risky.

The business needed to modernise. The existing setup couldn't scale, and it couldn't support the pace of change the company's product teams were being asked for.

## Our approach

We were brought in to lead the design and build of a new platform from scratch. That meant setting the technical direction and choosing the technology, as well as delivering the platform itself.

### Foundations first

We started with the parts every later decision would depend on: network design, integration with the existing estate, and a consistent, governed structure for the new environment. Everything was written in Terraform from day one, so the platform could be reviewed, reproduced and audited like any other code.

### Managed Kubernetes, not a home-grown one

One of the first big decisions was whether to run Kubernetes ourselves or use a managed service. We chose **Amazon EKS**. Running control planes would have added operational work without making the platform better for the teams using it. EKS let us spend that effort on the parts engineers actually touch. Where AWS already offered a solid managed service, such as RDS for databases and S3 for storage, we used it rather than running our own.

### GitOps and a secure-by-default toolchain

Clusters and workloads are managed through GitOps with **Flux (Cluster resources)** and **Argo CD (Team's deployments)**, so what's running always matches what's in Git, and every change is reviewed and traceable. Standard CNCF tooling handles the cross-cutting concerns: **cert-manager** for certificates, **External Secrets** to pull credentials from AWS rather than storing them in repos, and **Trivy** for vulnerability scanning.

### Bringing a thousand engineers along

A platform only succeeds if people use it, and most of the client's engineers had never worked with Kubernetes. We designed the interfaces teams interact with to be deliberately small and easy to understand, so engineers could ship to the new platform without first becoming Kubernetes experts.

We built features and platform components alongside the client's engineers, pairing on real work, and ran regular training sessions. As the platform matured, the client's own engineers took on more of its development.

## The outcome

The client now has a single, standardised AWS platform defined entirely in code. Getting a change into production used to take days or weeks; now it takes hours or minutes. New services no longer wait in a provisioning queue. Teams create them through GitOps, and they're running in minutes rather than weeks or months.

Most importantly, the platform belongs to the client. Product teams deploy new services automatically, then scale, monitor and upgrade them on their own. The client's engineers understand the platform well enough to keep building on it.
