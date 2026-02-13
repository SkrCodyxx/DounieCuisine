"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import PageLayout from "@/components/layout/page-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  ChefHat, Users, Search, ChevronDown, ChevronUp, MapPin,
  Calendar, Calculator, Plus, Minus, Clock,
} from "lucide-react";
import { formatPriceCAD, getUnifiedPriceDisplay } from "@/lib/catering-variants";
import { getImageUrl } from "@/lib/image-utils";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/query-client";

interface CateringPrice {
  id: number;
  sizeLabelFr: string;
  sizeLabelEn: string;
  price: number;
  isDefault: number;
  displayOrder: number;
}
interface CateringItem {
  id: number;
  categoryId: number;
  nameFr: string;
  nameEn: string;
  descriptionFr?: string;
  descriptionEn?: string;
  imageId?: number;
  displayOrder: number;
  isActive: number;
  prices?: CateringPrice[];
}
interface CateringCategory {
  id: number;
  nameFr: string;
  nameEn: string;
  descriptionFr?: string;
  descriptionEn?: string;
  displayOrder: number;
  isActive: number;
  items?: CateringItem[];
}

export default function CateringPage() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(new Set());
  const [selectedItems, setSelectedItems] = useState<Record<number, { item: CateringItem; quantity: number }>>({});
  const [quoteForm, setQuoteForm] = useState({
    eventType: "", guestCount: "", eventDate: "", eventTime: "",
    location: "", name: "", email: "", phone: "", message: "",
  });

  const { data: cateringMenu = [], isLoading } = useQuery<CateringCategory[]>({
    queryKey: ["catering-menu-complete"],
    queryFn: () => apiRequest("GET", "/api/catering-menu"),
    staleTime: 60 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const menuData = useMemo(() => {
    if (!cateringMenu || !Array.isArray(cateringMenu)) {
      return { categories: [], filteredCategories: [], totalItems: 0 };
    }
    const categories = cateringMenu
      .filter((cat) => cat.isActive === 1)
      .map((cat) => ({
        ...cat,
        items: (cat.items ?? [])
          .filter((item) => item.isActive === 1)
          .sort((a, b) => a.nameFr.localeCompare(b.nameFr)),
      }))
      .sort((a, b) => a.displayOrder - b.displayOrder);

    let filtered = categories;
    if (searchTerm.trim()) {
      const s = searchTerm.toLowerCase().trim();
      filtered = categories
        .map((cat) => ({
          ...cat,
          items: cat.items.filter(
            (item) =>
              item.nameFr.toLowerCase().includes(s) ||
              item.descriptionFr?.toLowerCase().includes(s) ||
              cat.nameFr.toLowerCase().includes(s)
          ),
        }))
        .filter((cat) => cat.items.length > 0);
    }
    return { categories, filteredCategories: filtered, totalItems: categories.reduce((sum, c) => sum + c.items.length, 0) };
  }, [cateringMenu, searchTerm]);

  const toggleCategory = (id: number) =>
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const expandAll = () => setExpandedCategories(new Set(menuData.filteredCategories.map((c) => c.id)));
  const collapseAll = () => setExpandedCategories(new Set());

  const addSelectedItem = (item: CateringItem) =>
    setSelectedItems((prev) => ({
      ...prev,
      [item.id]: { item, quantity: (prev[item.id]?.quantity ?? 0) + 1 },
    }));

  const removeSelectedItem = (itemId: number) =>
    setSelectedItems((prev) => {
      const next = { ...prev };
      if (next[itemId]?.quantity > 1) next[itemId] = { ...next[itemId], quantity: next[itemId].quantity - 1 };
      else delete next[itemId];
      return next;
    });

  const selectedCount = Object.values(selectedItems).reduce((s, i) => s + i.quantity, 0);

  const submitQuote = async () => {
    if (!quoteForm.name || !quoteForm.email || !quoteForm.phone || !quoteForm.eventType || !quoteForm.guestCount) {
      toast({ title: "Informations manquantes", description: "Veuillez remplir tous les champs obligatoires", variant: "destructive" });
      return;
    }
    try {
      await apiRequest("POST", "/api/catering-quotes", {
        ...quoteForm,
        guestCount: parseInt(quoteForm.guestCount),
        selectedItems: Object.values(selectedItems).map((si) => ({ id: si.item.id, name: si.item.nameFr, quantity: si.quantity })),
      });
      toast({ title: "Demande envoyee", description: "Nous vous contacterons sous 24h." });
      setSelectedItems({});
      setQuoteForm({ eventType: "", guestCount: "", eventDate: "", eventTime: "", location: "", name: "", email: "", phone: "", message: "" });
    } catch {
      toast({ title: "Erreur", description: "Impossible d'envoyer la demande. Veuillez reessayer.", variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <PageLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-orange-500 border-t-transparent mx-auto mb-6" />
            <h2 className="text-2xl font-semibold text-foreground mb-2">Chargement du menu traiteur</h2>
            <p className="text-muted-foreground">Preparation de nos delicieuses creations...</p>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      {/* Hero */}
      <div className="pb-16 bg-gradient-to-r from-orange-600 via-amber-600 to-orange-700 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center pt-16">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full text-white/90 text-sm font-medium mb-6">
            <ChefHat className="w-4 h-4" />
            Service Traiteur Premium
          </div>
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 tracking-tight">
            Menu Traiteur
            <span className="block text-3xl md:text-4xl font-light mt-2 text-amber-200">Dounie Cuisine</span>
          </h1>
          <p className="text-xl md:text-2xl text-white/90 mb-8 max-w-3xl mx-auto leading-relaxed">
            {"Des saveurs authentiques d'Haiti pour sublimer vos evenements speciaux"}
          </p>
          <div className="flex flex-wrap justify-center gap-6 text-white/80">
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full">
              <Users className="w-5 h-5" /><span>{"Evenements prives & corporatifs"}</span>
            </div>
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full">
              <Calendar className="w-5 h-5" /><span>{"Commande 48h a l'avance"}</span>
            </div>
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full">
              <MapPin className="w-5 h-5" /><span>Livraison disponible</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Menu */}
          <div className="flex-1">
            {/* Search & Controls */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Rechercher un plat..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={expandAll}>Tout ouvrir</Button>
                <Button variant="outline" size="sm" onClick={collapseAll}>Tout fermer</Button>
              </div>
            </div>

            <p className="text-sm text-muted-foreground mb-6">
              {menuData.filteredCategories.length} categories - {menuData.filteredCategories.reduce((s, c) => s + c.items.length, 0)} plats
            </p>

            {/* Categories */}
            <div className="space-y-4">
              {menuData.filteredCategories.map((cat) => (
                <Card key={cat.id} className="overflow-hidden">
                  <button
                    className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
                    onClick={() => toggleCategory(cat.id)}
                    aria-expanded={expandedCategories.has(cat.id)}
                  >
                    <div className="text-left">
                      <h3 className="text-lg font-semibold">{cat.nameFr}</h3>
                      {cat.descriptionFr && <p className="text-sm text-muted-foreground">{cat.descriptionFr}</p>}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">{cat.items.length} plats</span>
                      {expandedCategories.has(cat.id) ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </div>
                  </button>
                  {expandedCategories.has(cat.id) && (
                    <CardContent className="border-t pt-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {cat.items.map((item) => (
                          <div key={item.id} className="flex gap-4 p-3 rounded-lg border hover:border-orange-200 transition-colors">
                            {item.imageId && (
                              <img
                                src={getImageUrl(item.imageId)}
                                alt={item.nameFr}
                                className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
                                crossOrigin="anonymous"
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-sm">{item.nameFr}</h4>
                              {item.descriptionFr && <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{item.descriptionFr}</p>}
                              <div className="flex items-center justify-between mt-2">
                                <span className="text-sm font-semibold text-orange-600">
                                  {getUnifiedPriceDisplay(item.prices)}
                                </span>
                                <div className="flex items-center gap-1">
                                  {selectedItems[item.id] && (
                                    <>
                                      <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => removeSelectedItem(item.id)}>
                                        <Minus className="w-3 h-3" />
                                      </Button>
                                      <span className="text-sm font-semibold w-6 text-center">{selectedItems[item.id].quantity}</span>
                                    </>
                                  )}
                                  <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => addSelectedItem(item)}>
                                    <Plus className="w-3 h-3" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          </div>

          {/* Quote Form Sidebar */}
          <div className="lg:w-96 flex-shrink-0">
            <Card className="sticky top-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="w-5 h-5 text-orange-600" />
                  Demande de soumission
                </CardTitle>
                {selectedCount > 0 && (
                  <p className="text-sm text-orange-600">{selectedCount} plat(s) selectionne(s)</p>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="event-type">{"Type d'evenement *"}</Label>
                  <Select value={quoteForm.eventType} onValueChange={(v) => setQuoteForm((p) => ({ ...p, eventType: v }))}>
                    <SelectTrigger id="event-type"><SelectValue placeholder="Selectionnez..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mariage">Mariage</SelectItem>
                      <SelectItem value="corporatif">Corporatif</SelectItem>
                      <SelectItem value="anniversaire">Anniversaire</SelectItem>
                      <SelectItem value="bapteme">Bapteme</SelectItem>
                      <SelectItem value="funerailles">Funerailles</SelectItem>
                      <SelectItem value="autre">Autre</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="guest-count">{"Nombre d'invites *"}</Label>
                  <Input id="guest-count" type="number" min="1" value={quoteForm.guestCount} onChange={(e) => setQuoteForm((p) => ({ ...p, guestCount: e.target.value }))} />
                </div>
                <div>
                  <Label htmlFor="event-date">Date</Label>
                  <Input id="event-date" type="date" value={quoteForm.eventDate} onChange={(e) => setQuoteForm((p) => ({ ...p, eventDate: e.target.value }))} />
                </div>
                <div>
                  <Label htmlFor="location">Lieu</Label>
                  <Input id="location" value={quoteForm.location} onChange={(e) => setQuoteForm((p) => ({ ...p, location: e.target.value }))} />
                </div>
                <div>
                  <Label htmlFor="qname">Nom complet *</Label>
                  <Input id="qname" value={quoteForm.name} onChange={(e) => setQuoteForm((p) => ({ ...p, name: e.target.value }))} />
                </div>
                <div>
                  <Label htmlFor="qemail">Courriel *</Label>
                  <Input id="qemail" type="email" value={quoteForm.email} onChange={(e) => setQuoteForm((p) => ({ ...p, email: e.target.value }))} />
                </div>
                <div>
                  <Label htmlFor="qphone">Telephone *</Label>
                  <Input id="qphone" type="tel" value={quoteForm.phone} onChange={(e) => setQuoteForm((p) => ({ ...p, phone: e.target.value }))} />
                </div>
                <div>
                  <Label htmlFor="qmessage">Message</Label>
                  <Textarea id="qmessage" rows={3} value={quoteForm.message} onChange={(e) => setQuoteForm((p) => ({ ...p, message: e.target.value }))} />
                </div>
                <Button className="w-full bg-orange-600 hover:bg-orange-700 text-white" onClick={submitQuote}>
                  Envoyer la demande
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
