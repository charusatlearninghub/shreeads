/**
 * Canonical production URL used for referral/affiliate share links.
 * Falls back to current origin during local/preview development.
 */
const PRODUCTION_ORIGIN = "https://shreeads.lovable.app";

export function getSiteUrl(): string {
  if (typeof window === "undefined") return PRODUCTION_ORIGIN;
  const host = window.location.hostname;
  // Use production origin whenever we're on the canonical domain OR on a
  // sandbox/preview/lovable host — referral links must always be shareable.
  if (
    host === "shreeads.lovable.app" ||
    host.endsWith(".lovableproject.com") ||
    host.endsWith(".lovable.app") ||
    host === "localhost" ||
    host === "127.0.0.1"
  ) {
    return PRODUCTION_ORIGIN;
  }
  return window.location.origin;
}

export function buildReferralLink(code: string): string {
  return `${getSiteUrl()}/?ref=${encodeURIComponent(code)}`;
}
