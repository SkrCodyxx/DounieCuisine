import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import { Facebook, Instagram, Mail, MapPin, Phone, MessageCircle, Youtube, Linkedin } from "lucide-react";
import { SiTiktok, SiX, SiPinterest } from "react-icons/si";
import type { LegalPage, SiteInfo } from "@shared/schema";
import { Link } from "wouter";
import { getLogoUrl } from "@/lib/image-utils";
import { useSiteInfo } from "@/hooks/useSiteInfo";

const SocialIcon = ({ platform, url }: { platform: string; url: string }) => {
  const iconClass = "w-5 h-5 text-primary";
  const icons: Record<string, JSX.Element> = {
    facebook: <Facebook className={iconClass} />,
    instagram: <Instagram className={iconClass} />,
    twitter: <SiX className={iconClass} />,
    tiktok: <SiTiktok className={iconClass} />,
    youtube: <Youtube className={iconClass} />,
    linkedin: <Linkedin className={iconClass} />,
    whatsapp: <MessageCircle className={iconClass} />,
    pinterest: <SiPinterest className={iconClass} />,
  };

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center hover-elevate active-elevate-2 transition-all"
      aria-label={platform}
      data-testid={`link-social-${platform}`}
    >
      {icons[platform]}
    </a>
  );
};

