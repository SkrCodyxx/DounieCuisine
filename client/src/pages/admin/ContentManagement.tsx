import { useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Camera, PlayCircle, HardDrive, FolderOpen } from "lucide-react";
import GalleryAdmin from "@/components/admin/GalleryAdmin";
import MediaManagement from "@/components/admin/MediaManagement";
import HeroSlidesAdmin from "@/components/admin/HeroSlidesAdmin";
import GalleryAlbumsAdmin from "@/pages/admin/GalleryAlbumsAdmin";

export default function ContentManagement() {
  const [activeTab, setActiveTab] = useState("albums");

  return (
    <AdminLayout>
      <div className="container mx-auto py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Gestion du Contenu</h1>
            <p className="text-muted-foreground">
              Gérez votre galerie, médias et diaporamas depuis une interface unifiée
            </p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="albums" className="flex items-center gap-2">
              <FolderOpen className="h-4 w-4" />
              Albums
            </TabsTrigger>
            <TabsTrigger value="gallery" className="flex items-center gap-2">
              <Camera className="h-4 w-4" />
              Galerie
            </TabsTrigger>
            <TabsTrigger value="media" className="flex items-center gap-2">
              <HardDrive className="h-4 w-4" />
              Médias
            </TabsTrigger>
            <TabsTrigger value="slides" className="flex items-center gap-2">
              <PlayCircle className="h-4 w-4" />
              Diaporama
            </TabsTrigger>
          </TabsList>

          <TabsContent value="albums" className="space-y-4">
            <GalleryAlbumsAdmin />
          </TabsContent>

          <TabsContent value="gallery" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Camera className="h-5 w-5" />
                  Galerie Photos
                </CardTitle>
                <CardDescription>
                  Gérez les photos de vos plats, restaurants et événements
                </CardDescription>
              </CardHeader>
              <CardContent>
                <GalleryAdmin />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="media" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HardDrive className="h-5 w-5" />
                  Gestion des Médias
                </CardTitle>
                <CardDescription>
                  Optimisez l'espace de stockage et gérez les fichiers médias
                </CardDescription>
              </CardHeader>
              <CardContent>
                <MediaManagement />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="slides" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PlayCircle className="h-5 w-5" />
                  Diaporama Page d'Accueil
                </CardTitle>
                <CardDescription>
                  Gérez les images et vidéos du carrousel de la page d'accueil
                </CardDescription>
              </CardHeader>
              <CardContent>
                <HeroSlidesAdmin />
              </CardContent>
            </Card>
          </TabsContent>


        </Tabs>
      </div>
    </AdminLayout>
  );
}