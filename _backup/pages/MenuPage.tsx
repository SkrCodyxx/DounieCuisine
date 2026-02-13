import { useState } from "react";
import { Button } from "@/components/ui/button";
import { UtensilsCrossed, Users, ChefHat } from "lucide-react";
import Navigation from "@/components/Navigation";
import TopInfoBar from "@/components/TopInfoBar";
import Footer from "@/components/Footer";
import TakeoutMenu from "./TakeoutMenu";
import CateringMenu from "./CateringMenu";

export default function MenuPage() {
  const [activeMenu, setActiveMenu] = useState<"takeout" | "catering">("takeout");

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-white to-amber-50/30 relative">
      {/* Motifs décoratifs en arrière-plan */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-20 right-10 w-72 h-72 bg-orange-200/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 left-10 w-96 h-96 bg-amber-200/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-orange-300/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
      </div>
      
      {/* Motifs géométriques subtils */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.02] z-0" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23f97316' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        backgroundSize: '60px 60px'
      }}></div>
      
      <div className="relative z-10">
        <TopInfoBar />
        <Navigation />

        {/* Hero Section avec design amélioré - connexion parfaite TopInfoBar > Navigation > Hero */}
        <section className="relative bg-gradient-to-r from-primary via-primary/90 to-accent text-white py-6 md:py-8 lg:py-20 pt-[7.5rem] md:pt-[8.75rem] lg:pt-36 overflow-hidden">
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-10 left-10 w-20 md:w-32 h-20 md:h-32 bg-white/10 rounded-full blur-xl animate-pulse"></div>
            <div className="absolute bottom-10 right-10 w-24 md:w-40 h-24 md:h-40 bg-white/10 rounded-full blur-xl animate-pulse" style={{animationDelay: '1s'}}></div>
            <div className="absolute top-1/2 left-1/4 w-32 h-32 bg-amber-400/10 rounded-full blur-2xl animate-pulse" style={{animationDelay: '0.5s'}}></div>
            <div className="absolute bottom-1/4 right-1/3 w-28 h-28 bg-orange-300/10 rounded-full blur-2xl animate-pulse" style={{animationDelay: '1.5s'}}></div>
          </div>
          
          {/* Effet de vague décorative */}
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black/10 to-transparent"></div>
        
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="text-center max-w-4xl mx-auto">
              <div className="flex items-center justify-center mb-6 md:mb-8 lg:mb-12 mt-8 md:mt-12 lg:mt-16">
                <div className="w-24 h-24 md:w-48 md:h-48 lg:w-56 lg:h-56 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm relative overflow-hidden group hover:scale-110 transition-transform duration-300 shadow-2xl">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent"></div>
                  <ChefHat className="w-12 h-12 md:w-24 md:h-24 lg:w-28 lg:h-28 text-white relative z-10 group-hover:rotate-12 transition-transform duration-300" />
                </div>
              </div>
              
              <h1 className="font-serif text-2xl md:text-5xl lg:text-7xl font-bold mb-2 md:mb-3 lg:mb-6">
                Nos Menus
              </h1>
              
              <p className="text-sm md:text-xl lg:text-2xl text-white/90 mb-4 md:mb-6 lg:mb-10 leading-relaxed px-2">
                Savourez l'authenticité d'Haïti - À emporter ou pour vos événements
              </p>

              {/* Menu Toggle Buttons avec design cohérent */}
              <div className="flex flex-col sm:flex-row justify-center gap-2 md:gap-3 lg:gap-4 max-w-2xl mx-auto px-2 md:px-4">
                <Button
                  size="lg"
                  onClick={() => setActiveMenu("takeout")}
                  className={`
                    flex-1 text-sm md:text-base lg:text-lg px-4 md:px-6 lg:px-8 py-4 md:py-6 lg:py-7 font-semibold
                    transition-all duration-300 transform hover:scale-105 hover:shadow-2xl
                    ${activeMenu === "takeout"
                      ? "bg-white text-primary hover:bg-white/95 shadow-xl scale-105 ring-2 ring-white/50"
                      : "bg-white/10 text-white hover:bg-white/20 backdrop-blur-md border-2 border-white/30"
                    }
                  `}
                >
                  <UtensilsCrossed className="mr-1 md:mr-2 h-4 w-4 md:h-5 md:w-5 lg:h-6 lg:w-6" />
                  Menu À Emporter
                </Button>

                <Button
                  size="lg"
                  onClick={() => setActiveMenu("catering")}
                  className={`
                    flex-1 text-sm md:text-base lg:text-lg px-4 md:px-6 lg:px-8 py-4 md:py-6 lg:py-7 font-semibold
                    transition-all duration-300 transform hover:scale-105 hover:shadow-2xl
                    ${activeMenu === "catering"
                      ? "bg-white text-primary hover:bg-white/95 shadow-xl scale-105 ring-2 ring-white/50"
                      : "bg-white/10 text-white hover:bg-white/20 backdrop-blur-md border-2 border-white/30"
                    }
                  `}
                >
                  <Users className="mr-1 md:mr-2 h-4 w-4 md:h-5 md:w-5 lg:h-6 lg:w-6" />
                  Menu Traiteur
                </Button>
              </div>

              {/* Indicateur de menu actif */}
              <div className="mt-6 md:mt-8 flex items-center justify-center gap-2 text-sm md:text-base text-white/80">
                <div className={`w-2 h-2 rounded-full ${activeMenu === "takeout" ? "bg-white animate-pulse" : "bg-white/30"}`}></div>
                <span className="hidden sm:inline">Menu actif:</span>
                <span className="font-semibold text-white">
                  {activeMenu === "takeout" ? "À Emporter" : "Traiteur"}
                </span>
                <div className={`w-2 h-2 rounded-full ${activeMenu === "catering" ? "bg-white animate-pulse" : "bg-white/30"}`}></div>
              </div>
            </div>
          </div>
        </section>

        {/* Menu Content avec transition fluide */}
        <div className="flex-1 transition-all duration-500 ease-in-out">
          {activeMenu === "takeout" ? (
            <TakeoutMenu embedded />
          ) : (
            <CateringMenu embedded />
          )}
        </div>

        <Footer />
      </div>
    </div>
  );
}
