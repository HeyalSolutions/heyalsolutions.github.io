export const site = {
  name: "Heyal Solutions",
  legalName: "Heyal Solutions Ltd",
  description:
    "Cloud native consultancy. We design, build and fix the Kubernetes platforms, infrastructure and delivery pipelines engineering teams ship on.",
  email: "sales@heyal.co.uk",
  companyNumber: "12189247",
  registeredAddress: "Birmingham, UK",
  founder: "Alistair Hey",
  blog: "/blog/",
  github: "https://github.com/Waterdrips",
  linkedin: "https://www.linkedin.com/in/alistair-hey/",
} as const;

export interface NavLink {
  label: string;
  href: string;
  external?: boolean;
}

export const nav: NavLink[] = [
  { label: "Services", href: "/services/" },
  { label: "How we work", href: "/how-we-work/" },
  { label: "Work", href: "/work/" },
  { label: "About", href: "/about/" },
  { label: "Blog", href: "/blog/" },
];

export type IconName = "code" | "chat" | "cloud" | "heart" | "cube" | "rocket" | "academic" | "search";

export const problems: { title: string; body: string }[] = [
  {
    title: "Releases are an event",
    body: "Shipping needs a checklist, a quiet afternoon and the one person who remembers how it works.",
  },
  {
    title: "Kubernetes, but nobody's quite sure how",
    body: "The cluster grew by accident, every namespace is a little different, and nobody wants to do the upgrade.",
  },
  {
    title: "Infrastructure lives in someone's head",
    body: "Changes happen in the console, environments drift, and rebuilding one from scratch would take weeks.",
  },
  {
    title: "The platform team is the bottleneck",
    body: "Every new service waits on a ticket to the one team that understands the setup.",
  },
];

export const principles: { title: string; body: string; icon: IconName }[] = [
  {
    icon: "rocket",
    title: "Experienced engineers, every time",
    body: "Our work is led by experienced engineers and overseen by our founder. We pair with engineers at every level of your team, so their skills grow alongside the platform.",
  },
  {
    icon: "code",
    title: "In your repos from day one",
    body: "Everything we build is code, in your version control, reviewed by your engineers. Nothing important lives on our laptops.",
  },
  {
    icon: "chat",
    title: "Built to hand over",
    body: "We pair with your team, write things down and leave runbooks behind. Success is you not needing us.",
  },
];

export const engagements: { title: string; summary: string; bestFor: string; points: string[] }[] = [
  {
    title: "Time & materials",
    summary: "Defined phases of platform work, delivered by our engineers and billed for the time spent.",
    bestFor: "Work with a clear direction that's hard to scope precisely up front, such as delivering a roadmap of platform improvements.",
    points: [
      "Each phase agreed in a statement of work with clear deliverables",
      "Delivered using our own methods, in close collaboration with your engineers",
      "Progress reviewed against the agreed outcomes at the end of each phase",
    ],
  },
  {
    title: "Fixed scope",
    summary: "An agreed outcome, delivered for an agreed price.",
    bestFor: "Well-defined projects such as a platform review, a migration phase or a new delivery pipeline.",
    points: [
      "Scope, deliverables and price agreed up front",
      "Regular demos so there are no surprises",
      "Ends with a proper handover to your team",
    ],
  },
  {
    title: "Advisory",
    summary: "A monthly retainer for experienced advice whenever you need it.",
    bestFor: "Teams that run their own platform but want a sounding board for architecture and big decisions.",
    points: [
      "Architecture and design reviews",
      "Second opinions on tooling and vendor choices",
      "A direct line when something goes wrong",
    ],
  },
];

export const process: { step: string; title: string; body: string }[] = [
  {
    step: "01",
    title: "Talk",
    body: "A short call about your platform, your team and what's getting in the way. If we're not the right fit, we'll say so.",
  },
  {
    step: "02",
    title: "Understand",
    body: "We get into your code, infrastructure and pipelines, and talk to the engineers who use them every day.",
  },
  {
    step: "03",
    title: "Build together",
    body: "We deliver in small increments alongside your team, with working improvements early and often.",
  },
  {
    step: "04",
    title: "Hand over",
    body: "Documentation, runbooks and pairing, so your team owns everything we've built.",
  },
];

