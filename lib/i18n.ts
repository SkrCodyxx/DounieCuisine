/**
 * Lightweight i18n system for Dounie Cuisine (FR/EN)
 * Uses cookie-based locale preference.
 */

export type Locale = "fr" | "en";

export const DEFAULT_LOCALE: Locale = "fr";

const translations: Record<string, Record<Locale, string>> = {
  // Navigation
  "nav.home": { fr: "Accueil", en: "Home" },
  "nav.menu": { fr: "Menu", en: "Menu" },
  "nav.events": { fr: "Evenements", en: "Events" },
  "nav.gallery": { fr: "Galerie", en: "Gallery" },
  "nav.contact": { fr: "Contact", en: "Contact" },
  "nav.order": { fr: "Commander", en: "Order" },
  "nav.faq": { fr: "FAQ", en: "FAQ" },

  // Services section
  "services.title": { fr: "Nos Services", en: "Our Services" },
  "services.subtitle": { fr: "Tout ce dont vous avez besoin pour un evenement reussi", en: "Everything you need for a successful event" },
  "services.catering": { fr: "Service Traiteur", en: "Catering Service" },
  "services.catering.desc": { fr: "Saveurs authentiques pour vos evenements prives et corporatifs", en: "Authentic flavors for your private and corporate events" },
  "services.events": { fr: "Organisation d'Evenements", en: "Event Planning" },
  "services.events.desc": { fr: "Planification complete pour des evenements inoubliables", en: "Complete planning for unforgettable events" },
  "services.dj": { fr: "DJ & Animation", en: "DJ & Entertainment" },
  "services.dj.desc": { fr: "Musique et animation professionnelle pour creer l'ambiance parfaite", en: "Professional music and entertainment to create the perfect atmosphere" },

  // Events section
  "events.title": { fr: "Evenements a Venir", en: "Upcoming Events" },
  "events.subtitle": { fr: "Rejoignez-nous pour des celebrations inoubliables", en: "Join us for unforgettable celebrations" },
  "events.viewAll": { fr: "Tous les Evenements", en: "All Events" },

  // Testimonials section
  "testimonials.title": { fr: "Temoignages", en: "Testimonials" },
  "testimonials.subtitle": { fr: "Ce que nos clients disent de nous", en: "What our clients say about us" },
  "testimonials.leave": { fr: "Laisser un avis", en: "Leave a Review" },

  // Gallery section
  "gallery.title": { fr: "Galerie", en: "Gallery" },
  "gallery.subtitle": { fr: "Decouvrez nos creations et evenements en images", en: "Discover our creations and events in images" },
  "gallery.viewAll": { fr: "Voir Toute la Galerie", en: "View Full Gallery" },

  // Contact section
  "contact.title": { fr: "Contactez-nous", en: "Contact Us" },
  "contact.subtitle": { fr: "Nous sommes la pour repondre a toutes vos questions", en: "We are here to answer all your questions" },
  "contact.success": { fr: "Message envoye!", en: "Message sent!" },
  "contact.successDesc": { fr: "Nous vous repondrons bientot.", en: "We will reply to you soon." },
  "contact.error": { fr: "Erreur", en: "Error" },
  "contact.errorDesc": { fr: "Une erreur s'est produite. Veuillez reessayer.", en: "An error occurred. Please try again." },

  // Footer
  "footer.quickLinks": { fr: "Liens Rapides", en: "Quick Links" },
  "footer.contact": { fr: "Contact", en: "Contact" },
  "footer.newsletter": { fr: "Newsletter", en: "Newsletter" },
  "footer.newsletter.desc": { fr: "Recevez nos promotions et nouveautes", en: "Receive our promotions and news" },
  "footer.newsletter.placeholder": { fr: "Votre email", en: "Your email" },
  "footer.newsletter.subscribe": { fr: "S'abonner", en: "Subscribe" },
  "footer.payment": { fr: "Modes de paiement acceptes:", en: "Accepted payment methods:" },
  "footer.rights": { fr: "Tous droits reserves.", en: "All rights reserved." },
  "footer.about": { fr: "A Propos", en: "About" },
  "footer.learnMore": { fr: "En savoir plus", en: "Learn more" },

  // Menu page
  "menu.title": { fr: "Notre Menu", en: "Our Menu" },
  "menu.takeout": { fr: "Pour Emporter", en: "Takeout" },
  "menu.catering": { fr: "Traiteur", en: "Catering" },
  "menu.addToCart": { fr: "Ajouter au panier", en: "Add to Cart" },
  "menu.outOfStock": { fr: "Rupture de stock", en: "Out of Stock" },

  // Cart
  "cart.title": { fr: "Votre Panier", en: "Your Cart" },
  "cart.empty": { fr: "Votre panier est vide", en: "Your cart is empty" },
  "cart.subtotal": { fr: "Sous-total", en: "Subtotal" },
  "cart.checkout": { fr: "Commander", en: "Checkout" },
  "cart.remove": { fr: "Retirer", en: "Remove" },

  // FAQ
  "faq.title": { fr: "Questions Frequentes", en: "Frequently Asked Questions" },
  "faq.subtitle": { fr: "Trouvez les reponses a vos questions", en: "Find answers to your questions" },

  // General
  "general.loading": { fr: "Chargement...", en: "Loading..." },
  "general.error": { fr: "Une erreur est survenue", en: "An error occurred" },
  "general.notFound": { fr: "Page non trouvee", en: "Page not found" },
  "general.back": { fr: "Retour", en: "Back" },
  "general.sslSecure": { fr: "SSL Securise", en: "SSL Secure" },
};

export function t(key: string, locale: Locale = DEFAULT_LOCALE): string {
  const entry = translations[key];
  if (!entry) return key;
  return entry[locale] || entry[DEFAULT_LOCALE] || key;
}

export function getLocaleFromCookie(cookieValue: string | undefined): Locale {
  if (cookieValue === "en" || cookieValue === "fr") return cookieValue;
  return DEFAULT_LOCALE;
}
