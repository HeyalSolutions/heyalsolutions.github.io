# heyal.co.uk

Company site for Heyal Solutions Ltd, built with [Astro](https://astro.build), TypeScript and Tailwind CSS v4.

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # type-check + static build to dist/
```

## Editing content

- `src/content/services/*.md`: one file per service page (frontmatter + body)
- `src/content/work/*.md`: case studies. `draft: true` shows them in `npm run dev` only.
  The Work nav link and home page section appear once at least one is published.
- `src/data/site.ts`: company details, nav, home page copy, engagement models, blog posts

Pushes to `master` deploy via GitHub Actions (`.github/workflows/deploy.yml`).
In repo Settings → Pages, set **Source** to **GitHub Actions**.
