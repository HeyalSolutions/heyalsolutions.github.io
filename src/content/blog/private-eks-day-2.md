---
title: "Day 2 on a private EKS cluster"
description: "Load balancers, DNS and secrets with Pod Identity and Argo CD, plus the options for giving people kubectl access when the API server has no public endpoint."
pubDate: 2026-10-24
heroImage: ../../assets/blog/generated/private-eks-day-2.jpg
heroAlt: "A padlocked VPC boundary with a cluster inside, and a narrow tunnel reaching in to a laptop outside"
draft: true
---

In [the last post](/blog/bootstrapping-private-eks-argocd/) we built an EKS cluster with no public API endpoint and got
Argo CD onto it from a CodeBuild build inside the VPC. Argo CD then took over managing itself from Git.

That leaves a cluster that can run things but can't do much useful with them yet. Nothing can be reached from outside,
nothing has a DNS name, apps have nowhere to get secrets from, and the only thing with `kubectl` access is a CodeBuild
role. This post fills those gaps:

- **AWS Load Balancer Controller** to turn Ingresses into ALBs
- **external-dns** to give them names in Route 53
- **External Secrets** to pull secrets from AWS Secrets Manager
- **A way in for people**, for the times someone really does need `kubectl`

All of it is in the same example repo,
[HeyalSolutions/eks-private-argocd-bootstrap](https://github.com/HeyalSolutions/eks-private-argocd-bootstrap).

## The split: Terraform does AWS, Argo CD does Kubernetes

Every add-on here needs two things. It needs **AWS permissions** (an IAM role) and it needs **installing into the
cluster** (a Helm chart). The first is a job for Terraform, which can reach the AWS API from GitHub Actions. The second
is a job for Argo CD, which is inside the cluster. Neither has to reach across to do the other's job.

The glue between them used to be IRSA: an OIDC provider on the cluster, a role trust policy per service account, and an
annotation on the service account with the role ARN. **EKS Pod Identity** replaces all of that. You tell EKS "this
service account in this namespace gets this role", and the Pod Identity agent (which we installed as an add-on in part
1) hands out credentials. There's nothing to annotate on the Kubernetes side, so the Helm values don't need to know any
role ARNs.

## Step 1: IAM roles with Pod Identity

