"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-amber-50 px-4">
      <div className="text-center space-y-8 max-w-2xl">
        <div className="flex justify-center mb-8">
          <img
            src="/logo.png"
            alt="Dounie Cuisine Logo"
            className="h-32 w-auto object-contain"
          />
        </div>

        <div className="space-y-4">
          <h1 className="text-9xl font-bold text-primary">404</h1>
          <h2 className="text-3xl font-serif font-bold text-foreground">Page Non Trouvee</h2>
          <p className="text-xl text-muted-foreground max-w-md mx-auto">
            {"Oups! La page que vous cherchez semble avoir ete deplacee ou n'existe plus."}
          </p>
        </div>

        <div className="py-6 border-t border-b border-orange-200">
          <p className="text-lg font-serif italic text-foreground">
            {"\"L'Art du Gout Haitien au Canada\""}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link href="/">
            <Button size="lg">
              <Home className="mr-2 h-5 w-5" />
              {"Retour a l'Accueil"}
            </Button>
          </Link>
          <Button variant="outline" size="lg" onClick={() => typeof window !== "undefined" && window.history.back()}>
            <ArrowLeft className="mr-2 h-5 w-5" />
            Page Precedente
          </Button>
        </div>

        <div className="pt-8">
          <p className="text-sm text-muted-foreground mb-4">Liens rapides :</p>
          <div className="flex flex-wrap gap-4 justify-center text-sm">
            <Link href="/catering" className="text-primary hover:underline">Service Traiteur</Link>
            <Link href="/takeout" className="text-primary hover:underline">Commande a Emporter</Link>
            <Link href="/events" className="text-primary hover:underline">Evenements</Link>
            <Link href="/gallery" className="text-primary hover:underline">Galerie</Link>
            <Link href="/contact" className="text-primary hover:underline">Contact</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
