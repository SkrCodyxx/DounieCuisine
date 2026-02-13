import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Playfair_Display } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

const jakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Dounie Cuisine - Service Traiteur & Evenements",
    template: "%s | Dounie Cuisine",
  },
  description:
    "Service traiteur haitien authentique pour vos evenements prives et corporatifs. Commander pour emporter ou planifier votre prochain evenement.",
  keywords: ["traiteur", "cuisine haitienne", "evenements", "Montreal", "catering"],
  openGraph: {
    type: "website",
    locale: "fr_CA",
    siteName: "Dounie Cuisine",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#c2410c",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className={`${jakartaSans.variable} ${playfairDisplay.variable}`}>
      <body className="font-sans antialiased bg-background text-foreground overflow-y-auto overflow-x-hidden min-h-screen flex flex-col">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
