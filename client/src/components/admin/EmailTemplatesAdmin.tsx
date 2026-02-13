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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Mail, 
  Trash2, 
  Eye, 
  EyeOff, 
  Plus,
  Edit3,
  Send,
  Copy,
  FlaskConical
} from "lucide-react";

// Type local pour EmailTemplate
interface EmailTemplate {
  id: number;
  name: string;
  displayName: string;
  subject: string;
  htmlContent: string;
  textContent?: string;
  variables?: Record<string, string> | null;
  description?: string | null;
  category: string;
  isActive: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export default function EmailTemplatesAdmin() {
  const { toast } = useToast();
  const [selectedTemplates, setSelectedTemplates] = useState<number[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<EmailTemplate | null>(null);
  const [previewData, setPreviewData] = useState<any>({});
  const [previewHtml, setPreviewHtml] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  
  const [newTemplate, setNewTemplate] = useState({
    name: "",
    displayName: "",
    category: "order",
    subject: "",
    htmlContent: "",
    description: "",
    variables: "",
    isActive: true
  });
  const [testSendTemplate, setTestSendTemplate] = useState<EmailTemplate | null>(null);
  const [testEmail, setTestEmail] = useState("");
  const [testVariablesJson, setTestVariablesJson] = useState("{\n  \"customerName\": \"Test\"\n}");

  // Récupérer les templates
  const { data: templates = [], isLoading, refetch } = useQuery<EmailTemplate[]>({
    queryKey: ["/api/admin/email-templates"],
    queryFn: () => apiRequest("GET", "/api/admin/email-templates"),
  });

  // Filtrer par catégorie
  const filteredTemplates = activeCategory === "all" 
    ? templates 
    : templates.filter(t => t.category === activeCategory);

  // Catégories disponibles
  const categories = ["all", ...Array.from(new Set(templates.map(t => t.category)))];

  // Create template mutation
  const createMutation = useMutation({
    mutationFn: async (data: typeof newTemplate) => {
      const payload = {
        name: data.name.trim(),
        displayName: (data.displayName || data.name).trim(),
        category: data.category,
        subject: data.subject,
        htmlContent: data.htmlContent,
        description: data.description || null,
        variables: data.variables ? data.variables.split(',').map(v => v.trim()).filter(Boolean) : [],
        isActive: data.isActive,
      };
      return apiRequest("POST", "/api/admin/email-templates", payload);
    },
    onSuccess: () => {
      toast({ title: "Template créé avec succès" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/email-templates"] });
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

  // Update template mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<EmailTemplate> }) => {
      return apiRequest("PUT", `/api/admin/email-templates/${id}`, data);
    },
    onSuccess: () => {
      toast({ title: "Template mis à jour avec succès" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/email-templates"] });
      setEditingTemplate(null);
    },
    onError: (error: any) => {
      toast({ 
        title: "Erreur lors de la mise à jour", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  const testSendMutation = useMutation({
    mutationFn: async ({ templateName, to, variables }: { templateName: string; to: string; variables: any }) => {
      return apiRequest("POST", "/api/admin/email-templates/send-test", { templateName, to, variables });
    },
    onSuccess: (resp) => {
      toast({ title: resp?.message || "Email test envoyé" });
      setTestSendTemplate(null);
    },
    onError: (error: any) => {
      toast({ title: "Erreur envoi test", description: error.message, variant: "destructive" });
    }
  });

  // Toggle active mutation
  const toggleMutation = useMutation({
    mutationFn: async ({ id, active }: { id: number; active: boolean }) => {
      return apiRequest("PATCH", `/api/admin/email-templates/${id}/toggle`, { active });
    },
    onSuccess: () => {
      toast({ title: "Statut mis à jour" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/email-templates"] });
    },
    onError: (error: any) => {
      toast({ 
        title: "Erreur", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  // Delete templates mutation
  const deleteMutation = useMutation({
    mutationFn: async (templateIds: number[]) => {
      return Promise.all(templateIds.map(id => 
        apiRequest("DELETE", `/api/admin/email-templates/${id}`)
      ));
    },
    onSuccess: () => {
      toast({ title: "Templates supprimés avec succès" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/email-templates"] });
      setSelectedTemplates([]);
    },
    onError: (error: any) => {
      toast({ 
        title: "Erreur lors de la suppression", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  // Preview mutation
  const previewMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      return apiRequest("POST", `/api/admin/email-templates/${id}/preview`, { previewData: data });
    },
    onSuccess: (resp) => {
      if (resp && resp.htmlContent) {
        setPreviewHtml(resp.htmlContent);
      } else if (typeof resp === 'string') {
        setPreviewHtml(resp);
      } else {
        setPreviewHtml('Aucun contenu disponible');
      }
    },
    onError: (error: any) => {
      toast({ 
        title: "Erreur génération aperçu", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  const resetForm = () => {
    setNewTemplate({
      name: "",
      displayName: "",
      category: "order",
      subject: "",
      htmlContent: "",
      description: "",
      variables: "",
      isActive: true
    });
  };

  const handleCreate = () => {
    createMutation.mutate(newTemplate);
  };

  const handleUpdate = () => {
    if (!editingTemplate) return;
    const varsField = (editingTemplate as any).variablesInput as string | undefined;
    const variablesArr = varsField ? varsField.split(',').map((v: string) => v.trim()).filter(Boolean) : [];
    // Convert array to Record if needed
    const variablesObj: Record<string, string> = {};
    if (Array.isArray(variablesArr)) {
      variablesArr.forEach((v: string) => { variablesObj[v] = v; });
    } else if (editingTemplate.variables) {
      Object.assign(variablesObj, editingTemplate.variables);
    }
    updateMutation.mutate({
      id: editingTemplate.id,
      data: {
        displayName: editingTemplate.displayName,
        subject: editingTemplate.subject,
        htmlContent: editingTemplate.htmlContent,
        description: editingTemplate.description,
        isActive: editingTemplate.isActive,
        category: editingTemplate.category,
        variables: Object.keys(variablesObj).length > 0 ? variablesObj : null
      }
    });
  };

  const handleDeleteSelected = () => {
    if (selectedTemplates.length === 0) return;
    deleteMutation.mutate(selectedTemplates);
  };

  const toggleTemplateSelection = (templateId: number) => {
    setSelectedTemplates(prev => 
      prev.includes(templateId) 
        ? prev.filter(id => id !== templateId)
        : [...prev, templateId]
    );
  };

  const handlePreview = (template: EmailTemplate) => {
    setPreviewTemplate(template);
    previewMutation.mutate({ 
      id: template.id, 
      data: previewData 
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copié dans le presse-papier" });
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
          <h2 className="text-2xl font-bold">Gestion des Templates Email</h2>
          <p className="text-muted-foreground">
            {filteredTemplates.length} template(s) • {selectedTemplates.length} sélectionné(s)
          </p>
        </div>
        <div className="flex gap-2">
          {selectedTemplates.length > 0 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Supprimer ({selectedTemplates.length})
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
                  <AlertDialogDescription>
                    Êtes-vous sûr de vouloir supprimer {selectedTemplates.length} template(s) ? 
                    Cette action est irréversible.
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
                Nouveau Template
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Créer un Template Email</DialogTitle>
                <DialogDescription>
                  Ajoutez un nouveau template d'email automatique
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Nom du template</label>
                  <Input
                    value={newTemplate.name}
                    onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                    placeholder=""
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium">Catégorie</label>
                  <select
                    value={newTemplate.category}
                    onChange={(e) => setNewTemplate({ ...newTemplate, category: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border rounded"
                  >
                    <option value="order">Commandes</option>
                    <option value="customer">Clients</option>
                    <option value="notification">Notifications</option>
                    <option value="marketing">Marketing</option>
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="text-sm font-medium">Sujet de l'email</label>
                  <Input
                    value={newTemplate.subject}
                    onChange={(e) => setNewTemplate({ ...newTemplate, subject: e.target.value })}
                    placeholder=""
                    className="mt-1"
                  />
                </div>

                <div className="col-span-2">
                  <label className="text-sm font-medium">Description</label>
                  <Input
                    value={newTemplate.description}
                    onChange={(e) => setNewTemplate({ ...newTemplate, description: e.target.value })}
                    placeholder=""
                    className="mt-1"
                  />
                </div>

                <div className="col-span-2">
                  <label className="text-sm font-medium">Contenu HTML</label>
                  <Textarea
                    value={newTemplate.htmlContent}
                    onChange={(e) => setNewTemplate({ ...newTemplate, htmlContent: e.target.value })}
                    placeholder=""
                    rows={8}
                    className="mt-1 font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Utilisez des variables comme &#123;&#123;customerName&#125;&#125;, &#123;&#123;orderNumber&#125;&#125;, &#123;&#123;totalAmount&#125;&#125;
                  </p>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Annuler
                </Button>
                <Button 
                  onClick={handleCreate}
                  disabled={!newTemplate.name || !newTemplate.subject || createMutation.isPending}
                >
                  {createMutation.isPending ? "Création..." : "Créer"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Mail className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Catégorie:</span>
          <select
            value={activeCategory}
            onChange={(e) => setActiveCategory(e.target.value)}
            className="px-3 py-1 border rounded text-sm"
          >
            {categories.map(category => (
              <option key={category} value={category}>
                {category === "all" ? "Toutes" : category}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid gap-4">
        {filteredTemplates.map((template) => (
          <Card key={template.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4">
                  <input
                    type="checkbox"
                    checked={selectedTemplates.includes(template.id)}
                    onChange={() => toggleTemplateSelection(template.id)}
                    className="mt-1"
                  />
                  
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-lg">{template.displayName || template.name}</h3>
                      <Badge variant={template.isActive ? "default" : "secondary"}>
                        {template.isActive ? "Actif" : "Inactif"}
                      </Badge>
                      <Badge variant="outline">
                        {template.category}
                      </Badge>
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-2">
                      Sujet: {template.subject}
                    </p>
                    
                    {template.description && (
                      <p className="text-sm text-muted-foreground mb-2">
                        {template.description}
                      </p>
                    )}

                    <div className="text-xs text-muted-foreground">
                      Créé le {new Date(template.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Preview */}
                  <Button size="sm" variant="outline" onClick={() => handlePreview(template)}>
                    <Eye className="h-4 w-4" />
                  </Button>
                  {/* Test send */}
                  <Button size="sm" variant="outline" onClick={() => setTestSendTemplate(template)} title="Email test">
                    <FlaskConical className="h-4 w-4" />
                  </Button>

                  {/* Toggle active */}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => toggleMutation.mutate({
                      id: template.id,
                      active: !template.isActive
                    })}
                  >
                    {template.isActive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>

                  {/* Edit button */}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setEditingTemplate(template)}
                  >
                    <Edit3 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Mail className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Aucun template</h3>
            <p className="text-muted-foreground">
              {activeCategory === "all" 
                ? "Créez votre premier template email"
                : `Aucun template dans la catégorie "${activeCategory}"`
              }
            </p>
          </CardContent>
        </Card>
      )}

      {/* Edit Dialog */}
      {editingTemplate && (
        <Dialog open={!!editingTemplate} onOpenChange={() => setEditingTemplate(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Modifier le Template</DialogTitle>
              <DialogDescription>
                Modifiez le contenu du template email
              </DialogDescription>
            </DialogHeader>
            
              <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Nom</label>
                <Input
                  value={editingTemplate.name}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, name: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Nom affiché</label>
                <Input
                  value={editingTemplate.displayName || ""}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, displayName: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Sujet</label>
                <Input
                  value={editingTemplate.subject}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, subject: e.target.value })}
                  className="mt-1"
                />
              </div>

              <div className="col-span-2">
                <label className="text-sm font-medium">Description</label>
                <Input
                  value={editingTemplate.description || ""}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, description: e.target.value })}
                  className="mt-1"
                />
              </div>

              <div className="col-span-2">
                <label className="text-sm font-medium">Variables (séparées par des virgules)</label>
                <Input
                  value={(editingTemplate as any).variablesInput !== undefined ? (editingTemplate as any).variablesInput : (Array.isArray(editingTemplate.variables) ? editingTemplate.variables : []).join(', ')}
                  onChange={(e) => setEditingTemplate({ ...(editingTemplate as any), variablesInput: e.target.value })}
                  className="mt-1"
                />
              </div>

              <div className="col-span-2">
                <label className="text-sm font-medium">Contenu HTML</label>
                <Textarea
                  value={editingTemplate.htmlContent}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, htmlContent: e.target.value })}
                  rows={10}
                  className="mt-1 font-mono text-sm"
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingTemplate(null)}>
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
      {previewTemplate && (
        <Dialog open={!!previewTemplate} onOpenChange={() => setPreviewTemplate(null)}>
          <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Aperçu - {previewTemplate.name}</DialogTitle>
              <DialogDescription>
                Aperçu du template avec des données d'exemple
              </DialogDescription>
            </DialogHeader>
            
            <Tabs defaultValue="preview" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="preview">Aperçu</TabsTrigger>
                <TabsTrigger value="html">Code HTML</TabsTrigger>
                <TabsTrigger value="vars">Variables</TabsTrigger>
              </TabsList>
                    {/* Test Send Dialog */}
                    {testSendTemplate && (
                      <Dialog open={!!testSendTemplate} onOpenChange={() => setTestSendTemplate(null)}>
                        <DialogContent className="max-w-3xl">
                          <DialogHeader>
                            <DialogTitle>Test Email - {testSendTemplate.displayName || testSendTemplate.name}</DialogTitle>
                            <DialogDescription>Envoyer un email de test pour vérifier le rendu.</DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <label className="text-sm font-medium">Adresse de destination</label>
                              <Input value={testEmail} onChange={(e) => setTestEmail(e.target.value)} placeholder="" className="mt-1" />
                            </div>
                            <div>
                              <label className="text-sm font-medium">Variables JSON</label>
                              <Textarea value={testVariablesJson} onChange={(e) => setTestVariablesJson(e.target.value)} rows={8} className="mt-1 font-mono text-xs" />
                              <p className="text-xs text-muted-foreground mt-1">Exemple: {`{"customerName":"Jean","orderNumber":"CMD123"}`}</p>
                            </div>
                          </div>
                          <DialogFooter>
                            <Button variant="outline" onClick={() => setTestSendTemplate(null)}>Annuler</Button>
                            <Button
                              onClick={() => {
                                try {
                                  const parsed = JSON.parse(testVariablesJson || '{}');
                                  testSendMutation.mutate({ templateName: testSendTemplate.name, to: testEmail, variables: parsed });
                                } catch (err: any) {
                                  toast({ title: 'JSON invalide', description: err.message, variant: 'destructive' });
                                }
                              }}
                              disabled={!testEmail || testSendMutation.isPending}
                            >
                              {testSendMutation.isPending ? 'Envoi...' : 'Envoyer test'}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    )}
              
              <TabsContent value="preview" className="space-y-4">
                {previewHtml ? (
                  <div className="border rounded-lg p-4">
                    <div 
                      dangerouslySetInnerHTML={{ __html: previewHtml }}
                      className="prose max-w-none"
                    />
                  </div>
                ) : (
                  <p className="text-muted-foreground">Génération de l'aperçu...</p>
                )}
              </TabsContent>
              
              <TabsContent value="html" className="space-y-4">
                <div className="flex justify-end">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(previewHtml)}
                    disabled={!previewHtml}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copier HTML
                  </Button>
                </div>
                <pre className="bg-muted p-4 rounded-lg overflow-auto text-sm">
                  <code>{previewHtml}</code>
                </pre>
              </TabsContent>
              <TabsContent value="vars" className="space-y-4">
                <h4 className="font-semibold">Variables disponibles</h4>
                {previewTemplate?.variables && Array.isArray(previewTemplate.variables) ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {previewTemplate.variables.map((v: string) => (
                      <Button
                        key={v}
                        variant="outline"
                        size="sm"
                        className="justify-start"
                        onClick={() => copyToClipboard(`{{${v}}}`)}
                      >
                        {v}
                      </Button>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">Aucune liste de variables définie.</p>
                )}
              </TabsContent>
            </Tabs>

            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setPreviewTemplate(null)}
              >
                Fermer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}