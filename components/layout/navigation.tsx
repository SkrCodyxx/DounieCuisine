"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import CartPanel from "@/components/cart/cart-panel";
import { useSiteInfo } from "@/hooks/use-site-info";
import type { NavItem } from "@/types";

const navItems: NavItem[] = [
  { label: "Accueil", href: "/" },
  { label: "Menu", href: "/menu" },
  { label: "Evenements", href: "/events" },
  { label: "Galerie", href: "/gallery" },
  { label: "Contact", href: "/contact" },
];

export default function Navigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const { data: siteInfo } = useSiteInfo();

  const isHomePage = pathname === "/";

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Check if TopInfoBar is visible
  const topInfoBarVisible = Boolean(
    siteInfo && (siteInfo.phone1 || siteInfo.phone2 || siteInfo.emailPrimary || siteInfo.address)
  );
  const topOffset = topInfoBarVisible ? "top-7" : "top-0";

  const navClasses =
    isHomePage && !scrolled
      ? `fixed ${topOffset} left-0 right-0 z-40 bg-black/30 backdrop-blur-md border-transparent transition-all duration-300`
      : `fixed ${topOffset} left-0 right-0 z-40 bg-background/95 backdrop-blur-sm border-b transition-all duration-300 shadow-md`;

  const navHeight =
    isHomePage && !scrolled ? "md:h-28 h-16" : scrolled ? "md:h-20 h-16" : "md:h-28 h-16";
  const logoHeight =
    isHomePage && !scrolled ? "md:h-24 h-10" : scrolled ? "md:h-16 h-10" : "md:h-24 h-10";
  const textColor = isHomePage && !scrolled ? "text-white drop-shadow-lg" : "";

  return (
    <nav className={navClasses}>
      <div className="max-w-8xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 xl:px-16">
        <div className={`flex items-center justify-between ${navHeight} transition-all duration-300`}>
          {/* Logo */}
          <div className="flex items-center flex-shrink-0 mr-1 md:mr-8">
            <Link href="/" className="flex items-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo.png"
                alt="Dounie Cuisine"
                width={120}
                height={60}
                className={`${logoHeight} w-auto object-contain transition-all duration-300`}
              />
            </Link>
          </div>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center justify-center flex-1 gap-8 lg:gap-12">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`text-lg font-medium transition-colors ${
                  pathname === item.href
                    ? "text-primary"
                    : `${textColor || "text-foreground"} hover:text-primary`
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* Desktop cart */}
          <div className="hidden md:flex items-center gap-4">
            <CartPanel />
          </div>

          {/* Mobile: Cart + hamburger */}
          <div className="md:hidden flex items-center gap-2">
            <CartPanel />
            <button
              className={`p-3 relative z-50 rounded-md transition-colors ${
                isHomePage && !scrolled
                  ? "text-white drop-shadow-lg hover:bg-white/20"
                  : "hover:bg-accent"
              }`}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div
          className="md:hidden border-t bg-background"
          style={{
            paddingLeft: "max(16px, env(safe-area-inset-left))",
            paddingRight: "max(16px, env(safe-area-inset-right))",
          }}
        >
          <div className="px-4 py-4 space-y-3">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`block py-2 text-sm font-medium transition-colors ${
                  pathname === item.href ? "text-primary" : "hover:text-primary"
                }`}
              >
                {item.label}
              </Link>
            ))}
            <div className="pt-4 border-t space-y-2">
              <Link href="/menu" onClick={() => setMobileMenuOpen(false)}>
                <Button size="sm" className="w-full h-9 text-sm font-medium">
                  Commander
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
