import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import CartPanel from "@/components/CartPanel";
import { useQuery } from "@tanstack/react-query";
import { OptimizedImage } from "@/components/ui/optimized-image";
import type { SiteInfo } from "@shared/schema";
import { useSiteInfo } from "@/hooks/useSiteInfo";

export default function Navigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [location] = useLocation();
  // Customer authentication removed - no more customer accounts

  const { data: siteInfo } = useSiteInfo();

  const isHomePage = location === "/";

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navItems = [
    { label: "Accueil", href: "/" },
    { label: "Menu", href: "/menu" },
    { label: "Événements", href: "/events" },
    { label: "Galerie", href: "/gallery" },
    { label: "Contact", href: "/contact" },
  ];

  // Vérifier si le TopInfoBar sera affiché (même logique que dans TopInfoBar.tsx)
  const topInfoBarVisible = () => {
    if (!siteInfo) return false;
    
    const infoItems = [];
    if (siteInfo.phone1) infoItems.push(`📞 ${siteInfo.phone1}`);
    if (siteInfo.phone2) infoItems.push(`📞 ${siteInfo.phone2}`);
    if (siteInfo.email_primary) infoItems.push(`✉️ ${siteInfo.email_primary}`);
    if (siteInfo.address) infoItems.push(`📍 ${siteInfo.address}${siteInfo.city ? `, ${siteInfo.city}` : ""}`);
    
    return infoItems.length > 0;
  };

  const topOffset = topInfoBarVisible() ? "top-7" : "top-0";

  const navClasses = isHomePage && !scrolled
    ? `fixed ${topOffset} left-0 right-0 z-40 bg-black/30 backdrop-blur-md border-transparent transition-all duration-300`
    : `fixed ${topOffset} left-0 right-0 z-40 bg-background/95 backdrop-blur-sm border-b transition-all duration-300 shadow-md`;

  const navHeight = isHomePage && !scrolled 
    ? "md:h-28 h-16" 
    : scrolled 
    ? "md:h-20 h-16" 
    : "md:h-28 h-16";
  const logoHeight = isHomePage && !scrolled 
    ? "md:h-24 h-10" 
    : scrolled 
    ? "md:h-16 h-10" 
    : "md:h-24 h-10";
  const textColor = isHomePage && !scrolled ? "text-white drop-shadow-lg" : "";

  return (
    <nav className={`${navClasses}`}>
      <div className="max-w-8xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 xl:px-16">
        <div className={`flex items-center justify-between ${navHeight} transition-all duration-300`}>
          <div className="flex items-center flex-shrink-0 mr-1 md:mr-8">
            <Link href="/" className="flex items-center">
              <img 
                src="/logo.png" 
                alt="Dounie Cuisine" 
                width={120}
                height={60}
                className={`${logoHeight} w-auto object-contain transition-all duration-300`}
                loading="eager"
                onError={(e) => {
                  console.warn('Erreur chargement logo, fallback vers image de base');
                }}
              />
              <h2 
                className="font-serif text-2xl font-bold text-primary cursor-pointer hidden"
                style={{ display: 'none' }}
              >
                Dounie Cuisine
              </h2>
            </Link>
          </div>

          <div className="hidden md:flex items-center justify-center flex-1 gap-8 lg:gap-12">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`text-lg font-medium transition-colors ${
                  location === item.href 
                    ? "text-primary" 
                    : `${textColor || "text-foreground"} hover:text-primary`
                }`}
                data-testid={`link-nav-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
              >
                {item.label}
              </Link>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-4">
            <CartPanel />
          </div>

          {/* Mobile: Panier + Menu hamburger côte à côte */}
          <div className="md:hidden flex items-center gap-2">
            <CartPanel />
            <button
              className={`p-3 relative z-50 rounded-md transition-colors ${isHomePage && !scrolled ? 'text-white drop-shadow-lg hover:bg-white/20' : 'hover:bg-accent'}`}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              data-testid="button-mobile-menu-toggle"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden border-t bg-background" style={{ paddingLeft: 'max(16px, env(safe-area-inset-left))', paddingRight: 'max(16px, env(safe-area-inset-right))' }}>
          <div className="px-4 py-4 space-y-3">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`block py-2 text-sm font-medium transition-colors ${
                  location === item.href ? "text-primary" : "hover:text-primary"
                }`}
                data-testid={`link-mobile-nav-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
              >
                {item.label}
              </Link>
            ))}
            <div className="pt-4 border-t space-y-2">
              <Link href="/menu" onClick={() => setMobileMenuOpen(false)}>
                <Button size="sm" className="w-full h-9 text-sm font-medium" data-testid="button-mobile-order">
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
