import { useEffect, useState } from "react";

/**
 * Tiny global counter so floating UI (e.g. FloatingWhatsApp) can hide when a
 * mobile sticky purchase bar is mounted. Avoids visual overlap.
 */
let count = 0;
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((l) => l());
}

export function registerStickyBar(): () => void {
  count += 1;
  notify();
  return () => {
    count = Math.max(0, count - 1);
    notify();
  };
}

export function useHasStickyBar(): boolean {
  const [v, setV] = useState(count > 0);
  useEffect(() => {
    const l = () => setV(count > 0);
    listeners.add(l);
    l();
    return () => {
      listeners.delete(l);
    };
  }, []);
  return v;
}
