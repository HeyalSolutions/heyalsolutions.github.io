export const site = {
  name: "Heyal Solutions",
  legalName: "Heyal Solutions Ltd",
  description:
    "Cloud native consultancy. We design, build and fix the Kubernetes platforms, infrastructure and delivery pipelines engineering teams ship on.",
  email: "sales@heyal.co.uk",
  companyNumber: "12189247",
  registeredAddress: "Birmingham, UK",
  founder: "Alistair Hey",
  blog: "https://blog.heyal.co.uk",
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
  { label: "Blog", href: site.blog, external: true },
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
    title: "Senior engineers only",
    body: "Our work is done by experienced engineers and overseen by our founder. We don't staff projects with juniors learning on the job.",
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

export const posts: { title: string; summary: string; href: string; date: string }[] = [
  {
    title: "First look at loft.sh using GitOps",
    summary: "Installing and configuring loft.sh with Flux.",
    href: "https://blog.heyal.co.uk/loft-sh/",
    date: "2022-03-15",
  },
  {
    title: "How to unit-test your Helm charts with Golang",
    summary: "Catching packaging bugs before they reach a cluster.",
    href: "https://blog.heyal.co.uk/unit-testing-helm-charts/",
    date: "2021-01-23",
  },
  {
    title: "OpenFaaS, what's it all about?",
    summary: "Serverless on Kubernetes: should you build your own or not?",
    href: "https://blog.heyal.co.uk/openfaas-whats-it-about/",
    date: "2020-05-12",
  },
];
