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
