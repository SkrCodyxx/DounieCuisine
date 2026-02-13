"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Facebook, Instagram, Mail, MapPin, Phone, MessageCircle, Youtube, Linkedin } from "lucide-react";
import { SiTiktok, SiX, SiPinterest } from "react-icons/si";
import { useSiteInfo } from "@/hooks/use-site-info";
import { getLogoUrl } from "@/lib/image-utils";
import { apiRequest } from "@/lib/query-client";
import type { LegalPage } from "@/lib/schema";

function SocialIcon({ platform, url }: { platform: string; url: string }) {
  const iconClass = "w-5 h-5 text-primary";
  const icons: Record<string, React.ReactNode> = {
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
    >
      {icons[platform]}
    </a>
  );
}

export default function Footer() {
  const { data: siteInfo } = useSiteInfo();

  const { data: legalPages } = useQuery<LegalPage[]>({
    queryKey: ["/api/legal-pages"],
    queryFn: () => apiRequest<LegalPage[]>("GET", "/api/legal-pages"),
    staleTime: 4 * 60 * 60 * 1000,
    gcTime: 8 * 60 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  const socialMedia = [
    { key: "facebook", url: siteInfo?.facebookUrl },
    { key: "instagram", url: siteInfo?.instagramUrl },
    { key: "twitter", url: siteInfo?.twitterUrl },
    { key: "youtube", url: siteInfo?.youtubeUrl },
    { key: "linkedin", url: siteInfo?.linkedinUrl },
    {
      key: "whatsapp",
      url: siteInfo?.whatsappNumber
        ? `https://wa.me/${siteInfo.whatsappNumber.replace(/[^0-9]/g, "")}`
        : undefined,
    },
  ].filter((s): s is { key: string; url: string } => Boolean(s.url));

  const businessAddress =
    siteInfo?.address && siteInfo?.city && siteInfo?.province
      ? `${siteInfo.address}, ${siteInfo.city}, ${siteInfo.province}${siteInfo.postalCode ? ` ${siteInfo.postalCode}` : ""}`
      : null;

  return (
    <footer className="bg-muted/50 border-t mt-12 md:mt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {/* Brand column */}
          <div>
            {siteInfo && getLogoUrl(siteInfo) ? (
              <div className="mb-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={getLogoUrl(siteInfo)!}
                  alt={siteInfo.businessName || "Logo"}
                  className="h-16 md:h-28 w-auto object-contain"
                />
              </div>
            ) : (
              <h3 className="font-serif text-2xl font-bold text-primary mb-4">
                {siteInfo?.businessName || "Dounie Cuisine"}
              </h3>
            )}
            {siteInfo?.tagline && (
              <p className="text-sm text-muted-foreground mb-4">{siteInfo.tagline}</p>
            )}
            {socialMedia.length > 0 && (
              <div className="flex gap-3 flex-wrap">
                {socialMedia.map((social) => (
                  <SocialIcon key={social.key} platform={social.key} url={social.url} />
                ))}
              </div>
            )}
          </div>

          {/* Quick links */}
          <div>
            <h4 className="font-semibold mb-4">Liens Rapides</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/menu" className="text-muted-foreground hover:text-primary transition-colors">Menu</Link>
              </li>
              <li>
                <Link href="/events" className="text-muted-foreground hover:text-primary transition-colors">Evenements</Link>
              </li>
              <li>
                <Link href="/gallery" className="text-muted-foreground hover:text-primary transition-colors">Galerie</Link>
              </li>
              <li>
                <Link href="/faq" className="text-muted-foreground hover:text-primary transition-colors">FAQ</Link>
              </li>
              <li>
                <Link href="/contact" className="text-muted-foreground hover:text-primary transition-colors">Contact</Link>
              </li>
            </ul>
          </div>

          {/* Contact column */}
          <div>
            <h4 className="font-semibold mb-4">Contact</h4>
            <ul className="space-y-3 text-sm">
              {siteInfo?.phone1 && (
                <li className="flex items-start gap-2">
                  <Phone className="w-4 h-4 mt-1 text-muted-foreground flex-shrink-0" />
                  <span>
                    <a href={`tel:${siteInfo.phone1.replace(/[^0-9+]/g, "")}`} className="text-muted-foreground hover:text-primary transition-colors">
                      {siteInfo.phone1}
                    </a>
                    {siteInfo.phone2 && (
                      <>
                        <span className="mx-2 text-muted-foreground">/</span>
                        <a href={`tel:${siteInfo.phone2.replace(/[^0-9+]/g, "")}`} className="text-muted-foreground hover:text-primary transition-colors">
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
                  <a href={`mailto:${siteInfo.emailPrimary}`} className="text-muted-foreground hover:text-primary transition-colors">
                    {siteInfo.emailPrimary}
                  </a>
                </li>
              )}
              {businessAddress && (
                <li className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 mt-1 text-muted-foreground flex-shrink-0" />
                  <span className="text-muted-foreground">{businessAddress}</span>
                </li>
              )}
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="font-semibold mb-4">Newsletter</h4>
            <p className="text-sm text-muted-foreground mb-4">
              Recevez nos promotions et nouveautes
            </p>
            <form className="flex gap-2" onSubmit={(e) => e.preventDefault()}>
              <Input type="email" placeholder="Votre email" className="flex-1" />
              <Button type="submit">{"S'abonner"}</Button>
            </form>
          </div>
        </div>

        {/* Bottom section */}
        <div className="border-t mt-8 pt-8">
          {/* Payment methods */}
          <div className="flex flex-col sm:flex-row justify-center items-center gap-3 sm:gap-4 mb-6">
            <span className="text-sm text-muted-foreground font-medium text-center">
              Modes de paiement acceptes:
            </span>
            <div className="grid grid-cols-3 sm:flex items-center gap-2 sm:gap-3 max-w-xs sm:max-w-none">
              {["VISA", "Mastercard", "AMEX", "Discover", "Interac", "Credit", "Visa Debit", "Debit MC"].map(
                (method) => (
                  <div key={method} className="px-2 py-1 sm:px-3 sm:py-1.5 bg-white rounded border shadow-sm">
                    <span className="text-foreground font-bold text-xs sm:text-sm">{method}</span>
                  </div>
                )
              )}
              <div className="px-2 py-1 sm:px-3 sm:py-1.5 bg-green-700 text-white rounded shadow-sm flex items-center gap-1">
                <svg className="w-3 h-3 sm:w-4 sm:h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2L4 6v6c0 5.5 3.8 10.7 8 12 4.2-1.3 8-6.5 8-12V6l-8-4z" />
                </svg>
                <span className="font-semibold text-xs">SSL Securise</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
            <p>
              &copy; {new Date().getFullYear()} {siteInfo?.businessName || "Dounie Cuisine"}. Tous droits reserves.
            </p>
            <div className="flex gap-6 flex-wrap">
              {legalPages?.map((page) => (
                <Link
                  key={page.id}
                  href={`/legal/${page.slug}`}
                  className="hover:text-primary transition-colors"
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