export default function Footer() {
  // Load all site information using centralized hook (eliminates duplicate API calls)
  const { data: siteInfo, isLoading: isSiteInfoLoading } = useSiteInfo();

  // Cache très long - pages légales presque jamais modifiées
  const { data: legalPages, isLoading: isLegalPagesLoading } = useQuery<LegalPage[]>({
    queryKey: ["/api/legal-pages"],
    staleTime: 4 * 60 * 60 * 1000, // 4 heures - contenu légal très stable
    gcTime: 8 * 60 * 60 * 1000, // 8 heures en cache
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  console.log('Footer Data:', {
    siteInfo,
    legalPages,
    loading: {
      siteInfo: isSiteInfoLoading,
      legalPages: isLegalPagesLoading
    }
  });

  const socialMedia = [
    { key: 'facebook', url: siteInfo?.facebookUrl, enabled: (siteInfo as any)?.facebookEnabled === 1 },
    { key: 'instagram', url: siteInfo?.instagramUrl, enabled: (siteInfo as any)?.instagramEnabled === 1 },
    { key: 'twitter', url: siteInfo?.twitterUrl, enabled: (siteInfo as any)?.twitterEnabled === 1 },
    { key: 'tiktok', url: siteInfo?.tiktokUrl, enabled: (siteInfo as any)?.tiktokEnabled === 1 },
    { key: 'youtube', url: siteInfo?.youtubeUrl, enabled: (siteInfo as any)?.youtubeEnabled === 1 },
    { key: 'linkedin', url: siteInfo?.linkedinUrl, enabled: (siteInfo as any)?.linkedinEnabled === 1 },
    { key: 'whatsapp', url: siteInfo?.whatsappNumber ? `https://wa.me/${siteInfo.whatsappNumber.replace(/[^0-9]/g, '')}` : '', enabled: (siteInfo as any)?.whatsappEnabled === 1 },
    { key: 'pinterest', url: (siteInfo as any)?.pinterestUrl, enabled: (siteInfo as any)?.pinterestEnabled === 1 },
  ].filter(social => social.enabled && social.url);

  // Build formatted address from siteInfo
  const businessAddress = siteInfo?.address && siteInfo?.city && siteInfo?.province
    ? `${siteInfo.address}, ${siteInfo.city}, ${siteInfo.province}${siteInfo.postalCode ? ` ${siteInfo.postalCode}` : ''}`
    : null;

  return (
    <footer className="bg-muted/50 border-t mt-12 md:mt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          <div>
            {siteInfo && getLogoUrl(siteInfo) ? (
              <div className="mb-4">
                <img 
                  src={getLogoUrl(siteInfo)!} 
                  alt={siteInfo.businessName || "Logo"} 
                  className="h-16 md:h-28 w-auto object-contain"
                  data-testid="img-footer-logo"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const fallback = target.nextElementSibling as HTMLElement;
                    if (fallback) fallback.style.display = 'block';
                  }}
                />
              </div>
            ) : (
              <h3 className="font-serif text-2xl font-bold text-primary mb-4">
                {siteInfo?.businessName || "Dounie Cuisine"}
              </h3>
            )}
            {siteInfo?.tagline && (
              <p className="text-sm text-muted-foreground mb-4">
                {siteInfo.tagline}
              </p>
            )}
            {socialMedia.length > 0 && (
              <div className="flex gap-3 flex-wrap">
                {socialMedia.map((social) => (
                  <SocialIcon key={social.key} platform={social.key} url={social.url!} />
                ))}
              </div>
            )}
          </div>

          <div>
            <h4 className="font-semibold mb-4">Liens Rapides</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#menu" className="text-muted-foreground hover:text-primary transition-colors" data-testid="link-footer-menu">
                  Menu
                </a>
              </li>
              <li>
                <a href="#events" className="text-muted-foreground hover:text-primary transition-colors" data-testid="link-footer-events">
                  Événements
                </a>
              </li>
              <li>
                <a href="#gallery" className="text-muted-foreground hover:text-primary transition-colors" data-testid="link-footer-gallery">
                  Galerie
                </a>
              </li>
              <li>
                <a href="/faq" className="text-muted-foreground hover:text-primary transition-colors" data-testid="link-footer-faq">
                  FAQ
                </a>
              </li>
              <li>
                <a href="#about" className="text-muted-foreground hover:text-primary transition-colors" data-testid="link-footer-about">
                  À Propos
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Contact</h4>
            <ul className="space-y-3 text-sm">
              {siteInfo?.phone1 && (
                <li className="flex items-start gap-2">
                  <Phone className="w-4 h-4 mt-1 text-muted-foreground flex-shrink-0" />
                  <span>
                    <a 
                      href={`tel:${siteInfo.phone1.replace(/[^0-9+]/g, '')}`} 
                      className="text-muted-foreground hover:text-primary transition-colors" 
                      data-testid="link-footer-phone"
                    >
                      {siteInfo.phone1}
                    </a>
                    {siteInfo.phone2 && (
                      <>
                        <span className="mx-2 text-muted-foreground">/</span>
                        <a 
                          href={`tel:${siteInfo.phone2.replace(/[^0-9+]/g, '')}`} 
                          className="text-muted-foreground hover:text-primary transition-colors" 
                          data-testid="link-footer-phone2"
                        >
                          {siteInfo.phone2}
                        </a>
                      </>
                    )}
                  </span>
                </li>
              )}
              {siteInfo?.emailPrimary && (
                <li className="flex items-start gap-2">
                  <Mail className="w-4 h-4 mt-1 text-muted-foreground flex-shrink-0" />
                  <a 
                    href={`mailto:${siteInfo.emailPrimary}`} 
                    className="text-muted-foreground hover:text-primary transition-colors" 
                    data-testid="link-footer-email"
                  >
                    {siteInfo.emailPrimary}
                  </a>
                </li>
              )}
              {businessAddress && (
                <li className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 mt-1 text-muted-foreground flex-shrink-0" />
                  <span className="text-muted-foreground">
                    {businessAddress}
                    {siteInfo?.country && siteInfo.country !== "Canada" && <><br />{siteInfo.country}</>}
                  </span>
                </li>
              )}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Newsletter</h4>
            <p className="text-sm text-muted-foreground mb-4">
              Recevez nos promotions et nouveautés
            </p>
            <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); console.log("Newsletter subscribed"); }}>
              <Input
                type="email"
                placeholder="Votre email"
                className="flex-1"
                data-testid="input-newsletter-email"
              />
              <Button type="submit" data-testid="button-newsletter-subscribe">
                S'abonner
              </Button>
            </form>
          </div>
        </div>

        <div className="border-t mt-8 pt-8">
          {/* Payment Methods */}
          <div className="flex flex-col sm:flex-row justify-center items-center gap-3 sm:gap-4 mb-6">
            <span className="text-sm text-muted-foreground font-medium text-center">Modes de paiement acceptés:</span>
            <div className="grid grid-cols-3 sm:flex items-center gap-2 sm:gap-3 max-w-xs sm:max-w-none">
              <div className="px-2 py-1 sm:px-3 sm:py-1.5 bg-white rounded border shadow-sm">
                <span className="text-blue-700 font-bold text-xs sm:text-sm">VISA</span>
              </div>
              <div className="px-2 py-1 sm:px-3 sm:py-1.5 bg-white rounded border shadow-sm">
                <span className="text-orange-600 font-bold text-xs sm:text-sm">Mastercard</span>
              </div>
              <div className="px-2 py-1 sm:px-3 sm:py-1.5 bg-white rounded border shadow-sm">
                <span className="text-blue-600 font-bold text-xs sm:text-sm">AMEX</span>
              </div>
              <div className="px-2 py-1 sm:px-3 sm:py-1.5 bg-white rounded border shadow-sm">
                <span className="text-purple-700 font-bold text-xs sm:text-sm">Discover</span>
              </div>
              <div className="px-2 py-1 sm:px-3 sm:py-1.5 bg-white rounded border shadow-sm flex items-center gap-1">
                <span className="text-gray-800 font-bold text-xs sm:text-sm">Interac</span>
              </div>
              <div className="px-2 py-1 sm:px-3 sm:py-1.5 bg-white rounded border shadow-sm">
                <span className="text-gray-700 font-semibold text-xs sm:text-sm">Crédit</span>
              </div>
              <div className="px-2 py-1 sm:px-3 sm:py-1.5 bg-white rounded border shadow-sm">
                <span className="text-indigo-600 font-semibold text-xs sm:text-sm">Visa Débit</span>
              </div>
              <div className="px-2 py-1 sm:px-3 sm:py-1.5 bg-white rounded border shadow-sm">
                <span className="text-orange-600 font-semibold text-xs sm:text-sm">Debit Mastercard</span>
              </div>
              <div className="px-2 py-1 sm:px-3 sm:py-1.5 bg-green-700 text-white rounded shadow-sm flex items-center gap-1">
                <svg className="w-3 h-3 sm:w-4 sm:h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2L4 6v6c0 5.5 3.8 10.7 8 12 4.2-1.3 8-6.5 8-12V6l-8-4z"/>
                </svg>
                <span className="font-semibold text-xs">SSL Sécurisé</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
            <p>© {new Date().getFullYear()} {siteInfo?.businessName || "Dounie Cuisine"}. Tous droits réservés.</p>
            <div className="flex gap-6 flex-wrap">
              {legalPages?.map((page) => (
                <Link 
                  key={page.id}
                  href={`/legal/${page.slug}`} 
                  className="hover:text-primary transition-colors"
                  data-testid={`link-legal-${page.slug}`}
                >
                  {page.title}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
