---
title: "Multi-tenancy by construction, Part 13: Your customer's domain, not yours"
description: "Custom domains per tenant: certificates for domains you don't control from Cloudflare for SaaS, proving and re-proving ownership, finding the tenant from the host, and signing in on a host your identity provider has never heard of."
pubDate: 2026-12-10
heroImage: ../../assets/blog/generated/mt-custom-domains.jpg
heroAlt: "Several customer domains, each with its own padlock, all funnelling through one edge into a single platform"
tags: [multi-tenancy, saas, dns, cloudflare, identity, security]
service: platform-engineering
series:
  id: multi-tenancy
  title: "Multi-tenancy by construction"
  part: 13
cta: multi-tenancy
---

Sooner or later a customer asks to use their own domain: `app.theircompany.com` instead of
`yourproduct.com/t/their-company`. It sounds like one DNS record. It's really four problems: a certificate for a
domain you don't control, proof that the customer owns it (and keeps owning it), finding the tenant from a host
you've never seen before, and signing people in on a host your identity provider doesn't know.

In [Part 4](/blog/multi-tenancy-tenant-in-the-url/) the tenant lived in the URL path. This post is the other half:
the tenant lives in the hostname, and the rest of the system shouldn't notice.

## Certificates: let the edge do it

The obvious Kubernetes answer is cert-manager: an HTTP-01 challenge and a Gateway listener per domain. It works
for ten customers and falls over at scale. Gateway API allows 64 listeners per Gateway, and ACME has rate limits
you don't want to discover during a busy onboarding week.

