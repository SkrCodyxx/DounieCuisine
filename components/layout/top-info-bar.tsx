"use client";

import { useSiteInfo } from "@/hooks/use-site-info";
import type { SiteInfo } from "@/lib/schema";

function formatBusinessHours(siteInfo: SiteInfo): string | null {
  const hours = siteInfo.businessHours;
  if (!hours) return null;

  try {
    const parsed = typeof hours === "string" ? JSON.parse(hours) : hours;
    const now = new Date();
    const dayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
    const currentDayName = dayNames[now.getDay()];
    const todayHours = (parsed as Record<string, { enabled: boolean; open: string; close: string }>)[currentDayName];

    if (!todayHours?.enabled) return "Ferme aujourd'hui";

    const currentTime = now.getHours() * 100 + now.getMinutes();
    const openTime = parseInt(todayHours.open.replace(":", ""));
    const closeTime = parseInt(todayHours.close.replace(":", ""));

    return currentTime >= openTime && currentTime <= closeTime
      ? `Ouvert jusqu'a ${todayHours.close}`
      : `Ouvre a ${todayHours.open}`;
  } catch {
    return null;
  }
}

export default function TopInfoBar() {
  const { data: siteInfo } = useSiteInfo();

  if (!siteInfo) return null;

  const items: string[] = [];
  if (siteInfo.phone1) items.push(`TEL: ${siteInfo.phone1}`);
  if (siteInfo.phone2) items.push(`TEL 2: ${siteInfo.phone2}`);
  if (siteInfo.emailPrimary) items.push(`CONTACT: ${siteInfo.emailPrimary}`);
  if (siteInfo.address) {
    let addr = `ADRESSE: ${siteInfo.address}`;
    if (siteInfo.city) addr += `, ${siteInfo.city}`;
    if (siteInfo.province) addr += `, ${siteInfo.province}`;
    if (siteInfo.postalCode) addr += ` ${siteInfo.postalCode}`;
    items.push(addr);
  }
  const bh = formatBusinessHours(siteInfo);
  if (bh) items.push(`HEURES: ${bh}`);

  const scrollingText = items.join(" \u2022 ");
  if (!scrollingText) return null;

  return (
    <>
      <style>{`
        @keyframes scroll-left-continuous {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-100%); }
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
