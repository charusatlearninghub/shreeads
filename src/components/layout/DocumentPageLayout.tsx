import { ReactNode } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

interface DocumentPageLayoutProps {
  children: ReactNode;
}

/**
 * Layout for legal/support pages with a fixed header.
 * Main content is offset so titles and hero content are never hidden under the navbar.
 */
export function DocumentPageLayout({ children }: DocumentPageLayoutProps) {
  return (
    <div className="min-h-screen bg-background overflow-x-hidden flex flex-col">
      <Header />
      <main className="flex-1 w-full max-w-3xl mx-auto px-4 sm:px-6 pt-24 sm:pt-28 lg:pt-28 pb-10 sm:pb-14 lg:pb-20">
        {children}
      </main>
      <Footer />
    </div>
  );
}
