"use client";

import TopInfoBar from "./top-info-bar";
import Navigation from "./navigation";
import Footer from "./footer";

interface PageLayoutProps {
  children: React.ReactNode;
  /** Pass a custom hero component (optional) */
  hero?: React.ReactNode;
  /** If true, don't render the standard header spacing for pages without hero */
  noHeaderSpacing?: boolean;
}

/**
 * Shared page wrapper that eliminates the duplicated TopInfoBar/Navigation/Footer
 * pattern that was copy-pasted in every single page.
 */
export default function PageLayout({ children, hero, noHeaderSpacing }: PageLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <TopInfoBar />
      <Navigation />

      {hero && <section id="home">{hero}</section>}

      {/* Standard spacing below fixed nav for non-hero pages */}
      {!hero && !noHeaderSpacing && <div className="pt-24 md:pt-36" />}

      <main className="flex-1">{children}</main>

      <Footer />
    </div>
  );
}
