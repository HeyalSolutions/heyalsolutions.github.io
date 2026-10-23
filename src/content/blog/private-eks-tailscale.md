---
title: "Cluster access for a growing team with Tailscale"
description: "When SSM tunnels and AWS roles for everyone stop scaling: kubectl and internal tools on a private EKS cluster through the Tailscale operator, with Kubernetes RBAC from your identity provider and no stored secrets."
pubDate: 2026-11-14
heroImage: ../../assets/blog/generated/private-eks-tailscale.jpg
heroAlt: "Several laptops outside a padlocked VPC boundary, each joined to the cluster inside by its own line through a single gateway"
cta: private-eks
---

In [Day 2 on a private EKS cluster](/blog/private-eks-day-2/) we gave people a way into a cluster with no public API
endpoint: a small instance with no open ports, and a Session Manager tunnel through it. Every session is tied to an IAM
role and logged in CloudTrail. For a platform team of three, all of whom already have AWS access, it's ideal.

Then the team grows. Thirty developers want to check their pods' logs and open the Argo CD UI. Giving each of them an
AWS role just to run `kubectl get pods` means more IAM to manage and more people who can do things in your AWS account.
And asking them all to install the Session Manager plugin and keep a tunnel running in a spare terminal gets old fast.

This post replaces that day-to-day access with [Tailscale](https://tailscale.com). People sign in with your identity
provider, and get `kubectl` access with the Kubernetes permissions their group allows, plus a route to internal load
balancers. They don't need an AWS account, a VPN client config or a tunnel. Everything is installed by Argo CD and
configured with Terraform, and there isn't a single stored secret involved.

The code is in the same example repo,
[HeyalSolutions/eks-private-argocd-bootstrap](https://github.com/HeyalSolutions/eks-private-argocd-bootstrap).

## How it fits together

The [Tailscale Kubernetes operator](https://tailscale.com/kb/1236/kubernetes-operator) runs inside the cluster and does
two jobs for us:

- **An API server proxy.** It joins the tailnet as a device. When someone sends it a `kubectl` request, it checks who
  they are on the tailnet and forwards the request to the API server, *impersonating* that person. Kubernetes RBAC then
  decides what they can do, as if they'd authenticated directly.
- **A subnet router.** It advertises the VPC's address range to the tailnet, so people can reach internal load
  balancers like the one in front of Argo CD.

<div style="overflow-x: auto">
<svg viewBox="0 0 760 340" role="img" aria-labelledby="ts-diagram-title" style="min-width: 640px; width: 100%; height: auto; font-family: inherit">
  <title id="ts-diagram-title">A developer's laptop on the tailnet connects to two things inside the VPC: the Tailscale operator's API server proxy, which impersonates them to the private EKS API server, and the subnet router, which forwards traffic to the internal load balancer. Access is decided by the tailnet policy, managed with Terraform.</title>
  <defs>
    <marker id="ts-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M0 0 10 5 0 10z" style="fill: var(--color-brand-500)"/>
    </marker>
  </defs>
  <g style="font-size: 13px; fill: var(--color-ink-900)">
    <rect x="250" y="20" width="490" height="300" rx="14" style="fill: none; stroke: var(--color-accent-400); stroke-width: 1.5; stroke-dasharray: 6 5"/>
    <text x="266" y="43" style="fill: var(--color-ink-500); font-size: 12px">VPC (private subnets)</text>
    <rect x="20" y="140" width="180" height="60" rx="10" style="fill: var(--color-surface); stroke: var(--color-ink-300)"/>
    <text x="110" y="166" text-anchor="middle" style="font-weight: 600">Developer laptop</text>
    <text x="110" y="184" text-anchor="middle" style="fill: var(--color-ink-600); font-size: 12px">signed in with SSO</text>
    <rect x="20" y="250" width="180" height="60" rx="10" style="fill: var(--color-surface); stroke: var(--color-ink-300)"/>
    <text x="110" y="276" text-anchor="middle" style="font-weight: 600">Tailnet policy</text>
    <text x="110" y="294" text-anchor="middle" style="fill: var(--color-ink-600); font-size: 12px">managed by Terraform</text>
    <rect x="270" y="60" width="450" height="160" rx="10" style="fill: var(--color-surface); stroke: var(--color-ink-300)"/>
    <text x="290" y="84" style="font-weight: 600">EKS cluster</text>
    <rect x="290" y="100" width="170" height="50" rx="8" style="fill: var(--color-ink-100); stroke: var(--color-ink-200)"/>
    <text x="375" y="122" text-anchor="middle" style="font-weight: 600">API server proxy</text>
    <text x="375" y="139" text-anchor="middle" style="fill: var(--color-ink-600); font-size: 12px">impersonates you</text>
    <rect x="290" y="160" width="170" height="50" rx="8" style="fill: var(--color-ink-100); stroke: var(--color-ink-200)"/>
    <text x="375" y="182" text-anchor="middle" style="font-weight: 600">Subnet router</text>
    <text x="375" y="199" text-anchor="middle" style="fill: var(--color-ink-600); font-size: 12px">advertises the VPC</text>
    <rect x="540" y="100" width="160" height="50" rx="8" style="fill: var(--color-ink-100); stroke: var(--color-ink-200)"/>
    <text x="620" y="122" text-anchor="middle" style="font-weight: 600">API server</text>
    <text x="620" y="139" text-anchor="middle" style="fill: var(--color-ink-600); font-size: 12px">RBAC decides</text>
    <rect x="540" y="250" width="160" height="50" rx="8" style="fill: var(--color-surface); stroke: var(--color-ink-300)"/>
    <text x="620" y="272" text-anchor="middle" style="font-weight: 600">Internal ALB</text>
    <text x="620" y="289" text-anchor="middle" style="fill: var(--color-ink-600); font-size: 12px">argocd.internal…</text>
    <g style="stroke: var(--color-brand-500); stroke-width: 2; fill: none">
      <path d="M200 160C240 150 250 125 288 125" marker-end="url(#ts-arrow)"/>
      <path d="M200 180C240 190 250 185 288 185" marker-end="url(#ts-arrow)"/>
      <path d="M460 125H538" marker-end="url(#ts-arrow)"/>
      <path d="M460 195C520 200 560 220 600 248" marker-end="url(#ts-arrow)"/>
    </g>
    <path d="M110 250V202" style="stroke: var(--color-ink-400); stroke-width: 1.5; stroke-dasharray: 4 4; fill: none"/>
    <g style="font-size: 12px; fill: var(--color-ink-700)">
      <text x="499" y="117" text-anchor="middle">kubectl</text>
      <text x="530" y="236">HTTPS</text>
    </g>
  </g>
</svg>
</div>

Both run as pods in the cluster, installed by Argo CD like every other add-on, so there are no extra instances to
patch. Who can use them is set in the **tailnet policy**, which we'll manage with Terraform next to everything else.

## Step 1: no secrets, anywhere

Two things need to talk to the Tailscale API: Terraform in GitHub Actions, which manages the policy, and the operator,
which registers devices on the tailnet. The usual way to authenticate them is an OAuth client secret. Tailscale now
supports **workload identity federation**, which works like the GitHub-to-AWS OIDC setup from
[part 1](/blog/bootstrapping-private-eks-argocd/#step-1-let-github-actions-into-aws-without-keys). The workload shows
Tailscale a signed token from its own platform, and gets a short-lived API token back.

For GitHub Actions, the federated identities go in the one-time `bootstrap/` stack, applied from your machine. As in
part 1, there are two: one that can make changes, trusted only on `main`, and a read-only one for pull request plans:

```hcl
resource "tailscale_federated_identity" "github_apply" {
  description = "GitHub Actions apply on main"
  issuer      = "https://token.actions.githubusercontent.com"
  subject     = "repo:${local.github_repo}:ref:refs/heads/main"
  scopes = [
    "policy_file",
    "devices:core:read",
    "devices:posture_attributes",
    "dns",
    "federated_keys", # to create the operator's identity
  ]
}

resource "tailscale_federated_identity" "github_plan" {
  description = "GitHub Actions plan on pull requests"
  issuer      = "https://token.actions.githubusercontent.com"
  subject     = "repo:${local.github_repo}:pull_request"
  scopes      = ["policy_file:read", "devices:core:read", "devices:posture_attributes:read", "dns:read", "federated_keys:read"]
}
```

Applying that needs a Tailscale API key once, in `TAILSCALE_API_KEY`. Revoke it afterwards. The workflow then picks
the right identity for the event. Neither value is sensitive, so they're repository variables, not secrets:

```yaml
    env:
      TAILSCALE_OAUTH_CLIENT_ID: ${{ github.event_name == 'pull_request' && vars.TAILSCALE_PLAN_CLIENT_ID || vars.TAILSCALE_APPLY_CLIENT_ID }}
      TAILSCALE_AUDIENCE: ${{ github.event_name == 'pull_request' && vars.TAILSCALE_PLAN_AUDIENCE || vars.TAILSCALE_APPLY_AUDIENCE }}
```

With those set, the Tailscale Terraform provider finds the job's GitHub OIDC token on its own. The `id-token: write`
permission from part 1 already covers it.

The operator is neater still. Every EKS cluster has an OIDC issuer for its service account tokens, and its signing keys
are published on a public AWS URL, even when the API server itself is private. So Tailscale can verify a token signed by
the cluster without being able to reach it. The operator's federated identity trusts exactly one service account:

```hcl
resource "tailscale_federated_identity" "operator" {
  description = "Tailscale operator on ${local.name}"
  issuer      = module.eks.cluster_oidc_issuer_url
  subject     = "system:serviceaccount:tailscale:operator"
  scopes      = ["devices:core", "auth_keys", "services"]
  tags        = ["tag:k8s-operator"]
}
```

## Step 2: the tailnet policy

The tailnet policy decides who can reach what. Managing it with the `tailscale_acl` resource means access changes go
through pull requests and show up in a plan, just like IAM.

```hcl
resource "tailscale_acl" "this" {
  overwrite_existing_content = true

  acl = jsonencode({
    groups = {
      "group:platform"   = ["alice@example.com"]
      "group:developers" = ["bob@example.com", "carol@example.com"]
    }

    tagOwners = {
      "tag:k8s-operator" = []
      "tag:k8s"          = ["tag:k8s-operator"]
    }

    autoApprovers = {
      routes = {
        (local.vpc_cidr) = ["tag:k8s"]
      }
    }

    grants = [
      # kubectl through the API server proxy, as a Kubernetes group
      {
        src = ["group:developers"]
        dst = ["tag:k8s-operator"]
        ip  = ["tcp:443"]
        app = {
          "tailscale.com/cap/kubernetes" = [{ impersonate = { groups = ["developers"] } }]
        }
      },
      # ...the same for group:platform, impersonating platform-admins

      # Internal load balancers and DNS through the subnet router
      {
        src = ["group:platform", "group:developers"]
        dst = [local.vpc_cidr]
        ip  = ["tcp:443", "udp:53", "tcp:53"]
      },
    ]

    tests = [
      { src = "bob@example.com", accept = ["10.0.0.10:443"], deny = ["10.0.0.10:22"] },
    ]
  })
}
```

There's a lot packed into that, so in order:

- **Groups** are lists of people. In a real setup, sync them from your identity provider with SCIM, so leavers lose
  access when they leave the directory, not when someone remembers to edit a list.
- **Tag owners** let the operator tag the devices it creates. The operator itself is `tag:k8s-operator`, and the
  devices it creates (like the subnet router) are `tag:k8s`.
- **Auto approvers** let the subnet router advertise the VPC range without someone clicking approve in the admin
  console.
- **Grants** do the real work. The first one is the interesting part: it lets developers reach the API server proxy, and
  the `tailscale.com/cap/kubernetes` capability tells the proxy to add the `developers` Kubernetes group when it
  impersonates them. The tailnet decides which group you're in, and Kubernetes RBAC decides what that group can do.
- **Tests** run every time the policy changes. If an edit would let a developer SSH into the VPC, Tailscale rejects it.

The resource owns the whole policy file. Anything someone changes in the admin console gets put back on the next
apply, which is the point.

## Step 3: the operator, installed by Argo CD

The operator is one more Application in the `cluster-resources` chart. The client ID and audience come from a Terraform
output and get committed to `values.yaml`, the same way as the VPC ID in the Day 2 post:

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: tailscale-operator
  namespace: argocd
spec:
  project: default
  source:
    repoURL: https://pkgs.tailscale.com/helmcharts
    chart: tailscale-operator
    targetRevision: {{ .Values.tailscale.chartVersion | quote }}
    helm:
      valuesObject:
        # Workload identity federation: no client secret anywhere
        oauth:
          clientId: {{ .Values.tailscale.operatorClientId | quote }}
          audience: {{ .Values.tailscale.operatorAudience | quote }}
        operatorConfig:
          hostname: {{ .Values.cluster.name }}-k8s
        apiServerProxyConfig:
          mode: "true" # impersonate the caller's tailnet identity
  destination:
    server: https://kubernetes.default.svc
    namespace: tailscale
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
    syncOptions:
      - CreateNamespace=true
      - ServerSideApply=true
```

With `audience` set, the chart mounts a service account token with that audience into the operator's pod, and the
operator exchanges it for a Tailscale API token. There's nothing in Secrets Manager and nothing to rotate.

`apiServerProxyConfig.mode: "true"` turns on the API server proxy in **auth mode**, and gives the operator permission to
impersonate users and groups. (There's also a `noauth` mode, which forwards requests without any identity. Don't use it
for this.)

## Step 4: Kubernetes RBAC for tailnet groups

The proxy impersonates each person as their Tailscale login name, plus whatever groups their grants add. Those groups
mean nothing to Kubernetes until something binds them to a role:

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: tailscale-developers
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: view
subjects:
  - apiGroup: rbac.authorization.k8s.io
    kind: Group
    name: developers
```

`platform-admins` gets `cluster-admin` the same way. `view` is a sensible default for developers: they can see pods,
logs and events, but not Secrets, and they can't change anything. Changes still go through Git and Argo CD. If teams
need more in their own namespaces, add RoleBindings there, in the same chart.

Because every request is impersonated, the EKS audit log records the real person (`bob@example.com`), not the operator.
You get the same per-person trail you had with SSM.

## Step 5: a route to internal services

The API server proxy covers `kubectl`. For the Argo CD UI and anything else behind the internal ALB, a `Connector`
tells the operator to run a subnet router:

```yaml
apiVersion: tailscale.com/v1alpha1
kind: Connector
metadata:
  name: vpc
  annotations:
    argocd.argoproj.io/sync-options: SkipDryRunOnMissingResource=true
spec:
  hostnamePrefix: {{ .Values.cluster.name }}-vpc
  replicas: 2
  subnetRouter:
    advertiseRoutes:
      - {{ .Values.tailscale.vpcCidr }}
```

Two replicas give you high availability. If one pod is rescheduled, clients fail over to the other. (Use
`hostnamePrefix` rather than `hostname` with more than one replica, since each replica needs its own name.)

The internal zone from the Day 2 post is a public Route 53 zone, so `argocd.internal.example.com` already resolves
anywhere. It's just that the private IP it resolves to is only reachable through the subnet router. If you use a
private hosted zone instead, add **split DNS** so laptops ask the VPC's resolver about that one domain:

```hcl
resource "tailscale_dns_split_nameservers" "internal" {
  domain      = local.domain
  nameservers = [cidrhost(local.vpc_cidr, 2)] # the VPC's built-in resolver
}
```

There's another way to do this. The operator can also expose individual Services on the tailnet with its own Ingress
class, each with its own name and its own grants. That's tighter, since people get one service rather than port 443
across the whole VPC. But it means changing every Ingress. The subnet router reuses everything from the Day 2 post as it
is, which makes it the easier place to start.

## What it looks like for a developer

Install Tailscale, sign in with your company SSO, and then:

```bash
tailscale configure kubeconfig platform-k8s
kubectl get pods -n my-team
```

That's it. The kubeconfig points at the operator's tailnet name, and Tailscale handles authentication, so there's no
`aws eks get-token` and no AWS profile. `https://argocd.internal.example.com` opens in a browser. And when someone
leaves, removing them from the group in your identity provider removes their access to all of it.

## Keep SSM as the break-glass

Tailscale is now in the access path for day-to-day work, and so is the operator running inside the cluster. If the
cluster is unhealthy enough that the operator isn't running, or Tailscale itself is having a bad day, nobody can get in
through it.

That's exactly when you need to get in. So keep the SSM instance and the IAM access entry from the Day 2 post, for the
platform team only. It costs a few dollars a month and doesn't depend on anything inside the cluster. Day-to-day access
goes through Tailscale, and break-glass goes through AWS.

## Things to watch out for

- **One proxy is a single point of failure.** The proxy in this post runs inside the operator pod. For anything
  important, run it as a `ProxyGroup` of type `kube-apiserver` with several replicas instead. When you do, set
  `apiServerProxyConfig.mode` back to `"false"` and `allowImpersonation` to `"true"`, so the ProxyGroup still gets
  permission to impersonate.
- **Network access isn't app access.** Being able to reach Argo CD doesn't log you in to it. Set up SSO for Argo CD too,
  and map the same groups to Argo CD roles.
- **The policy resource owns the whole file.** `overwrite_existing_content = true` replaces whatever's there on the
  first apply. Copy any rules you already have into Terraform before you turn it on.
- **Consider recording `kubectl exec`.** The operator can run a `Recorder` that records `exec` and `attach` sessions to
  S3. It's useful for regulated environments, where "who did what in a shell" matters as much as "who called the API".
- **Pin the operator version.** The chart and the operator move quickly. Bump the version in a pull request, read the
  changelog, and let Argo CD roll it out, like every other add-on.

## Wrapping up

The cluster still has no public endpoint, and CI still never talks to it. But anyone in the right group in your
identity provider can now run `kubectl` with sensible permissions and open internal tools in a browser, without an AWS
account, a tunnel or a client config. The access rules live in Terraform, the operator is installed by Argo CD, and
neither needs a stored secret.
