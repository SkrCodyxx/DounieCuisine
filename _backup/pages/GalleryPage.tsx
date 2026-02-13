import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import Navigation from "@/components/Navigation";
import TopInfoBar from "@/components/TopInfoBar";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Calendar, MapPin, Image as ImageIcon, Award, Camera, Star, ChevronRight } from "lucide-react";

interface GalleryAlbum {
  id: number;
  title: string;
  description: string | null;
  eventDate: string | null;
  location: string | null;
  coverImageId: number | null;
  category: string;
  displayOrder: number;
  isActive: number;
  isFeatured: number;
  createdAt: string;
  updatedAt: string;
  photoCount: number;
}

export default function GalleryPage() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Cache très long - albums de galerie changent rarement
  const { data: albums = [], isLoading, error } = useQuery<GalleryAlbum[]>({
    queryKey: ["/api/gallery-albums"],
    staleTime: 2 * 60 * 60 * 1000, // 2 heures - albums changent très rarement
    gcTime: 4 * 60 * 60 * 1000, // 4 heures en cache
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  // Filtrer les albums par recherche
  const filteredAlbums = albums?.filter((album) =>
    album.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (album.description && album.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (album.location && album.location.toLowerCase().includes(searchQuery.toLowerCase()))
  ) || [];

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-orange-50 relative">
      {/* Motifs décoratifs en arrière-plan */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-20 right-20 w-80 h-80 bg-orange-200/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-40 left-20 w-96 h-96 bg-amber-200/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1.5s'}}></div>
        <div className="absolute top-1/2 left-1/3 w-72 h-72 bg-pink-200/15 rounded-full blur-3xl animate-pulse" style={{animationDelay: '3s'}}></div>
      </div>
      
      {/* Motifs géométriques photo */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.02] z-0" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ea580c' fill-opacity='1' fill-rule='evenodd'%3E%3Cpath d='M0 40L40 0H20L0 20M40 40V20L20 40'/%3E%3C/g%3E%3C/svg%3E")`,
        backgroundSize: '40px 40px'
      }}></div>
      
      <div className="relative z-10">
        <TopInfoBar />
        <Navigation />

        {/* Section Hero Professionnelle - connexion parfaite TopInfoBar > Navigation > Hero */}
        <section className="relative pt-[7.5rem] md:pt-[8.75rem] lg:pt-36 min-h-[70vh] flex items-center justify-center overflow-hidden bg-gradient-to-r from-gray-900 via-gray-800 to-gray-700">
          <div className="absolute inset-0 bg-black/20"></div>
          
          {/* Motifs décoratifs animés dans le hero */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-10 right-10 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-20 left-20 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
            <div className="absolute top-1/3 right-1/3 w-48 h-48 bg-red-500/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
          </div>
          
          {/* Effet de vague en bas */}
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/30 to-transparent"></div>
          
          <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-white font-medium mb-6 hover:bg-white/20 transition-all duration-300 hover:scale-105 cursor-default group">
              <Award className="w-4 h-4 group-hover:rotate-12 transition-transform duration-300" />
              Albums & Événements Mémorables
            </div>
            <h1 className="font-serif text-5xl md:text-7xl font-bold mb-6">
              Notre
              <span className="block bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">
                Galerie
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-200 max-w-3xl mx-auto leading-relaxed mb-8">
              Découvrez nos événements et célébrations à travers des albums photos soigneusement organisés.
            </p>
            <div className="flex items-center justify-center gap-8 text-sm text-gray-300">
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4" />
                <span>{albums?.length || 0} Albums</span>
              </div>
              <div className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4" />
                <span>{albums?.reduce((sum, a) => sum + a.photoCount, 0) || 0} Photos</span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4" />
                <span>Moments d'Exception</span>
              </div>
            </div>
          </div>
        </section>

        {/* Barre de Recherche */}
        <section className="py-8 bg-gradient-to-r from-gray-50 via-orange-50/50 to-amber-50 relative overflow-hidden">
          <div className="absolute inset-0 opacity-30">
            <div className="absolute top-0 left-1/4 w-32 h-32 bg-orange-300/20 rounded-full blur-2xl animate-pulse"></div>
            <div className="absolute bottom-0 right-1/4 w-32 h-32 bg-amber-300/20 rounded-full blur-2xl animate-pulse" style={{animationDelay: '1s'}}></div>
          </div>
          <div className="max-w-md mx-auto px-4 relative z-10">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Rechercher un album..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 pr-4 py-3 text-center bg-white/95 backdrop-blur-sm border-orange-200 focus:border-orange-400 focus:ring-orange-400 transition-all shadow-lg group-hover:shadow-xl"
              />
            </div>
          </div>
        </section>

        {/* Contenu de la Galerie */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white via-orange-50/20 to-white relative overflow-hidden">
          {/* Motifs décoratifs */}
          <div className="absolute top-20 right-10 w-96 h-96 bg-orange-100/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 left-10 w-96 h-96 bg-amber-100/20 rounded-full blur-3xl"></div>
          
          <div className="max-w-7xl mx-auto relative z-10">
            {error ? (
              <div className="text-center py-20">
                <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <ImageIcon className="w-12 h-12 text-red-400" />
                </div>
                <h3 className="text-2xl font-serif font-bold text-gray-900 mb-4">
                  Erreur de chargement
                </h3>
                <p className="text-gray-600 max-w-md mx-auto mb-8">
                  Impossible de charger les albums. Veuillez réessayer.
                </p>
              </div>
            ) : isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Card key={i} className="overflow-hidden">
                    <Skeleton className="aspect-[4/3] w-full" />
                    <CardContent className="p-6">
                      <Skeleton className="h-6 w-3/4 mb-2" />
                      <Skeleton className="h-4 w-full mb-2" />
                      <Skeleton className="h-4 w-2/3" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredAlbums.length > 0 ? (
              <div className="space-y-8">
                {/* Résumé des Résultats */}
                <div className="text-center">
                  <h3 className="text-lg font-medium text-gray-700">
                    {filteredAlbums.length} {filteredAlbums.length === 1 ? 'album' : 'albums'}
                    {searchQuery && <span className="text-primary"> pour "{searchQuery}"</span>}
                  </h3>
                </div>

                {/* Grille des Albums */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredAlbums.map((album) => (
                    <Card
                      key={album.id}
                      onClick={() => setLocation(`/gallery/${album.id}`)}
                      className="overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] bg-white/95 backdrop-blur-sm border-orange-100/50 animate-fadeIn relative group"
                    >
                      {/* Accent décoratif */}
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-orange-500 to-amber-500 transform origin-top scale-y-0 group-hover:scale-y-100 transition-transform duration-300"></div>
                      
                      {/* Image de couverture */}
                      <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200">
                        {((album as any).cover_image_id || album.coverImageId) ? (
                          <>
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10"></div>
                            <img
                              src={`/api/media/${(album as any).cover_image_id || album.coverImageId}`}
                              alt={album.title}
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                            />
                          </>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ImageIcon className="w-16 h-16 text-gray-300" />
                          </div>
                        )}
                        
                        {/* Badge vedette */}
                        {album.isFeatured === 1 && (
                          <Badge className="absolute top-3 right-3 bg-gradient-to-r from-yellow-400 to-amber-500 shadow-lg z-20 animate-bounce">
                            <Star className="w-3 h-3 mr-1" />
                            Vedette
                          </Badge>
                        )}
                        
                        {/* Nombre de photos */}
                        <div className="absolute bottom-3 left-3 bg-black/70 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm font-medium z-20 flex items-center gap-1">
                          <Camera className="w-4 h-4" />
                          {album.photoCount} {album.photoCount === 1 ? 'photo' : 'photos'}
                        </div>
                      </div>

                      <CardContent className="p-6 relative">
                        {/* Motif décoratif */}
                        <div className="absolute top-0 right-0 w-24 h-24 bg-orange-100/20 rounded-full blur-2xl"></div>
                        
                        <div className="relative z-10">
                          <h3 className="text-xl font-semibold mb-2 group-hover:text-orange-600 transition-colors duration-300">
                            {album.title}
                          </h3>
                          
                          {album.description && (
                            <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                              {album.description}
                            </p>
                          )}
                          
                          <div className="space-y-2 text-sm text-gray-500">
                            {album.eventDate && (
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4" />
                                <span>{formatDate(album.eventDate)}</span>
                              </div>
                            )}
                            
                            {album.location && (
                              <div className="flex items-center gap-2">
                                <MapPin className="w-4 h-4" />
                                <span>{album.location}</span>
                              </div>
                            )}
                          </div>
                          
                          {/* Flèche de navigation */}
                          <div className="flex items-center justify-end mt-4 text-orange-600 font-medium group-hover:gap-2 transition-all duration-300">
                            <span>Voir l'album</span>
                            <ChevronRight className="w-5 h-5 transform group-hover:translate-x-1 transition-transform duration-300" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-20">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <ImageIcon className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="text-2xl font-serif font-bold text-gray-900 mb-4">
                  {searchQuery ? "Aucun album trouvé" : "Aucun album disponible"}
                </h3>
                <p className="text-gray-600 max-w-md mx-auto">
                  {searchQuery
                    ? "Essayez de modifier votre recherche."
                    : "Nos albums photos seront bientôt disponibles."}
                </p>
              </div>
            )}
          </div>
        </section>

        <Footer />
      </div>
    </div>
  );
}
