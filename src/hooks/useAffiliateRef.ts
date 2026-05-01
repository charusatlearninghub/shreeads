import { useEffect } from "react";

const KEY = "affiliate_ref_code";
const EXPIRY_KEY = "affiliate_ref_expiry";
const TTL_DAYS = 30;

/**
 * Captures a `?ref=CODE` query parameter from the URL on first load
 * and stores it in localStorage for 30 days so a later package purchase
 * can credit the affiliate.
 */
export function useAffiliateRefCapture() {
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const ref = params.get("ref");
      if (ref && /^[A-Za-z0-9]{4,16}$/.test(ref)) {
        const expiry = Date.now() + TTL_DAYS * 24 * 60 * 60 * 1000;
        localStorage.setItem(KEY, ref.toUpperCase());
        localStorage.setItem(EXPIRY_KEY, String(expiry));
      }
    } catch {
      // ignore storage errors
    }
  }, []);
}

export function getStoredAffiliateRef(): string | null {
  try {
    const code = localStorage.getItem(KEY);
    const expiry = Number(localStorage.getItem(EXPIRY_KEY) || 0);
    if (!code) return null;
    if (expiry && expiry < Date.now()) {
      localStorage.removeItem(KEY);
      localStorage.removeItem(EXPIRY_KEY);
      return null;
    }
    return code;
  } catch {
    return null;
  }
}

export function clearStoredAffiliateRef() {
  try {
    localStorage.removeItem(KEY);
    localStorage.removeItem(EXPIRY_KEY);
  } catch {
    // ignore
  }
}
