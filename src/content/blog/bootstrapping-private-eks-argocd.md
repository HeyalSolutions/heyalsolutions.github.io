---
title: "Bootstrapping a private EKS cluster with Argo CD"
description: "Terraform for a private-endpoint EKS cluster, GitHub Actions with OIDC, and how to install Argo CD when your pipeline can't reach the Kubernetes API."
pubDate: 2026-10-17
heroImage: ../../assets/blog/generated/eks-private-argocd.jpg
heroAlt: "A dashed, padlocked VPC boundary around a cluster of connected nodes, with a Git branch pulling into it"
tags: [kubernetes, eks, aws, argo-cd, gitops, terraform, github-actions]
service: infrastructure-and-delivery
cta: private-eks
---

A Kubernetes API server on the public internet is an attack surface most teams don't need. In regulated environments
it's often a non-starter. EKS lets you turn the public endpoint off entirely, so the API is only reachable from inside
your VPC.

That's great for security. It's less great for your pipeline. GitHub Actions can create the cluster, because Terraform
only talks to the AWS API, which is public. But the moment you want to install something *into* the cluster, the
runner has no route to the API server.

This post walks through building a private EKS cluster with Terraform and GitHub Actions, then getting Argo CD
installed so it can take over from there. All of the code is in
[HeyalSolutions/eks-private-argocd-bootstrap](https://github.com/HeyalSolutions/eks-private-argocd-bootstrap).

## The key insight: you only need to get in once

Argo CD is **pull-based**. It runs inside the cluster and pulls its desired state from Git. Once it's installed, your
pipeline never needs to talk to the Kubernetes API again. Changes go through pull requests, and Argo CD applies them.

So the private endpoint problem isn't "how does CI deploy to the cluster?". It's "how do we install Argo CD *once*?".
That's a much smaller problem.

<div style="overflow-x: auto">
<svg viewBox="0 0 760 360" role="img" aria-labelledby="eks-diagram-title" style="min-width: 640px; width: 100%; height: auto; font-family: inherit">
  <title id="eks-diagram-title">GitHub Actions calls the AWS API to run Terraform and start a CodeBuild build inside the VPC. The build installs Argo CD on the private EKS cluster, and Argo CD then pulls the cluster-resources repo from GitHub.</title>
  <defs>
    <marker id="eks-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M0 0 10 5 0 10z" style="fill: var(--color-brand-500)"/>
    </marker>
  </defs>
  <g style="font-size: 13px; fill: var(--color-ink-900)">
    <rect x="270" y="125" width="470" height="215" rx="14" style="fill: none; stroke: var(--color-accent-400); stroke-width: 1.5; stroke-dasharray: 6 5"/>
    <text x="286" y="148" style="fill: var(--color-ink-500); font-size: 12px">VPC (private subnets)</text>
    <rect x="20" y="30" width="190" height="60" rx="10" style="fill: var(--color-surface); stroke: var(--color-ink-300)"/>
    <text x="115" y="56" text-anchor="middle" style="font-weight: 600">GitHub Actions</text>
    <text x="115" y="74" text-anchor="middle" style="fill: var(--color-ink-600); font-size: 12px">no route into the VPC</text>
    <rect x="290" y="30" width="180" height="60" rx="10" style="fill: var(--color-surface); stroke: var(--color-ink-300)"/>
    <text x="380" y="56" text-anchor="middle" style="font-weight: 600">AWS API</text>
    <text x="380" y="74" text-anchor="middle" style="fill: var(--color-ink-600); font-size: 12px">public</text>
    <rect x="290" y="170" width="180" height="60" rx="10" style="fill: var(--color-surface); stroke: var(--color-ink-300)"/>
    <text x="380" y="196" text-anchor="middle" style="font-weight: 600">CodeBuild</text>
    <text x="380" y="214" text-anchor="middle" style="fill: var(--color-ink-600); font-size: 12px">bootstrap build</text>
    <rect x="540" y="170" width="180" height="140" rx="10" style="fill: var(--color-surface); stroke: var(--color-ink-300)"/>
    <text x="630" y="196" text-anchor="middle" style="font-weight: 600">EKS cluster</text>
    <text x="630" y="214" text-anchor="middle" style="fill: var(--color-ink-600); font-size: 12px">private endpoint only</text>
    <rect x="560" y="240" width="140" height="50" rx="8" style="fill: var(--color-ink-100); stroke: var(--color-ink-200)"/>
    <text x="630" y="270" text-anchor="middle" style="font-weight: 600">Argo CD</text>
    <rect x="20" y="250" width="190" height="60" rx="10" style="fill: var(--color-surface); stroke: var(--color-ink-300)"/>
    <text x="115" y="276" text-anchor="middle" style="font-weight: 600">cluster-resources</text>
    <text x="115" y="294" text-anchor="middle" style="fill: var(--color-ink-600); font-size: 12px">Git repo (Helm chart)</text>
    <g style="stroke: var(--color-brand-500); stroke-width: 2; fill: none">
      <path d="M210 60H288" marker-end="url(#eks-arrow)"/>
      <path d="M380 90V168" marker-end="url(#eks-arrow)"/>
      <path d="M470 200H538" marker-end="url(#eks-arrow)"/>
      <path d="M560 270H212" marker-end="url(#eks-arrow)"/>
    </g>
    <g style="font-size: 12px; fill: var(--color-ink-700)">
      <text x="249" y="50" text-anchor="middle">1</text>
      <text x="392" y="134">2 start build</text>
      <text x="505" y="190" text-anchor="middle">3</text>
      <text x="386" y="262" text-anchor="middle">4 Argo CD pulls from Git</text>
    </g>
  </g>
</svg>
</div>

1. GitHub Actions authenticates to AWS with OIDC and runs Terraform. Everything is created through the public AWS API.
2. The pipeline starts a CodeBuild build. CodeBuild runs *inside* the VPC.
3. The build installs Argo CD and one root Application.
4. Argo CD pulls everything else from Git, including its own configuration.

## Step 1: let GitHub Actions into AWS (without keys)

GitHub Actions can exchange a short-lived OIDC token for AWS credentials, so there are no access keys to store or
rotate. This needs an IAM OIDC provider and a role that trusts it. Both have to exist before the pipeline can run, so
they live in a small `bootstrap/` stack you apply once from your own machine. It also creates the S3 bucket for
Terraform state.

The important part is the trust policy. Only this repository's `main` branch and its pull requests can assume the role:

```hcl
resource "aws_iam_openid_connect_provider" "github" {
  url            = "https://token.actions.githubusercontent.com"
  client_id_list = ["sts.amazonaws.com"]
}

data "aws_iam_policy_document" "github_trust" {
  statement {
    actions = ["sts:AssumeRoleWithWebIdentity"]

    principals {
      type        = "Federated"
      identifiers = [aws_iam_openid_connect_provider.github.arn]
    }

    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:aud"
      values   = ["sts.amazonaws.com"]
    }

    condition {
      test     = "StringLike"
      variable = "token.actions.githubusercontent.com:sub"
      values = [
        "repo:${local.github_repo}:ref:refs/heads/main",
        "repo:${local.github_repo}:pull_request",
      ]
    }
  }
}
```

The example attaches `AdministratorAccess` to keep things short. In a real setup, scope it down and use a separate
read-only role for pull request plans.

## Step 2: the VPC

The [VPC module](https://registry.terraform.io/modules/terraform-aws-modules/vpc/aws) does the heavy lifting. Three
tiers of subnets:

- **Private** subnets for nodes, internal load balancers and the CodeBuild bootstrap
- **Public** subnets for the NAT gateway and internet-facing load balancers
- **Intra** subnets for the EKS control plane's network interfaces, with no route to the internet at all

```hcl
module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "~> 6.7"

  name = local.name
  cidr = local.vpc_cidr
  azs  = local.azs

  private_subnets = [for k, v in local.azs : cidrsubnet(local.vpc_cidr, 4, k)]
  public_subnets  = [for k, v in local.azs : cidrsubnet(local.vpc_cidr, 8, k + 48)]
  intra_subnets   = [for k, v in local.azs : cidrsubnet(local.vpc_cidr, 8, k + 52)]

  enable_nat_gateway = true
  single_nat_gateway = true # one per AZ in production

  public_subnet_tags  = { "kubernetes.io/role/elb" = 1 }
  private_subnet_tags = { "kubernetes.io/role/internal-elb" = 1 }
}
```

The NAT gateway matters here. Nodes need it to pull images, and the bootstrap build needs it to download Helm charts.

## Step 3: a private EKS cluster

Version 21 of the [EKS module](https://registry.terraform.io/modules/terraform-aws-modules/eks/aws) makes the private
endpoint explicit:

```hcl
module "eks" {
  source  = "terraform-aws-modules/eks/aws"
  version = "~> 21.29"

  name               = local.name
  kubernetes_version = "1.35"

  endpoint_private_access = true
  endpoint_public_access  = false

  vpc_id                   = module.vpc.vpc_id
  subnet_ids               = module.vpc.private_subnets
  control_plane_subnet_ids = module.vpc.intra_subnets

  addons = {
    coredns                = {}
    kube-proxy             = {}
    eks-pod-identity-agent = { before_compute = true }
    vpc-cni                = { before_compute = true }
  }

  eks_managed_node_groups = {
    default = {
      ami_type       = "AL2023_x86_64_STANDARD"
      instance_types = ["m7i.large"]
      min_size       = 2
      max_size       = 5
      desired_size   = 2
    }
  }

  # ...access entries and security group rules, below
}
```

Two more pieces wire up the bootstrap. Cluster access uses **access entries** rather than the old `aws-auth`
ConfigMap. The GitHub Actions role created the cluster, but it couldn't reach it anyway, so it gets no Kubernetes
permissions. Only the bootstrap build's role does:

```hcl
  enable_cluster_creator_admin_permissions = false

  access_entries = {
    bootstrap = {
      principal_arn = aws_iam_role.bootstrap.arn
      policy_associations = {
        admin = {
          policy_arn   = "arn:aws:eks::aws:cluster-access-policy/AmazonEKSClusterAdminPolicy"
          access_scope = { type = "cluster" }
        }
      }
    }
  }

  security_group_additional_rules = {
    bootstrap_https = {
      description              = "CodeBuild bootstrap to API server"
      protocol                 = "tcp"
      from_port                = 443
      to_port                  = 443
      type                     = "ingress"
      source_security_group_id = aws_security_group.bootstrap.id
    }
  }
```

## Step 4: the pipeline

The workflow plans on pull requests and applies on `main`. `id-token: write` is what lets the job request the OIDC
token:

```yaml
permissions:
  id-token: write
  contents: read

jobs:
  terraform:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: infra
    steps:
      - uses: actions/checkout@v7

      - uses: aws-actions/configure-aws-credentials@v6
        with:
          role-to-assume: ${{ vars.AWS_ROLE_ARN }}
          aws-region: eu-west-2

      - uses: hashicorp/setup-terraform@v4
        with:
          terraform_version: 1.16.6
          terraform_wrapper: false

      - run: terraform init -input=false
      - run: terraform plan -input=false -out=tfplan

      - name: Apply
        if: github.ref == 'refs/heads/main' && github.event_name != 'pull_request'
        run: terraform apply -input=false tfplan
```

At this point we have a private cluster with nodes and nothing running on it. The pipeline can't go any further on its
own.

## Step 5: getting in. The options

There are plenty of ways to get from a GitHub-hosted runner to a private API endpoint. Approximate us-east-1 costs,
not counting the NAT gateway every option needs anyway:

| Option | How it works | Pros | Cons | Rough cost |
|---|---|---|---|---|
| **SSH jumpbox** | Public EC2 instance with port 22 open; tunnel kubectl through it | Familiar, simple | Public SSH attack surface, key management, always on | ~$7/month |
| **AWS Client VPN** | Runner connects to a managed VPN endpoint in the VPC | Fully AWS-managed; good for human access too | Expensive; certificate setup; an OpenVPN client in CI is fiddly | ~$73/month per subnet association, plus connection hours |
| **Tailscale (or similar)** | Subnet router in the VPC; the runner joins your tailnet | Very easy; great for humans; no inbound ports | Third party in your access path; another account and auth key | Free tier, plus a ~$3/month router instance |
| **SSM port forwarding** | Instance with no inbound ports; tunnel to the API endpoint via Session Manager | No open ports; IAM-controlled; audited in CloudTrail | Standing instance; Session Manager plugin in CI; kubeconfig needs a `tls-server-name` override | ~$3/month |
| **Lambda in the VPC** | Terraform invokes a function that runs `helm install` | Effectively free; pure Terraform; nothing left running | You have to package `helm` into the function; harder to debug; 15-minute limit | ~$0 |
| **CodeBuild in the VPC** | The pipeline starts a build; the buildspec runs `helm` inside the VPC | Effectively free; nothing left running; plain shell script; logs in CloudWatch | Another AWS service; a minute or so of start-up | ~$0.02 per run |

There's also a way to skip the problem altogether: **EKS Capabilities** can run a managed Argo CD for you, operated by
AWS and able to reach a private cluster. It's a good fit if you're happy for AWS to own Argo CD. It wasn't what we
wanted here, because we want Argo CD to manage *itself* from Git like every other component. It also needs IAM
Identity Center for sign-in.

We went with **CodeBuild**. It ties with Lambda on cost, but there's nothing to package: the bootstrap is a readable
shell script, and the logs land in CloudWatch.

## Step 6: the CodeBuild bootstrap

The CodeBuild project has no source. Its buildspec is passed in from Terraform, and it runs in the private subnets
with its own security group (the one the EKS rule above allows in):

```hcl
resource "aws_codebuild_project" "bootstrap" {
  name          = "${local.name}-bootstrap"
  service_role  = aws_iam_role.bootstrap.arn
  build_timeout = 20

  source {
    type      = "NO_SOURCE"
    buildspec = file("${path.module}/buildspec.yml")
  }

  artifacts {
    type = "NO_ARTIFACTS"
  }

  environment {
    type         = "LINUX_CONTAINER"
    compute_type = "BUILD_GENERAL1_SMALL"
    image        = "aws/codebuild/amazonlinux-x86_64-standard:6.0"

    environment_variable {
      name  = "CLUSTER_NAME"
      value = module.eks.cluster_name
    }
    environment_variable {
      name  = "ARGOCD_CHART_VERSION"
      value = "10.10.5"
    }
    environment_variable {
      name  = "CLUSTER_RESOURCES_REPO"
      value = local.cluster_resources_repo
    }
    environment_variable {
      name  = "DEPLOY_KEY"
      type  = "SECRETS_MANAGER"
      value = data.aws_secretsmanager_secret.deploy_key.arn
    }
  }

  vpc_config {
    vpc_id             = module.vpc.vpc_id
    subnets            = module.vpc.private_subnets
    security_group_ids = [aws_security_group.bootstrap.id]
  }
}
```

Its IAM role needs `eks:DescribeCluster` (for the kubeconfig), read access to the deploy key secret, CloudWatch Logs,
and the EC2 network interface permissions CodeBuild uses to attach to the VPC. The full policy is
[in the repo](https://github.com/HeyalSolutions/eks-private-argocd-bootstrap/blob/main/infra/bootstrap.tf).

The buildspec does four things: writes a kubeconfig, creates the repo credentials so Argo CD can read the private
`cluster-resources` repo, installs Argo CD with Helm, and applies one root Application. It only does this **once**.
If the `argocd` Helm release already exists, Argo CD is managing itself and a default install would fight with it:

```yaml
version: 0.2

env:
  shell: bash
  variables:
    HELM_VERSION: v4.3.1
    KUBECTL_VERSION: v1.35.9

phases:
  install:
    commands:
      - curl -fsSL "https://get.helm.sh/helm-${HELM_VERSION}-linux-amd64.tar.gz" | tar -xz -C /tmp
      - install /tmp/linux-amd64/helm /usr/local/bin/helm
      - curl -fsSLo /usr/local/bin/kubectl "https://dl.k8s.io/release/${KUBECTL_VERSION}/bin/linux/amd64/kubectl"
      - chmod +x /usr/local/bin/kubectl

  build:
    commands:
      - aws eks update-kubeconfig --name "$CLUSTER_NAME"
      - kubectl get nodes

      # (writes root-app.yaml, the Application in step 7)

      - |
        set -eo pipefail
        if helm status argocd --namespace argocd >/dev/null 2>&1; then
          echo "Argo CD already installed; nothing to do."
        else
          kubectl create namespace argocd

          kubectl create secret generic cluster-resources-repo \
            --namespace argocd \
            --from-literal=type=git \
            --from-literal=url="$CLUSTER_RESOURCES_REPO" \
            --from-literal=sshPrivateKey="$DEPLOY_KEY" \
            --dry-run=client -o yaml \
            | kubectl label --local -f - argocd.argoproj.io/secret-type=repository -o yaml \
            | kubectl apply -f -

          helm upgrade --install argocd argo-cd \
            --repo https://argoproj.github.io/argo-helm \
            --version "$ARGOCD_CHART_VERSION" \
            --namespace argocd \
            --wait --timeout 10m

          kubectl apply -f root-app.yaml
        fi
```

Back in the workflow, a second job starts the build through the AWS API and waits for it:

```yaml
  bootstrap:
    needs: terraform
    if: github.ref == 'refs/heads/main' && github.event_name != 'pull_request'
    runs-on: ubuntu-latest
    steps:
      - uses: aws-actions/configure-aws-credentials@v6
        with:
          role-to-assume: ${{ vars.AWS_ROLE_ARN }}
          aws-region: eu-west-2

      - name: Bootstrap Argo CD
        env:
          PROJECT: ${{ needs.terraform.outputs.bootstrap_project }}
          LOG_GROUP: ${{ needs.terraform.outputs.bootstrap_log_group }}
        run: |
          build_id=$(aws codebuild start-build --project-name "$PROJECT" --query 'build.id' --output text)

          while true; do
            status=$(aws codebuild batch-get-builds --ids "$build_id" --query 'builds[0].buildStatus' --output text)
            [ "$status" != "IN_PROGRESS" ] && break
            sleep 15
          done

          # CodeBuild names the log stream after the build ID (the part after the colon)
          aws logs tail "$LOG_GROUP" --log-stream-name-prefix "${build_id#*:}" --since 1h || true

          if [ "$status" != "SUCCEEDED" ]; then
            echo "::error::Bootstrap build finished with status $status"
            exit 1
          fi
```

It runs on every push to `main`, but thanks to the guard it's a no-op once Argo CD is installed. It costs a couple of
cents, and a brand new cluster gets bootstrapped automatically.

## Step 7: Argo CD manages itself

The root Application points at the `cluster-resources` repo, a Helm chart whose templates are themselves Argo CD
Applications (the "app of apps" pattern):

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: cluster-resources
  namespace: argocd
spec:
  project: default
  source:
    repoURL: git@github.com:my-org/cluster-resources.git
    targetRevision: main
    path: .
  destination:
    server: https://kubernetes.default.svc
    namespace: argocd
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
```

One of those templates is an Application for **Argo CD itself**. It uses the same chart and the same release name
(`argocd`) as the bootstrap install, so it adopts the resources Helm created rather than creating new ones:

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: argocd
  namespace: argocd
spec:
  project: default
  source:
    repoURL: https://argoproj.github.io/argo-helm
    chart: argo-cd
    targetRevision: {{ .Values.argocd.chartVersion | quote }}
    helm:
      releaseName: argocd
      valuesObject:
        {{- toYaml .Values.argocd.values | nindent 8 }}
  destination:
    server: https://kubernetes.default.svc
    namespace: argocd
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
    syncOptions:
      - ServerSideApply=true # Argo CD's CRDs are too big for client-side apply
```

From here on, Argo CD's configuration lives in `cluster-resources/values.yaml`. Upgrading Argo CD is a pull request
that bumps `chartVersion`. Every other add-on (cert-manager, ingress controllers, external-secrets, monitoring) is
another template in the same chart, following the same pattern.

## Things to watch out for

- **Keep the bootstrap chart version in step.** The bootstrap installs `ARGOCD_CHART_VERSION`, and Git then says what
  it should be. If they drift, a new cluster briefly runs the older version until Argo CD syncs itself.
- **The bootstrap guard is load-bearing.** Without it, every pipeline run would reinstall Argo CD with default values
  and fight with the self-managed configuration.
- **Humans still need a way in.** CI doesn't need cluster access any more, but people sometimes do. SSM port
  forwarding or a VPN (from the table above) works well for break-glass `kubectl`, with its own access entry.
- **Use a deploy key or GitHub App for Argo CD.** It should have read-only access to `cluster-resources`. The example
  stores a deploy key in Secrets Manager, created by the one-time `bootstrap/` stack so it exists before the first run.

## Wrapping up

A private EKS endpoint doesn't have to mean self-hosted runners, VPNs in CI or a bastion you have to babysit. Because
GitOps is pull-based, you only need to get inside the VPC once, and a CodeBuild build started from the pipeline does
that for a couple of cents. After that, Git is the only way changes reach the cluster.

The full example, including the IAM policies and the `cluster-resources` chart, is at
[HeyalSolutions/eks-private-argocd-bootstrap](https://github.com/HeyalSolutions/eks-private-argocd-bootstrap).
