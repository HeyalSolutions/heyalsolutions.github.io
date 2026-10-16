import { defineCollection, reference } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

const iconNames = ["code", "chat", "cloud", "heart", "cube", "rocket", "academic", "search"] as const;

const services = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/services" }),
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    icon: z.enum(iconNames),
    order: z.number(),
    outcomes: z.array(z.string()),
    includes: z.array(z.string()),
    tools: z.array(z.string()),
  }),
});

const work = defineCollection({
  // Files starting with "_" (e.g. _template.md) are ignored.
  loader: glob({ pattern: "**/[^_]*.md", base: "./src/content/work" }),
  schema: z.object({
    title: z.string(),
    client: z.string(),
    sector: z.string(),
    summary: z.string(),
    services: z.array(reference("services")),
    results: z.array(z.string()),
    duration: z.string().optional(),
    team: z.string().optional(),
    stack: z.array(z.string()).default([]),
    order: z.number().default(0),
    draft: z.boolean().default(false),
  }),
});

export const collections = { services, work };
