import rss from "@astrojs/rss";
import type { APIContext } from "astro";
import { site } from "../../data/site";
import { getPosts } from "../../lib/content";

export async function GET(context: APIContext) {
  const posts = await getPosts();
  return rss({
    title: `${site.name} blog`,
    description: "Practical writing on Kubernetes, EKS, GitOps, Terraform and platform engineering.",
    customData: "<language>en-gb</language>",
    site: context.site!,
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.pubDate,
      link: `/blog/${post.id}/`,
      author: `${site.email} (${site.founder})`,
      categories: post.data.tags,
      // Full post HTML so feed readers don't need to click through.
      content: post.rendered?.html,
    })),
  });
}
