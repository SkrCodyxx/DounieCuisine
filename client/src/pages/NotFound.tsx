import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft } from "lucide-react";

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-amber-50 dark:from-gray-900 dark:to-gray-800 px-4">
      <div className="text-center space-y-8 max-w-2xl">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <img 
            src="/logo.png" 
            alt="Dounie Cuisine Logo" 
            className="h-32 w-auto object-contain"
            data-testid="img-404-logo"
          />
        </div>

        {/* 404 Error */}
        <div className="space-y-4">
          <h1 
            className="text-9xl font-bold text-primary"
            data-testid="text-404-number"
          >
            404
          </h1>
          <h2 
            className="text-3xl font-serif font-bold text-foreground"
            data-testid="text-404-title"
          >
            Page Non Trouvée
          </h2>
          <p 
            className="text-xl text-muted-foreground max-w-md mx-auto"
            data-testid="text-404-description"
          >
            Oups! La page que vous cherchez semble avoir été déplacée ou n'existe plus.
          </p>
        </div>

        {/* Brand Message */}
        <div className="py-6 border-t border-b border-orange-200 dark:border-orange-800">
          <p className="text-lg font-serif italic text-foreground">
            "L'Art du Goût Haïtien au Canada"
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link href="/">
            <Button size="lg" data-testid="button-home">
              <Home className="mr-2 h-5 w-5" />
              Retour à l'Accueil
            </Button>
          </Link>
          <Button 
            variant="outline" 
            size="lg" 
            onClick={() => window.history.back()}
            data-testid="button-back"
          >
            <ArrowLeft className="mr-2 h-5 w-5" />
            Page Précédente
          </Button>
        </div>

        {/* Quick Links */}
        <div className="pt-8">
          <p className="text-sm text-muted-foreground mb-4">
            Liens rapides :
          </p>
          <div className="flex flex-wrap gap-4 justify-center text-sm">
            <Link href="/catering" className="text-primary hover:underline">
              Service Traiteur
            </Link>
            <Link href="/menu" className="text-primary hover:underline">
              Commande à Emporter
            </Link>
            <Link href="/events" className="text-primary hover:underline">
              Événements
            </Link>
            <Link href="/gallery" className="text-primary hover:underline">
              Galerie
            </Link>
            <Link href="/contact" className="text-primary hover:underline">
              Contact
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
