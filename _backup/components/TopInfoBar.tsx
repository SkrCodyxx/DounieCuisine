import React from "react";
import { useSiteInfo } from "@/hooks/useSiteInfo";

interface SiteInfo {
  phone1?: string;
  phone1_label?: string;
  phone2?: string;
  phone2_label?: string;
  email_primary?: string;
  email_secondary?: string;
  address?: string;
  city?: string;
  province?: string;
  postalCode?: string;
  business_hours?: any;
  businessName?: string;
}

export default function TopInfoBar() {
  const { data: siteInfo } = useSiteInfo();

  if (!siteInfo) return null;

  // Formatage des heures d'ouverture simplifié
  const formatBusinessHours = () => {
    if (!siteInfo.business_hours) return null;
    
    try {
      const hours = typeof siteInfo.business_hours === 'string' 
        ? JSON.parse(siteInfo.business_hours) 
        : siteInfo.business_hours;
      
      const now = new Date();
      const currentDay = now.getDay();
      const currentTime = now.getHours() * 100 + now.getMinutes();
      
      const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const currentDayName = dayNames[currentDay];
      const todayHours = hours[currentDayName];
      
      if (!todayHours || !todayHours.enabled) {
        return "Fermé aujourd'hui";
      }
      
      const openTime = parseInt(todayHours.open.replace(':', ''));
      const closeTime = parseInt(todayHours.close.replace(':', ''));
      const isCurrentlyOpen = currentTime >= openTime && currentTime <= closeTime;
      
      if (isCurrentlyOpen) {
        return `🕐 Ouvert jusqu'à ${todayHours.close}`;
      } else {
        return `🔒 Ouvre à ${todayHours.open}`;
      }
    } catch (error) {
      return null;
    }
  };

  const businessHours = formatBusinessHours();
  
  // Créer le texte à faire défiler avec labels détaillés
  const createDetailedInfoItems = () => {
    const items = [];
    
    // Téléphones avec labels clairs
    if (siteInfo.phone1) {
      items.push(`📞 TÉL: ${siteInfo.phone1}`);
    }
    
    if (siteInfo.phone2) {
      items.push(`📞 TÉL 2: ${siteInfo.phone2}`);
    }
    
    // Emails avec labels
    if (siteInfo.email_primary) {
      items.push(`✉️ CONTACT: ${siteInfo.email_primary}`);
    }
    
    if (siteInfo.email_secondary) {
      items.push(`✉️ INFO: ${siteInfo.email_secondary}`);
    }
    
    // Adresse complète
    if (siteInfo.address) {
      let fullAddress = `📍 ADRESSE: ${siteInfo.address}`;
      if (siteInfo.city) fullAddress += `, ${siteInfo.city}`;
      if (siteInfo.province) fullAddress += `, ${siteInfo.province}`;
      if (siteInfo.postalCode) fullAddress += ` ${siteInfo.postalCode}`;
      items.push(fullAddress);
    }
    
    // Heures d'ouverture
    if (businessHours) {
      items.push(`⏰ HEURES: ${businessHours.replace('🕐 ', '').replace('🔒 ', '')}`);
    }
    
    return items;
  };
  
  const infoItems = createDetailedInfoItems();
  
  // Créer le texte en boucle continue pour animation fluide
  const scrollingText = infoItems.join(' • ');
  
  if (!scrollingText) return null;

  return (
    <>
      <style>{`
        @keyframes scroll-left-continuous {
          0% { 
            transform: translateX(0%);
          }
          100% { 
            transform: translateX(-100%);
          }
        }
        .scrolling-text-container {
          animation: scroll-left-continuous 45s linear infinite;
        }
        .scrolling-text-container:hover {
          animation-play-state: paused;
        }
      `}</style>
      <div className="fixed top-0 left-0 right-0 bg-gradient-to-r from-orange-600 to-orange-700 text-white py-1.5 overflow-hidden z-50 h-7 shadow-sm">
        <div className="scrolling-text-container whitespace-nowrap text-sm font-medium leading-none flex items-center h-full">
          <span className="inline-block pr-8">{scrollingText}</span>
          <span className="inline-block pr-8">{scrollingText}</span>
          <span className="inline-block pr-8">{scrollingText}</span>
        </div>
      </div>
    </>
  );
}