The [eks-pod-identity module](https://registry.terraform.io/modules/terraform-aws-modules/eks-pod-identity/aws) has
ready-made policies for the common add-ons. Here's the load balancer controller:

```hcl
module "aws_lb_controller_pod_identity" {
  source  = "terraform-aws-modules/eks-pod-identity/aws"
  version = "~> 2.10"

  name                            = "${local.name}-aws-lb-controller"
  attach_aws_lb_controller_policy = true

  associations = {
    this = {
      cluster_name    = module.eks.cluster_name
      namespace       = "kube-system"
      service_account = "aws-load-balancer-controller"
    }
  }
}
```

external-dns and External Secrets follow the same pattern, but they're worth scoping down. external-dns only gets the
one hosted zone it manages, and External Secrets gets read-only access to secrets under the `platform/` prefix:

```hcl
module "external_dns_pod_identity" {
  # ...
  attach_external_dns_policy    = true
  external_dns_hosted_zone_arns = [data.aws_route53_zone.internal.arn]
}

module "external_secrets_pod_identity" {
  # ...
  attach_external_secrets_policy = true
  external_secrets_secrets_manager_arns = [
    "arn:aws:secretsmanager:${local.region}:${data.aws_caller_identity.current.account_id}:secret:${local.name}/*",
  ]
  external_secrets_create_permission = false
}
```

The same file creates a wildcard ACM certificate for `*.internal.example.com`, validated through Route 53. The load
balancer controller finds certificates by hostname, so no Ingress needs a certificate ARN.

## Step 2: getting values from Terraform to Argo CD

Some of the Helm values come from Terraform: the cluster name, the region and the VPC ID. There are a few ways to get
them across:

- **Commit them to the `cluster-resources` repo.** Simple and visible. They rarely change, and when they do it's a pull
  request like everything else. This is what the example does.
- **Annotate the Argo CD cluster Secret** and read the annotations with an ApplicationSet cluster generator. This is
  the "GitOps bridge" pattern, and it pays off once you have more than a handful of clusters.
- **Have Terraform write a ConfigMap.** Not an option here, since Terraform can't reach the cluster.

For one cluster, committing them wins. A Terraform output prints exactly what to paste:

```hcl
output "cluster_values" {
  value = {
    name   = module.eks.cluster_name
    region = local.region
    vpcId  = module.vpc.vpc_id
    domain = local.domain
  }
}
```

```yaml
# cluster-resources/values.yaml
cluster:
  name: platform
  region: eu-west-2
  vpcId: vpc-0123456789abcdef0
  domain: internal.example.com
```

## Step 3: the add-ons

Each add-on is one more Application template in the `cluster-resources` chart, the same as cert-manager in part 1. The
load balancer controller:

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: aws-load-balancer-controller
  namespace: argocd
spec:
  project: default
  source:
    repoURL: https://aws.github.io/eks-charts
    chart: aws-load-balancer-controller
    targetRevision: {{ .Values.awsLoadBalancerController.chartVersion | quote }}
    helm:
      valuesObject:
        clusterName: {{ .Values.cluster.name }}
        # Set explicitly so the controller doesn't depend on instance metadata
        region: {{ .Values.cluster.region }}
        vpcId: {{ .Values.cluster.vpcId }}
        serviceAccount:
          name: aws-load-balancer-controller
  destination:
    server: https://kubernetes.default.svc
    namespace: kube-system
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
```

The service account name has to match the Pod Identity association exactly. That's the only link between the two, so
it's worth setting explicitly rather than relying on the chart's default.

external-dns watches Ingresses and Services and writes records into the internal zone. `txtOwnerId` marks the records
as belonging to this cluster, so two clusters sharing a zone don't delete each other's records:

```yaml
      valuesObject:
        provider:
          name: aws
        policy: sync
        txtOwnerId: {{ .Values.cluster.name }}
        domainFilters:
          - {{ .Values.cluster.domain }}
        sources: [ingress, service]
        serviceAccount:
          name: external-dns
        env:
          - name: AWS_DEFAULT_REGION
            value: {{ .Values.cluster.region }}
```

External Secrets is a plain chart install. The interesting part is what we do with it next.

## Step 4: one secret store, and a first real secret

A `ClusterSecretStore` with no `auth` block tells External Secrets to use its own Pod Identity role, which can only read
`platform/*`:

```yaml
apiVersion: external-secrets.io/v1
kind: ClusterSecretStore
metadata:
  name: aws-secrets-manager
  annotations:
    argocd.argoproj.io/sync-options: SkipDryRunOnMissingResource=true
spec:
  provider:
    aws:
      service: SecretsManager
      region: {{ .Values.cluster.region }}
```

A good first secret to manage is one we already have. In part 1 the bootstrap build created Argo CD's repo credentials
with `kubectl create secret`. That's the one secret in the cluster that came from a script rather than from Git. An
`ExternalSecret` with the same name takes it over:

```yaml
apiVersion: external-secrets.io/v1
kind: ExternalSecret
metadata:
  name: cluster-resources-repo
  namespace: argocd
  annotations:
    argocd.argoproj.io/sync-options: SkipDryRunOnMissingResource=true
spec:
  refreshInterval: 1h
  secretStoreRef:
    kind: ClusterSecretStore
    name: aws-secrets-manager
  target:
    name: cluster-resources-repo
    # No owner reference, so deleting this ExternalSecret doesn't delete the
    # credentials Argo CD needs to put it back
    creationPolicy: Orphan
    template:
      metadata:
        labels:
          argocd.argoproj.io/secret-type: repository
      data:
        type: git
        url: {{ .Values.clusterResourcesRepo }}
        sshPrivateKey: "{{ `{{ .deployKey }}` }}"
  data:
    - secretKey: deployKey
      remoteRef:
        key: platform/cluster-resources-deploy-key
```

Rotating the deploy key is now a change in Secrets Manager, picked up within the hour. The doubled-up braces are Helm
escaping, because both Helm and External Secrets use Go templates.

Note `creationPolicy: Orphan`. With the default (`Owner`), the Secret gets an owner reference to the ExternalSecret,
and Kubernetes deletes it along with its owner. If someone ever prunes that ExternalSecret by accident, Argo CD would
lose access to the very repo it needs to restore it. It's an unlikely failure, but a horrible one to recover from on a
cluster you can't easily reach.

## Step 5: an internal Ingress for Argo CD

With all three running, exposing something is a handful of annotations. The Argo CD chart can create its own Ingress:

```yaml
argocd:
  values:
    global:
      domain: argocd.internal.example.com
    configs:
      params:
        server.insecure: true # TLS terminates at the load balancer
    server:
      ingress:
        enabled: true
        ingressClassName: alb
        annotations:
          alb.ingress.kubernetes.io/scheme: internal
          alb.ingress.kubernetes.io/target-type: ip
          alb.ingress.kubernetes.io/listen-ports: '[{"HTTPS": 443}]'
          alb.ingress.kubernetes.io/group.name: internal
```

The controller creates an internal ALB in the private subnets (tagged for it back in part 1), finds the wildcard
certificate by hostname, and external-dns points `argocd.internal.example.com` at it. `group.name` puts every internal
Ingress behind one shared ALB, so you pay for one load balancer, not one per app.

The zone is public, so anyone can look up the name, but it resolves to private IPs that only work from inside the VPC.
If you'd rather not publish internal names at all, use a private hosted zone associated with the VPC instead. That
means your certificates need validating somewhere else, though.

The load balancer controller also supports the Gateway API now, behind the `ALBGatewayAPI` and `NLBGatewayAPI` feature
gates. Ingress is still the simpler starting point, but it's worth a look if you're starting fresh.

## Step 6: getting people in

CI never needs to reach the cluster again. People still do, sometimes: to debug a failed sync, read logs Argo CD doesn't
show, or recover from a bad change. And now there's an internal ALB they'll want to open in a browser.

There are two separate needs here, and they point at different answers. **Break-glass `kubectl`** is occasional and
should be audited. **Daily access to internal tools** like the Argo CD UI is frequent and needs to be painless.

| Option | How it works | Good for | Watch out for | Rough cost |
|---|---|---|---|---|
| **SSM port forwarding** | A small instance with no inbound ports; Session Manager tunnels a local port to the API endpoint | Break-glass `kubectl`; every session is IAM-controlled and logged | One port per tunnel, so browsing internal UIs is clunky; needs the Session Manager plugin | ~$3/month |
| **Tailscale subnet router** | A small instance advertises the VPC's routes to your tailnet | Daily access to everything internal; very little setup | A third party in your access path; another identity system to keep in sync | ~$3/month plus Tailscale's per-user pricing |
| **AWS Client VPN** | Managed OpenVPN endpoint in the VPC, with SSO through IAM Identity Center | Teams that need full network access and want it all in AWS | The cost; certificate management; clients on every laptop | ~$73/month per subnet association, plus ~$0.05 per connection hour |
| **Bastion with SSH** | Public instance with port 22 open | Nothing you can't do better with SSM | Public attack surface, SSH keys to manage | ~$7/month |

**Start with SSM.** It costs almost nothing, adds no new identity system, and every session lands in CloudTrail with the
person's name on it. That's exactly the trail you want for break-glass access. If a lot of people end up in internal UIs
every day, add Tailscale or Client VPN for that, and keep SSM for `kubectl`. We cover that next step in
[Cluster access for a growing team with Tailscale](/blog/private-eks-tailscale/).

The instance needs no inbound rules at all, just the `AmazonSSMManagedInstanceCore` policy and outbound HTTPS:

```hcl
resource "aws_instance" "access" {
  ami                    = data.aws_ssm_parameter.al2023_arm64.value
  instance_type          = "t4g.nano"
  subnet_id              = module.vpc.private_subnets[0]
  iam_instance_profile   = aws_iam_instance_profile.access.name
  vpc_security_group_ids = [aws_security_group.access.id]

  metadata_options {
    http_tokens = "required"
  }

  tags = {
    Name = "${local.name}-access"
  }
}
```

Two more changes go into the EKS module: a security group rule letting that instance reach the API server, and an
access entry for the people using it. Here that's an IAM Identity Center permission set role, so access follows group
membership in your identity provider:

```hcl
  access_entries = {
    # ...bootstrap, from part 1

    platform_admins = {
      principal_arn = local.platform_admin_role_arn
      policy_associations = {
        admin = {
          policy_arn   = "arn:aws:eks::aws:cluster-access-policy/AmazonEKSClusterAdminPolicy"
          access_scope = { type = "cluster" }
        }
      }
    }
  }
```

Note that the instance itself has **no Kubernetes permissions**. It only forwards TCP. Authentication still happens with
the person's own IAM role, through `aws eks get-token`, so the audit trail in the EKS logs shows who did what, not
"the bastion".

The tunnel has one wrinkle. kubectl connects to `localhost`, but the API server's certificate is for its real hostname.
`tls-server-name` keeps TLS checking the right name. The
[full script](https://github.com/HeyalSolutions/eks-private-argocd-bootstrap/blob/main/scripts/kubectl-tunnel.sh)
boils down to:

```bash
host=$(aws eks describe-cluster --name platform --query cluster.endpoint --output text)
host=${host#https://}

aws eks update-kubeconfig --name platform --kubeconfig ~/.kube/platform-tunnel
kubectl --kubeconfig ~/.kube/platform-tunnel config set-cluster "$cluster_arn" \
  --server https://localhost:8443 \
  --tls-server-name "$host"

aws ssm start-session \
  --target "$instance_id" \
  --document-name AWS-StartPortForwardingSessionToRemoteHost \
  --parameters "host=${host},portNumber=443,localPortNumber=8443"
```

Leave that running, and in another terminal `kubectl` works as normal. For the Argo CD UI, `kubectl port-forward
svc/argocd-server -n argocd 8080:80` over the same tunnel is enough for occasional use.

## Things to watch out for

- **Order isn't guaranteed.** The `ClusterSecretStore` needs a CRD that the External Secrets Application installs, but
  everything syncs at once. `SkipDryRunOnMissingResource` stops Argo CD failing the whole sync up front, and a `retry`
  block on the root Application tries again until the CRD exists. Sync waves don't help here, because Argo CD doesn't
  wait for child Applications to become healthy unless you add a custom health check.
- **Match service account names exactly.** If the Pod Identity association says `external-dns` and the chart creates
  `external-dns-sa`, the pod quietly falls back to the node's role and gets access denied.
- **Look after the access instance.** It has no open ports, but it's still a server. Turn on SSM Patch Manager, or
  replace it on a schedule.
- **Log sessions.** Session Manager can log every session to S3 or CloudWatch. Turn on EKS audit logging too, so you
  can see what people did once they were in.

## Wrapping up

The cluster can now expose services privately, give them DNS names and certificates, and pull secrets from Secrets
Manager. None of that needed CI to talk to the cluster. Terraform handled the AWS side, Argo CD handled the Kubernetes
side, and Pod Identity joined them up without either knowing the other's details. People get in through an audited
tunnel with their own identity, rather than a shared key.

Next up: [keeping it upgraded](/blog/eks-upgrades-without-drama/), which on a private cluster needs a bit more thought.

If you'd like help building or reviewing a platform like this, that's what our
[platform engineering](/services/platform-engineering/) work covers. [Get in touch](/contact/).
