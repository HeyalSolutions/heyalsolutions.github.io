import { defineCollection } from "astro:content";
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
  loader: glob({ pattern: "**/*.md", base: "./src/content/work" }),
  schema: z.object({
    title: z.string(),
    client: z.string(),
    sector: z.string(),
    summary: z.string(),
    services: z.array(z.string()),
    results: z.array(z.string()),
    order: z.number().default(0),
    draft: z.boolean().default(false),
  }),
});

export const collections = { services, work };