/** The fixed-scope platform review, shown on /platform-review/ and promoted across the site. */
export const review = {
  name: "Platform review",
  href: "/platform-review/",
  duration: "Two weeks",
  /** Shown as the price when set, e.g. "From £6,000 + VAT". Leave undefined to say it's agreed up front. */
  price: undefined as string | undefined,
  pitch:
    "Two weeks, a fixed price, and a written report ranking what to fix in your Kubernetes, Terraform and pipelines, and in what order.",
  areas: [
    {
      title: "Infrastructure as code",
      body: "Drift between Terraform and reality, state handling, module structure and how changes are reviewed and applied.",
    },
    {
      title: "Kubernetes clusters",
      body: "Versions and upgrade path, node groups, resource requests, add-ons and how consistently clusters are built.",
    },
    {
      title: "Delivery pipelines",
      body: "How code gets from commit to production, how long it takes, how deploys roll back and what CI is allowed to touch.",
    },
    {
      title: "Security and access",
      body: "Long-lived keys, secrets handling, who is cluster-admin, network exposure and the IAM behind it all.",
    },
    {
      title: "Cost",
      body: "Over-provisioned workloads, idle capacity, extended support fees and the network charges nobody expected.",
    },
    {
      title: "Reliability and recovery",
      body: "Alerting that people act on, backups that have been restored, and how long a rebuild from code would take.",
    },
  ],
  steps: [
    {
      when: "Before we start",
      title: "Scope and access",
      body: "A short call to agree what's in scope, then read-only access to your repositories, cloud accounts and clusters.",
    },
    {
      when: "Week 1",
      title: "Look and listen",
      body: "We read the code and config, look at how things actually run, and spend an hour or so with a few of your engineers.",
    },
    {
      when: "Week 2",
      title: "Write it up",
      body: "We rank every finding by impact and effort, and check the quick wins with your team so there are no surprises.",
    },
    {
      when: "End of week 2",
      title: "Walk through it",
      body: "A session with your team to go through the report, answer questions and agree what to tackle first.",
    },
  ],
  deliverables: [
    "A written report with every finding ranked by impact and effort",
    "A short list of quick wins your team can do in the next few weeks",
    "A suggested order for the bigger changes, roughly a quarter's worth",
    "A walkthrough session with your engineers and anyone else who needs to hear it",
    "A follow-up call a month later to answer questions as you make changes",
  ],
  fit: [
    "You run Kubernetes on AWS, Google Cloud or Azure, or are about to",
    "The platform works, but it's slower, more expensive or more fragile than it should be",
    "You want an outside view before a big decision, a funding round, an audit or a new hire",
  ],
  teamTime: "About half a day in total, spread across a few engineers",
  access: "Read-only. We never need write access to production for a review.",
} as const;

/** Call-to-action shown at the end of a blog post, chosen with the post's `cta` frontmatter. */
export interface PostCta {
  heading: string;
  body: string;
  label: string;
  href: string;
}

export const postCtas = {
  "platform-review": {
    heading: "Want to know which of these apply to you?",
    body: "Our platform review goes through your Kubernetes, Terraform and pipelines in two weeks, for a fixed price, and tells you what to fix first.",
    label: "See the platform review",
    href: review.href,
  },
  "private-eks": {
    heading: "Building a private EKS platform?",
    body: "We design and build locked-down EKS platforms with Terraform and GitOps, working alongside your team and leaving everything in your repositories.",
    label: "See our platform engineering work",
    href: "/services/platform-engineering/",
  },
  "eks-upgrades": {
    heading: "Clusters a few versions behind?",
    body: "We help teams catch up on EKS upgrades, get off extended support pricing, and set things up so the next upgrade is routine.",
    label: "Talk to us about upgrades",
    href: "/contact/",
  },
  delivery: {
    heading: "Want releases to be a non-event?",
    body: "We build infrastructure as code and delivery pipelines that make shipping small, frequent and boring.",
    label: "See our delivery work",
    href: "/services/infrastructure-and-delivery/",
  },
  platform: {
    heading: "Got a platform problem?",
    body: "We design, build and fix the Kubernetes platforms engineering teams ship on.",
    label: "See our platform engineering work",
    href: "/services/platform-engineering/",
  },
} as const satisfies Record<string, PostCta>;

export type PostCtaId = keyof typeof postCtas;
