import rss from "@astrojs/rss";
import type { APIContext } from "astro";
import { site } from "../../data/site";
import { getPosts } from "../../lib/content";

export async function GET(context: APIContext) {
  const posts = await getPosts();
  return rss({
    title: `${site.name} blog`,
    description: "Writing on Kubernetes, GitOps, serverless and open source.",
    site: context.site!,
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.pubDate,
      link: `/blog/${post.id}/`,
    })),
  });
}
