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

/** Newest first. Drafts are visible in `astro dev` and excluded from production builds. */
export async function getPosts() {
  const posts = await getCollection("blog", ({ data }) => import.meta.env.DEV || !data.draft);
  return posts.sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
}

export function readingTime(markdown: string | undefined): number {
  const words = (markdown ?? "").replace(/```[\s\S]*?```/g, "").split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 220));
}

export const formatDate = (date: Date) =>
  new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric" }).format(date);
