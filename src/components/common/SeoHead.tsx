import { useEffect } from "react";

const SITE_NAME = "ShreeAds";

interface SeoHeadProps {
  /** Page title (50–60 chars for SEO). Will be suffixed with " | ShreeAds" if not already present. */
  title: string;
  /** Meta description (150–160 chars for SEO). */
  description: string;
}

/**
 * Sets document title and meta description for SEO.
 * Use on each page to ensure unique, descriptive meta tags for search engines.
 */
export function SeoHead({ title, description }: SeoHeadProps) {
  useEffect(() => {
    const fullTitle = title.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`;
    document.title = fullTitle;

    let metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
      metaDescription = document.createElement("meta");
      metaDescription.setAttribute("name", "description");
      document.head.appendChild(metaDescription);
    }
    metaDescription.setAttribute("content", description);

    return () => {
      // Optional: restore default on unmount if desired
    };
  }, [title, description]);

  return null;
}
