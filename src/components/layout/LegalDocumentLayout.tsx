import { ReactNode, useEffect, useState } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import {
  LEGAL_WATERMARK_FALLBACK,
  type LegalPageId,
  resolveLegalWatermark,
} from "@/config/legalPageWatermarks";

interface LegalDocumentLayoutProps {
  pageId: LegalPageId;
  /** Override watermark URL (e.g. from admin/CMS) */
  watermarkSrc?: string;
  children: ReactNode;
}

/**
 * Legal pages: fixed centered logo watermark (simulates background-attachment: fixed; scroll-safe on mobile).
 * Content scrolls in a column above; opacity kept low for readability.
 */
export function LegalDocumentLayout({ pageId, watermarkSrc, children }: LegalDocumentLayoutProps) {
  const configured = resolveLegalWatermark(pageId, watermarkSrc);
  const [imgSrc, setImgSrc] = useState(configured);

  useEffect(() => {
    setImgSrc(configured);
  }, [configured]);

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-background">
      {/* Fixed viewport-centered logo — does not scroll with page (avoids iOS fixed-bg quirks) */}
      <div
        className="pointer-events-none fixed inset-0 z-0 flex items-center justify-center"
        aria-hidden
      >
        <img
          src={imgSrc}
          alt=""
          width={320}
          height={320}
          decoding="async"
          onError={() => {
            if (imgSrc !== LEGAL_WATERMARK_FALLBACK) setImgSrc(LEGAL_WATERMARK_FALLBACK);
          }}
          className="
            select-none object-contain object-center
            opacity-[0.07] dark:opacity-[0.06]
            w-[150px] sm:w-[180px] md:w-[250px] lg:w-[280px] xl:w-[300px]
          "
        />
      </div>

      <div className="relative z-10 flex min-h-screen flex-col">
        <Header />
        <main
          className="
            legal-document-main
            flex-1 w-full max-w-3xl mx-auto px-4 sm:px-6 pt-24 sm:pt-28 lg:pt-28 pb-10 sm:pb-14 lg:pb-20
            text-base sm:text-[17px] leading-[1.7] text-foreground antialiased
            [&_h1]:font-display [&_h1]:font-bold [&_h1]:tracking-tight [&_h1]:text-foreground
            [&_h2]:font-display [&_h2]:font-semibold [&_h2]:text-foreground
            [&_h3]:font-semibold [&_h3]:text-foreground
            [&_p]:text-muted-foreground [&_li]:text-muted-foreground
            [&_strong]:font-semibold [&_strong]:text-foreground
          "
        >
          {children}
        </main>
        <Footer />
      </div>
    </div>
  );
}
