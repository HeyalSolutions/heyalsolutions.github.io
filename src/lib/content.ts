import { getCollection } from "astro:content";

export async function getServices() {
  const services = await getCollection("services");
  return services.sort((a, b) => a.data.order - b.data.order);
}

/** Drafts are visible in `astro dev` and excluded from production builds. */
export async function getCaseStudies() {
  const work = await getCollection("work", ({ data }) => import.meta.env.DEV || !data.draft);
  return work.sort((a, b) => a.data.order - b.data.order);
}

/**
 * Newest first. Drafts and future-dated posts are visible in `astro dev` and excluded from production builds;
 * a scheduled rebuild (see .github/workflows/deploy.yml) publishes each post once its pubDate arrives.
 */
export async function getPosts() {
  const now = Date.now();
  const posts = await getCollection(
    "blog",
    ({ data }) => import.meta.env.DEV || (!data.draft && data.pubDate.valueOf() <= now),
  );
  // Newest first; parts of a series published on the same day list in reverse part order.
  return posts.sort(
    (a, b) =>
      b.data.pubDate.valueOf() - a.data.pubDate.valueOf() || (b.data.series?.part ?? 0) - (a.data.series?.part ?? 0),
  );
}

export function readingTime(markdown: string | undefined): number {
  const words = (markdown ?? "").replace(/```[\s\S]*?```/g, "").split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 220));
}

export const formatDate = (date: Date) =>
  new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric" }).format(date);
