import { site } from "../data/site";

/** JSON-LD helpers. Entities reference each other by @id so search engines can join them up. */

const abs = (path: string) => new URL(path, site.url).toString();

export const ids = {
  organization: abs("/#organization"),
  website: abs("/#website"),
  founder: abs("/about/#founder"),
};

export const founder = {
  "@type": "Person",
  "@id": ids.founder,
  name: site.founder,
  url: abs("/about/"),
  jobTitle: "Founder",
  worksFor: { "@id": ids.organization },
  sameAs: [site.linkedin, site.github],
};

export const organization = {
  "@type": "ProfessionalService",
  "@id": ids.organization,
  name: site.name,
  legalName: site.legalName,
  url: abs("/"),
  logo: abs("/logo.png"),
  image: abs("/og-default.jpg"),
  description: site.description,
  email: site.email,
  identifier: { "@type": "PropertyValue", propertyID: "UK Companies House number", value: site.companyNumber },
  address: { "@type": "PostalAddress", addressLocality: site.locality, addressCountry: site.country },
  areaServed: [
    { "@type": "Country", name: "United Kingdom" },
    { "@type": "Place", name: "Europe" },
  ],
  founder: { "@id": ids.founder },
  sameAs: [site.linkedin, site.github],
};

export const website = {
  "@type": "WebSite",
  "@id": ids.website,
  name: site.name,
  url: abs("/"),
  inLanguage: "en-GB",
  publisher: { "@id": ids.organization },
};

/** Breadcrumbs from the home page down; the last item is the current page. */
export function breadcrumbs(items: { name: string; path: string }[]) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: [{ name: "Home", path: "/" }, ...items].map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: abs(item.path),
    })),
  };
}

export const graph = (...nodes: object[]) => ({ "@context": "https://schema.org", "@graph": nodes });
