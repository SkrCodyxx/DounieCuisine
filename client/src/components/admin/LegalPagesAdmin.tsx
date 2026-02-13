import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { 
  FileText, 
  Trash2, 
  Eye, 
  EyeOff, 
  Plus,
  Edit3,
  ExternalLink,
  Copy
} from "lucide-react";
import type { LegalPage } from "@shared/schema";

export default function LegalPagesAdmin() {
  const { toast } = useToast();
  const [selectedPages, setSelectedPages] = useState<number[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingPage, setEditingPage] = useState<LegalPage | null>(null);
  const [previewPage, setPreviewPage] = useState<LegalPage | null>(null);
  
  const [newPage, setNewPage] = useState({
    title: "",
    slug: "",
    content: "",
    meta_description: "",
    active: true
  });

  // Récupérer les pages légales (admin - incluant inactives)
  const { data: pages = [], isLoading } = useQuery<LegalPage[]>({
    queryKey: ["/api/admin/legal-pages"],
    queryFn: () => apiRequest("GET", "/api/admin/legal-pages"),
  });

  // Create page mutation
  const createMutation = useMutation({
    mutationFn: async (data: typeof newPage) => {
      return apiRequest("POST", "/api/admin/legal-pages", data);
    },
    onSuccess: () => {
      toast({ title: "Page légale créée avec succès" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/legal-pages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/legal-pages"] });
      setIsCreateDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({ 
        title: "Erreur lors de la création", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  // Update page mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<LegalPage> }) => {
      return apiRequest("PUT", `/api/admin/legal-pages/${id}`, data);
    },
    onSuccess: () => {
      toast({ title: "Page mise à jour avec succès" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/legal-pages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/legal-pages"] });
      setEditingPage(null);
    },
    onError: (error: any) => {
      toast({ 
        title: "Erreur lors de la mise à jour", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  // Delete pages mutation
  const deleteMutation = useMutation({
    mutationFn: async (pageIds: number[]) => {
      return Promise.all(pageIds.map(id => 
        apiRequest("DELETE", `/api/admin/legal-pages/${id}`)
      ));
    },
    onSuccess: () => {
      toast({ title: "Pages supprimées avec succès" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/legal-pages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/legal-pages"] });
      setSelectedPages([]);
    },
    onError: (error: any) => {
      toast({ 
        title: "Erreur lors de la suppression", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  const resetForm = () => {
    setNewPage({
      title: "",
      slug: "",
      content: "",
      meta_description: "",
      active: true
    });
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  const handleTitleChange = (title: string, isNew: boolean = true) => {
    if (isNew) {
      setNewPage({ 
        ...newPage, 
        title, 
        slug: generateSlug(title) 
      });
    }
  };

  const handleCreate = () => {
    createMutation.mutate(newPage);
  };

  const handleUpdate = () => {
    if (!editingPage) return;

    updateMutation.mutate({
      id: editingPage.id,
      data: {
        title: editingPage.title,
        slug: editingPage.slug,
        content: editingPage.content,
        meta_description: editingPage.meta_description,
        active: editingPage.active
      }
    });
  };

  const handleDeleteSelected = () => {
    if (selectedPages.length === 0) return;
    deleteMutation.mutate(selectedPages);
  };

  const togglePageSelection = (pageId: number) => {
    setSelectedPages(prev => 
      prev.includes(pageId) 
        ? prev.filter(id => id !== pageId)
        : [...prev, pageId]
    );
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copié dans le presse-papier" });
  };

  const openPagePreview = (page: LegalPage) => {
    setPreviewPage(page);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Gestion des Pages Légales</h2>
          <p className="text-muted-foreground">
            {pages.length} page(s) • {selectedPages.length} sélectionnée(s)
          </p>
        </div>
        <div className="flex gap-2">
          {selectedPages.length > 0 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Supprimer ({selectedPages.length})
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
                  <AlertDialogDescription>
                    Êtes-vous sûr de vouloir supprimer {selectedPages.length} page(s) légale(s) ? 
                    Cette action est irréversible et peut affecter la conformité de votre site.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={handleDeleteSelected}
                    className="bg-destructive text-destructive-foreground"
                  >
                    Supprimer
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Nouvelle Page Légale
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Créer une Page Légale</DialogTitle>
                <DialogDescription>
                  Ajoutez une nouvelle page légale (conditions, confidentialité, etc.)
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Titre de la page</label>
                  <Input
                    value={newPage.title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    placeholder=""
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium">Slug (URL)</label>
                  <div className="flex items-center mt-1">
                    <span className="text-sm text-muted-foreground mr-2">/legal/</span>
                    <Input
                      value={newPage.slug}
                      onChange={(e) => setNewPage({ ...newPage, slug: e.target.value })}
                      placeholder=""
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Généré automatiquement à partir du titre
                  </p>
                </div>

                <div className="col-span-2">
                  <label className="text-sm font-medium">Meta Description</label>
                  <Textarea
                    value={newPage.meta_description}
                    onChange={(e) => setNewPage({ ...newPage, meta_description: e.target.value })}
                    placeholder=""
                    rows={2}
                    className="mt-1"
                  />
                </div>

                <div className="col-span-2">
                  <label className="text-sm font-medium">Contenu (HTML/Markdown)</label>
                  <Textarea
                    value={newPage.content}
                    onChange={(e) => setNewPage({ ...newPage, content: e.target.value })}
                    placeholder=""
                    rows={12}
                    className="mt-1 font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Vous pouvez utiliser du HTML ou du Markdown
                  </p>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Annuler
                </Button>
                <Button 
                  onClick={handleCreate}
                  disabled={!newPage.title || !newPage.content || createMutation.isPending}
                >
                  {createMutation.isPending ? "Création..." : "Créer"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Pages Grid */}
      <div className="grid gap-4">
        {pages.map((page) => (
          <Card key={page.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4">
                  <input
                    type="checkbox"
                    checked={selectedPages.includes(page.id)}
                    onChange={() => togglePageSelection(page.id)}
                    className="mt-1"
                  />
                  
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-lg">{page.title}</h3>
                      <Badge variant={page.active ? "default" : "secondary"}>
                        {page.active ? "Publié" : "Brouillon"}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                      <span>URL: /legal/{page.slug}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-4 p-0"
                        onClick={() => copyToClipboard(`${window.location.origin}/legal/${page.slug}`)}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                    
                    {page.meta_description && (
                      <p className="text-sm text-muted-foreground mb-2">
                        {page.meta_description}
                      </p>
                    )}

                    <div className="text-xs text-muted-foreground">
                      Dernière modification: {new Date(page.updatedAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Preview button */}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openPagePreview(page)}
                    disabled={!page.active}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>

                  {/* Toggle active */}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => updateMutation.mutate({
                      id: page.id,
                      data: { active: page.active ? 0 : 1 }
                    })}
                  >
                    {page.active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>

                  {/* Edit button */}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setEditingPage(page)}
                  >
                    <Edit3 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {pages.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Aucune page légale</h3>
            <p className="text-muted-foreground">
              Créez vos premières pages légales (conditions d'utilisation, politique de confidentialité...)
            </p>
          </CardContent>
        </Card>
      )}

      {/* Edit Dialog */}
      {editingPage && (
        <Dialog open={!!editingPage} onOpenChange={() => setEditingPage(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Modifier la Page Légale</DialogTitle>
              <DialogDescription>
                Modifiez le contenu de la page légale
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Titre</label>
                <Input
                  value={editingPage.title}
                  onChange={(e) => setEditingPage({ ...editingPage, title: e.target.value })}
                  className="mt-1"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">Slug (URL)</label>
                <div className="flex items-center mt-1">
                  <span className="text-sm text-muted-foreground mr-2">/legal/</span>
                  <Input
                    value={editingPage.slug}
                    onChange={(e) => setEditingPage({ ...editingPage, slug: e.target.value })}
                  />
                </div>
              </div>

              <div className="col-span-2">
                <label className="text-sm font-medium">Meta Description</label>
                <Textarea
                  value={editingPage.meta_description || ""}
                  onChange={(e) => setEditingPage({ ...editingPage, meta_description: e.target.value })}
                  rows={2}
                  className="mt-1"
                />
              </div>

              <div className="col-span-2">
                <label className="text-sm font-medium">Contenu</label>
                <Textarea
                  value={editingPage.content}
                  onChange={(e) => setEditingPage({ ...editingPage, content: e.target.value })}
                  rows={15}
                  className="mt-1 font-mono text-sm"
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingPage(null)}>
                Annuler
              </Button>
              <Button 
                onClick={handleUpdate}
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending ? "Mise à jour..." : "Mettre à jour"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Preview Dialog */}
      {previewPage && (
        <Dialog open={!!previewPage} onOpenChange={() => setPreviewPage(null)}>
          <DialogContent className="max-w-5xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Aperçu - {previewPage.title}</DialogTitle>
              <DialogDescription>
                Visualisation de la page légale telle qu'affichée publiquement
              </DialogDescription>
            </DialogHeader>
            <div className="prose max-w-none">
              <div dangerouslySetInnerHTML={{ __html: previewPage.content }} />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setPreviewPage(null)}>Fermer</Button>
              <Button
                onClick={() => {
                  copyToClipboard(`${window.location.origin}/legal/${previewPage.slug}`);
                }}
                variant="secondary"
              >
                Copier URL publique
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}