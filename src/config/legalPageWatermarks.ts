/**
 * Fixed background watermark for legal document pages (served from /public).
 * Default: SHREE ADS logo — same asset on all four pages for a consistent policy-document look.
 * Override with `watermarkSrc` on LegalDocumentLayout (e.g. admin/CMS) when needed.
 */
export type LegalPageId = "privacy" | "terms" | "refund" | "disclaimer";

/** Primary logo watermark — add/replace `public/images/shreeads-logo.png` (copied from app logo asset) */
export const LEGAL_LOGO_WATERMARK = "/images/shreeads-logo.png";

/** Shown if the logo file fails to load */
export const LEGAL_WATERMARK_FALLBACK = "/images/legal-watermark.svg";

export const LEGAL_WATERMARK_BY_PAGE: Record<LegalPageId, string> = {
  privacy: LEGAL_LOGO_WATERMARK,
  terms: LEGAL_LOGO_WATERMARK,
  refund: LEGAL_LOGO_WATERMARK,
  disclaimer: LEGAL_LOGO_WATERMARK,
};

export function resolveLegalWatermark(pageId: LegalPageId, override?: string): string {
  return override?.trim() || LEGAL_WATERMARK_BY_PAGE[pageId] || LEGAL_LOGO_WATERMARK;
}