We use [Cloudflare for SaaS](https://developers.cloudflare.com/cloudflare-for-platforms/cloudflare-for-saas/)
instead. Each domain a tenant turns on becomes a *custom hostname* in our zone. Once the customer's CNAME points at
us, Cloudflare validates it, issues the certificate, renews it, and sends the traffic to one fallback origin. The
first 100 hostnames are free, then about $0.10 a month each.

The platform's token can edit SSL and certificates on that one zone, and nothing else. If Cloudflare doesn't
answer, nothing changes: turning a domain on fails with a clear error and the owner tries again. Local and test
clusters skip the edge entirely, so the feature still works on a laptop.

## Prove it, then keep proving it

A web address starts from a domain the tenant has already verified with a TXT record, the same check used for
email domains and SSO. Turning it on then needs a second record: a CNAME from the customer's subdomain to the
install. The platform refuses until it sees it.

A few rules keep it simple:

- **One web address per tenant.** Turning on a second turns the first off.
- **Subdomains only.** An apex domain can't hold a CNAME.
- **Checked at the source.** Records are read from the zone's own authoritative nameservers, never a recursive
  resolver, so a cache can't hide a change in either direction.
- **Checked forever.** Hourly, then every ten minutes once something's missing. Missing for a day, owners get an
  email; still missing, the address is turned off and the domain unverified.

The last one matters more than it looks. Domains lapse, companies rebrand, someone tidies up DNS. A domain that
pointed at you last year and now points somewhere else must stop being treated as yours.

## Finding the tenant from the host

Requests for any unknown host arrive at one install. The edge passes the original host along, and the
backend-for-frontend looks it up:

```ts
// One lookup per new host, cached, and dropped when a domain changes.
const tenant = await hosts.tenantFor(forwardedHost);
if (!tenant) return notFound();
```

From there it's the same path as `/t/<slug>`: the BFF sets the tenant header exactly as it
would for a slug, and the services check membership as they always do. The pages are served at `/` instead of `/t/<slug>/…`, and the old slug path still works on that
host for that tenant only.

Trusting a forwarded host sounds risky, so it's worth saying why it isn't. Forging it only gets you what visiting
that domain would, and membership is checked either way. The host picks which tenant you're *asking* for, never
whether you're allowed in.

Every change is announced as an event, so caches drop the old answer, and audited, so "who pointed our domain
somewhere else?" has an answer.

## Signing in on a host your identity provider doesn't know

Session cookies are `__Host-` cookies, so each host has its own session. The tempting fix is adding every
customer's domain to the identity provider's redirect URIs. That's a config change per customer, in a system you'd
rather not touch per customer.

Instead, sign-in always happens on the install's own host. When you come back, it hands the session over to the
custom host with a one-time code: single use, valid for a minute, and bound to a nonce cookie set on the custom
host before you left. The identity provider's own session means nobody signs in twice.

<div style="overflow-x: auto">
<svg viewBox="0 0 760 300" role="img" aria-labelledby="cd-diagram-title" style="min-width: 640px; width: 100%; height: auto; font-family: inherit">
  <title id="cd-diagram-title">A browser on the customer's domain is sent to sign in on the install's host. After sign-in, the install's host sends it back with a one-time code. The custom host swaps the code for its own session alias, so the install's session id never leaves the install's host.</title>
  <defs>
    <marker id="cd-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M0 0 10 5 0 10z" style="fill: var(--color-brand-500)"/>
    </marker>
  </defs>
  <g style="font-size: 13px; fill: var(--color-ink-900)">
    <rect x="20" y="30" width="200" height="240" rx="10" style="fill: var(--color-surface); stroke: var(--color-ink-300)"/>
    <text x="120" y="56" text-anchor="middle" style="font-weight: 600">app.customer.com</text>
    <text x="120" y="74" text-anchor="middle" style="fill: var(--color-ink-600); font-size: 12px">custom host</text>
    <rect x="280" y="30" width="200" height="240" rx="10" style="fill: var(--color-surface); stroke: var(--color-ink-300)"/>
    <text x="380" y="56" text-anchor="middle" style="font-weight: 600">install host</text>
    <text x="380" y="74" text-anchor="middle" style="fill: var(--color-ink-600); font-size: 12px">the only redirect URI</text>
    <rect x="540" y="30" width="200" height="240" rx="10" style="fill: var(--color-surface); stroke: var(--color-ink-300)"/>
    <text x="640" y="56" text-anchor="middle" style="font-weight: 600">Identity provider</text>
    <text x="640" y="74" text-anchor="middle" style="fill: var(--color-ink-600); font-size: 12px">knows one host</text>
    <g style="stroke: var(--color-brand-500); stroke-width: 2; fill: none">
      <path d="M220 110H278" marker-end="url(#cd-arrow)"/>
      <path d="M480 140H538" marker-end="url(#cd-arrow)"/>
      <path d="M538 180H482" marker-end="url(#cd-arrow)"/>
      <path d="M278 220H222" marker-end="url(#cd-arrow)"/>
    </g>
    <g style="font-size: 12px; fill: var(--color-ink-700)">
      <text x="249" y="102" text-anchor="middle">1 sign in</text>
      <text x="509" y="132" text-anchor="middle">2 OIDC</text>
      <text x="509" y="198" text-anchor="middle">3 session</text>
      <text x="249" y="212" text-anchor="middle">4 code</text>
      <text x="120" y="210" text-anchor="middle">5 swap code</text>
      <text x="120" y="228" text-anchor="middle">for an alias</text>
    </g>
  </g>
</svg>
</div>

The custom host's cookie holds an *alias*, not the real session id: a random id that stands for that session on
that host only. The session id that opens every tenant someone belongs to never leaves the install's host. Signing
out on the custom host ends both.

## The limit we wrote down

A tenant's owner controls their own DNS. While the hostname is still live on the edge, an owner could point it at
a server of their own and catch the alias of a member who signs in there. That alias opens only that tenant, which
the owner already runs, on that host. Turning the address off, or the hourly check finding the CNAME gone, ends
it. It's a small hole, but it's written down and ticketed rather than discovered later, which is the habit this
whole series is about.

## What it adds up to

None of this touches the data layer. Row-Level Security, the cross-tenant tests and the permission checks don't
know custom domains exist, because the host only ever chooses which tenant you're asking for. That's the point of
carrying the tenant in one place: adding a new way to name it is an edge problem, not a rewrite.
