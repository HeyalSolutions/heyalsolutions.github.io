import { defineConfig, fontProviders } from "astro/config";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import { readFileSync, readdirSync } from "node:fs";

/**
 * Last-modified date for each blog post URL, read from front matter (updatedDate, else pubDate).
 * Content collections aren't available in the config, so this parses the Markdown directly.
 */
function blogLastModified() {
  const dir = new URL("./src/content/blog/", import.meta.url);
  const dates = new Map<string, string>();
  for (const file of readdirSync(dir).filter((f) => f.endsWith(".md") && !f.startsWith("_"))) {
    const frontMatter = readFileSync(new URL(file, dir), "utf8").split(/^---$/m)[1] ?? "";
    const date = (key: string) => frontMatter.match(new RegExp(`^${key}:\\s*"?([0-9-]+)`, "m"))?.[1];
    const lastmod = date("updatedDate") ?? date("pubDate");
    if (lastmod) dates.set(`/blog/${file.replace(/\.md$/, "")}/`, new Date(lastmod).toISOString());
  }
  return dates;
}
const blogDates = blogLastModified();

export default defineConfig({
  site: "https://www.heyal.co.uk",
  integrations: [
    sitemap({
      serialize(item) {
        const lastmod = blogDates.get(new URL(item.url).pathname);
        return lastmod ? { ...item, lastmod } : item;
      },
    }),
  ],
  fonts: [
    {
      name: "Manrope",
      cssVariable: "--font-manrope",
      provider: fontProviders.google(),
      weights: ["400 800"],
      styles: ["normal"],
      subsets: ["latin"],
      fallbacks: ["ui-sans-serif", "system-ui", "sans-serif"],
    },
  ],
  markdown: {
    shikiConfig: {
      themes: { light: "github-light", dark: "github-dark" },
    },
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
