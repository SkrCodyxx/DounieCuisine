import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import Navigation from "@/components/Navigation";
import TopInfoBar from "@/components/TopInfoBar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  ChefHat, 
  Users, 
  Search, 
  ChevronDown,
  ChevronUp,
  MapPin,
  Phone,
  Mail,
  Calendar,
  CalendarCheck,
  FileText,
  Calculator,
  CheckCircle2,
  Clock,
  DollarSign,
  Edit3,
  Plus
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { formatPriceCAD } from "@/lib/cateringVariants";
import { useToast } from "@/hooks/use-toast";

interface CateringCategory {
  id: number;
  name_fr: string;
  name_en: string;
  description_fr?: string;
  description_en?: string;
  display_order: number;
  is_active: number;
  items?: CateringItem[];
}

interface CateringItem {
  id: number;
  category_id: number;
  name_fr: string;
  name_en: string;
  description_fr?: string;
  description_en?: string;
  image_id?: number;
  display_order: number;
  is_active: number;
  prices?: CateringPrice[];
}

interface CateringPrice {
  id: number;
  size_label_fr: string;
  size_label_en: string;
  price: number;
  is_default: number;
  display_order: number;
}

interface CateringMenuProps {
  embedded?: boolean;
}

export default function CateringMenu({ embedded = false }: CateringMenuProps) {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(new Set());
  const [showQuoteForm, setShowQuoteForm] = useState(true);
  const [showMobileQuoteModal, setShowMobileQuoteModal] = useState(false);
  const [showQuotePreview, setShowQuotePreview] = useState(false);
  const [showMenuBuilder, setShowMenuBuilder] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  
  // État du formulaire de devis
  const [quoteForm, setQuoteForm] = useState({
    eventType: "",
    guestCount: "",
    eventDate: "",
    eventTime: "",
    location: "",
    budget: "",
    name: "",
    email: "",
    phone: "",
    message: ""
  });
  
  // État du configurateur de menu
  const [selectedItems, setSelectedItems] = useState<{[key: number]: {item: CateringItem, quantity: number}}>({})

  // Configuration cache optimisé pour données peu changeantes
  const { data: cateringMenu = [], isLoading } = useQuery<CateringCategory[]>({
    queryKey: ["catering-menu-complete"],
    queryFn: () => apiRequest("GET", "/api/catering-menu"),
    staleTime: 60 * 60 * 1000, // 1 heure - menu traiteur change rarement
    gcTime: 2 * 60 * 60 * 1000, // 2 heures en cache
    refetchOnWindowFocus: false,
  });

  const menuData = useMemo(() => {
    if (!cateringMenu || !Array.isArray(cateringMenu)) {
      return { categories: [], filteredCategories: [], totalItems: 0 };
    }

    const categories = cateringMenu
      .filter((cat) => cat.is_active === 1)
      .map(cat => ({
        ...cat,
        items: (cat.items || [])
          .filter(item => item.is_active === 1)
          .sort((a, b) => a.name_fr.localeCompare(b.name_fr)) // Tri alphabétique des items
      }))
      .sort((a, b) => a.display_order - b.display_order);

    let filtered = categories;

    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase().trim();
      filtered = categories
        .map(cat => ({
          ...cat,
          items: cat.items
            .filter(item =>
              item.name_fr.toLowerCase().includes(search) ||
              (item.description_fr && item.description_fr.toLowerCase().includes(search)) ||
              cat.name_fr.toLowerCase().includes(search)
            )
            .sort((a, b) => a.name_fr.localeCompare(b.name_fr)) // Tri alphabétique après filtrage
        }))
        .filter(cat => cat.items.length > 0);
    }

    const totalItems = categories.reduce((sum, cat) => sum + cat.items.length, 0);

    return { categories, filteredCategories: filtered, totalItems };
  }, [cateringMenu, searchTerm]);

  const { categories, filteredCategories, totalItems } = menuData;

  const toggleCategory = (categoryId: number) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  };

  const expandAll = () => {
    setExpandedCategories(new Set(filteredCategories.map(cat => cat.id)));
  };

  const collapseAll = () => {
    setExpandedCategories(new Set());
  };

  const getItemImage = (item: CateringItem) => {
    if (item.image_id) {
      return `/api/media/${item.image_id}`;
    }
    return null;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-orange-100">
        <TopInfoBar />
        <Navigation />
        <div className="pt-[7.5rem] md:pt-[8.75rem] lg:pt-36 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-orange-500 border-t-transparent mx-auto mb-6"></div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">Chargement du menu traiteur</h2>
            <p className="text-gray-600">Préparation de nos délicieuses créations...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${embedded ? '' : 'bg-gradient-to-br from-orange-50 via-amber-50 to-orange-100 relative'}`}>
      {!embedded && (
        <>
          {/* Motifs décoratifs en arrière-plan */}
          <div className="fixed inset-0 pointer-events-none overflow-hidden">
            <div className="absolute top-20 right-10 w-72 h-72 bg-orange-200/20 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-20 left-10 w-96 h-96 bg-amber-200/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
            <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-orange-300/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
          </div>
          
          {/* Motifs géométriques subtils */}
          <div className="fixed inset-0 pointer-events-none opacity-[0.03]" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23f97316' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            backgroundSize: '60px 60px'
          }}></div>
        </>
      )}
      
      <div className={embedded ? '' : 'relative z-10'}>
        {!embedded && (
          <>
            <TopInfoBar />
            <Navigation />
          </>
        )}
      
        {!embedded && (
          /* Hero Section - connexion parfaite TopInfoBar > Navigation > Hero */
          <div className="pt-[7.5rem] md:pt-[8.75rem] lg:pt-36 pb-16 bg-gradient-to-r from-orange-600 via-amber-600 to-orange-700 relative overflow-hidden">
          <div className="absolute inset-0 bg-black/20"></div>
          
          {/* Motifs décoratifs dans le hero */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-orange-900/20 rounded-full blur-2xl" style={{animationDelay: '1.5s'}}></div>
            <div className="absolute top-1/2 left-1/4 w-64 h-64 bg-amber-400/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '0.5s'}}></div>
          </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full text-white/90 text-sm font-medium mb-6">
            <ChefHat className="w-4 h-4" />
            Service Traiteur Premium
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 tracking-tight">
            Menu Traiteur
            <span className="block text-3xl md:text-4xl font-light mt-2 text-amber-200">
              Dounie Cuisine
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-white/90 mb-8 max-w-3xl mx-auto leading-relaxed">
            Des saveurs authentiques d'Haïti pour sublimer vos événements spéciaux
          </p>
          
          <div className="flex flex-wrap justify-center gap-6 text-white/80">
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full">
              <Users className="w-5 h-5" />
              <span>Événements privés & corporatifs</span>
            </div>
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full">
              <Calendar className="w-5 h-5" />
              <span>Commande 48h à l'avance</span>
            </div>
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full">
              <MapPin className="w-5 h-5" />
              <span>Livraison disponible</span>
            </div>
          </div>
        </div>
      </div>
        )}

      <div className={`max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 ${embedded ? 'py-8 md:py-12 bg-gradient-to-b from-white via-orange-50/30 to-white' : 'py-8'}`}>

        {/* Modal Preview du Devis */}
        {showQuotePreview && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-2 sm:p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
                <h2 className="text-lg sm:text-2xl font-bold text-gray-900">Aperçu de votre devis</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowQuotePreview(false)}
                >
                  ✕
                </Button>
              </div>
              
              <div className="p-4 sm:p-6">
                {/* Informations du client */}
                {(quoteForm.name || quoteForm.email || quoteForm.phone) && (
                  <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-gray-50 rounded-lg">
                    <h3 className="font-bold text-gray-900 mb-2 sm:mb-3 text-sm sm:text-base">Informations de contact</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 text-xs sm:text-sm">
                      {quoteForm.name && (
                        <div>
                          <span className="font-medium text-gray-600">Nom:</span> {quoteForm.name}
                        </div>
                      )}
                      {quoteForm.email && (
                        <div>
                          <span className="font-medium text-gray-600">Email:</span> {quoteForm.email}
                        </div>
                      )}
                      {quoteForm.phone && (
                        <div>
                          <span className="font-medium text-gray-600">Téléphone:</span> {quoteForm.phone}
                        </div>
                      )}
                      {quoteForm.eventType && (
                        <div>
                          <span className="font-medium text-gray-600">Type d'événement:</span> {quoteForm.eventType}
                        </div>
                      )}
                      {quoteForm.guestCount && (
                        <div>
                          <span className="font-medium text-gray-600">Nombre d'invités:</span> {quoteForm.guestCount}
                        </div>
                      )}
                      {quoteForm.eventDate && (
                        <div>
                          <span className="font-medium text-gray-600">Date:</span> {new Date(quoteForm.eventDate).toLocaleDateString('fr-CA')}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Plats sélectionnés par catégorie */}
                <div className="mb-4 sm:mb-6">
                  <h3 className="font-bold text-gray-900 mb-3 sm:mb-4 text-base sm:text-xl">Plats sélectionnés</h3>
                  {(() => {
                    // Grouper les items par catégorie
                    const itemsByCategory: { [categoryId: number]: Array<{ item: CateringItem; quantity: number }> } = {};
                    
                    Object.values(selectedItems).forEach(({ item, quantity }) => {
                      if (!itemsByCategory[item.category_id]) {
                        itemsByCategory[item.category_id] = [];
                      }
                      itemsByCategory[item.category_id].push({ item, quantity });
                    });

                    // Trouver les noms de catégories
                    const getCategoryName = (categoryId: number) => {
                      const category = cateringMenu?.find(cat => cat.id === categoryId);
                      return category?.name_fr || "Autres";
                    };

                    return Object.entries(itemsByCategory).map(([categoryId, items]) => (
                      <div key={categoryId} className="mb-4 sm:mb-6">
                        <h4 className="font-semibold text-orange-600 mb-2 sm:mb-3 text-base sm:text-lg border-b pb-2">
                          {getCategoryName(Number(categoryId))}
                        </h4>
                        <div className="space-y-2">
                          {items.map(({ item, quantity }) => (
                            <div key={item.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-2 sm:p-3 bg-gray-50 rounded-lg gap-2">
                              <div className="flex-1">
                                <div className="font-medium text-gray-900 text-sm sm:text-base">{item.name_fr}</div>
                                {item.description_fr && (
                                  <div className="text-xs sm:text-sm text-gray-600 mt-1">{item.description_fr}</div>
                                )}
                              </div>
                              <div className="flex items-center gap-2 sm:gap-4 justify-end">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    const newQuantity = quantity - 1;
                                    if (newQuantity <= 0) {
                                      const newItems = { ...selectedItems };
                                      delete newItems[item.id];
                                      setSelectedItems(newItems);
                                      if (Object.keys(newItems).length === 0) {
                                        setShowQuotePreview(false);
                                      }
                                    } else {
                                      setSelectedItems({
                                        ...selectedItems,
                                        [item.id]: { item, quantity: newQuantity }
                                      });
                                    }
                                  }}
                                  className="h-7 w-7 sm:h-8 sm:w-8 p-0 text-sm"
                                >
                                  -
                                </Button>
                                <span className="font-semibold text-gray-900 min-w-[2.5ch] sm:min-w-[3ch] text-center text-sm sm:text-base">
                                  {quantity}
                                </span>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedItems({
                                      ...selectedItems,
                                      [item.id]: { item, quantity: quantity + 1 }
                                    });
                                  }}
                                  className="h-7 w-7 sm:h-8 sm:w-8 p-0 text-sm"
                                >
                                  +
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ));
                  })()}
                </div>

                {quoteForm.message && (
                  <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-gray-50 rounded-lg">
                    <h3 className="font-bold text-gray-900 mb-2 text-sm sm:text-base">Message supplémentaire</h3>
                    <p className="text-xs sm:text-sm text-gray-700 whitespace-pre-wrap">{quoteForm.message}</p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-4 border-t">
                  <Button
                    variant="outline"
                    className="flex-1 h-10 sm:h-11 text-sm sm:text-base"
                    onClick={() => setShowQuotePreview(false)}
                  >
                    Continuer mes achats
                  </Button>
                  <Button
                    className="flex-1 bg-orange-600 hover:bg-orange-700 h-10 sm:h-11 text-sm sm:text-base"
                    onClick={async () => {
                      if (!quoteForm.name || !quoteForm.email || !quoteForm.phone || !quoteForm.eventType || !quoteForm.guestCount) {
                        toast({
                          title: "Informations manquantes",
                          description: "Veuillez remplir tous les champs obligatoires du formulaire",
                          variant: "destructive"
                        });
                        setShowQuotePreview(false);
                        return;
                      }

                      try {
                        const selectedItemsArray = Object.values(selectedItems).map(item => ({
                          id: item.item.id,
                          name: item.item.name_fr,
                          quantity: item.quantity
                        }));

                        const response = await fetch("/api/catering-quotes", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            eventType: quoteForm.eventType,
                            guestCount: parseInt(quoteForm.guestCount),
                            eventDate: quoteForm.eventDate || null,
                            eventTime: quoteForm.eventTime || null,
                            location: quoteForm.location || null,
                            budgetRange: quoteForm.budget || null,
                            customerName: quoteForm.name,
                            customerEmail: quoteForm.email,
                            customerPhone: quoteForm.phone,
                            message: quoteForm.message || null,
                            selectedItems: selectedItemsArray.length > 0 ? selectedItemsArray : null,
                            estimatedPrice: null
                          })
                        });

                        if (!response.ok) {
                          throw new Error("Erreur lors de l'envoi");
                        }

                        toast({
                          title: "✅ Demande envoyée !",
                          description: "Nous vous contacterons sous 24h avec votre devis personnalisé"
                        });
                        
                        setShowQuotePreview(false);
                        setQuoteForm({
                          eventType: "", guestCount: "", eventDate: "", eventTime: "",
                          location: "", budget: "", name: "", email: "", phone: "", message: ""
                        });
                        setSelectedItems({});
                      } catch (error) {
                        console.error("Error submitting quote:", error);
                        toast({
                          title: "Erreur",
                          description: "Une erreur est survenue. Veuillez réessayer.",
                          variant: "destructive"
                        });
                      }
                    }}
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    Envoyer ma demande
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Layout en 2 colonnes */}
        <div className="grid grid-cols-1 lg:grid-cols-[400px,1fr] gap-4 lg:gap-8">
          
          {/* Colonne gauche : Formulaire sticky - masqué sur mobile, affiché sur desktop */}
          {showQuoteForm && (
          <div className="hidden lg:block order-2 lg:order-1 lg:sticky lg:top-24 h-fit">
            {/* Instructions compactes */}
            <div className="mb-4 bg-orange-50 border border-orange-200 p-4 rounded-lg">
              <h3 className="font-bold text-orange-900 mb-2 flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Créez votre devis
              </h3>
              <ol className="text-sm text-orange-800 space-y-1 list-decimal list-inside">
                <li>Remplissez vos informations</li>
                <li>Sélectionnez vos plats →</li>
                <li>Envoyez votre demande</li>
              </ol>
            </div>

            {/* Formulaire de Devis */}
            {showQuoteForm && (
          <Card id="quote-form" className="border-gray-200 shadow-lg">
            <CardHeader className="bg-white border-b pb-4">
              <CardTitle className="text-xl font-bold text-gray-900">
                Votre Événement
              </CardTitle>
              {Object.keys(selectedItems).length > 0 && (
                <Badge className="bg-orange-600 text-white px-3 py-1 mt-2">
                  {Object.keys(selectedItems).length} plat{Object.keys(selectedItems).length > 1 ? 's' : ''}
                </Badge>
              )}
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-3">
                  <div>
                    <Label htmlFor="eventType" className="text-sm font-medium">Type d'événement *</Label>
                    <Select value={quoteForm.eventType} onValueChange={(value) => setQuoteForm({...quoteForm, eventType: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionnez..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mariage">Mariage</SelectItem>
                        <SelectItem value="anniversaire">Anniversaire</SelectItem>
                        <SelectItem value="corporatif">Événement Corporatif</SelectItem>
                        <SelectItem value="bapteme">Baptême / Communion</SelectItem>
                        <SelectItem value="graduation">Graduation</SelectItem>
                        <SelectItem value="funeral">Funérailles</SelectItem>
                        <SelectItem value="baby-shower">Baby Shower</SelectItem>
                        <SelectItem value="other">Autre</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="guestCount" className="text-sm font-medium">Nombre d'invités *</Label>
                    <Input
                      id="guestCount"
                      type="number"
                      placeholder="Ex: 50"
                      value={quoteForm.guestCount}
                      onChange={(e) => setQuoteForm({...quoteForm, guestCount: e.target.value})}
                    />
                    {quoteForm.guestCount && parseInt(quoteForm.guestCount) > 0 && (
                      <p className="text-sm text-green-600 mt-1 flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" />
                        {parseInt(quoteForm.guestCount)} personne{parseInt(quoteForm.guestCount) > 1 ? 's' : ''}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="eventDate" className="text-sm font-medium">Date de l'événement</Label>
                      <Input
                        id="eventDate"
                        type="date"
                        value={quoteForm.eventDate}
                        onChange={(e) => setQuoteForm({...quoteForm, eventDate: e.target.value})}
                        min={new Date().toISOString().split('T')[0]}
                      />
                    </div>
                    <div>
                      <Label htmlFor="eventTime" className="text-sm font-medium">Heure</Label>
                      <Input
                        id="eventTime"
                        type="time"
                        value={quoteForm.eventTime}
                        onChange={(e) => setQuoteForm({...quoteForm, eventTime: e.target.value})}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="location" className="text-sm font-medium">Lieu de l'événement</Label>
                    <Input
                      id="location"
                      placeholder="Ex: Montréal, Laval..."
                      value={quoteForm.location}
                      onChange={(e) => setQuoteForm({...quoteForm, location: e.target.value})}
                    />
                  </div>

                  <div>
                    <Label htmlFor="budget" className="text-sm font-medium">Budget approximatif (CAD)</Label>
                    <Select value={quoteForm.budget} onValueChange={(value) => setQuoteForm({...quoteForm, budget: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionnez une fourchette..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="500-1000">500$ - 1,000$</SelectItem>
                        <SelectItem value="1000-2000">1,000$ - 2,000$</SelectItem>
                        <SelectItem value="2000-3000">2,000$ - 3,000$</SelectItem>
                        <SelectItem value="3000-5000">3,000$ - 5,000$</SelectItem>
                        <SelectItem value="5000+">5,000$+</SelectItem>
                        <SelectItem value="flexible">Flexible</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                  <div>
                    <Label htmlFor="name" className="text-sm font-medium">Votre nom *</Label>
                    <Input
                      id="name"
                      placeholder="Prénom et nom"
                      value={quoteForm.name}
                      onChange={(e) => setQuoteForm({...quoteForm, name: e.target.value})}
                      className="h-9"
                    />
                  </div>

                  <div>
                    <Label htmlFor="email" className="text-sm font-medium">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="votre@email.com"
                      value={quoteForm.email}
                      onChange={(e) => setQuoteForm({...quoteForm, email: e.target.value})}
                      className="h-9"
                    />
                  </div>

                  <div>
                    <Label htmlFor="phone" className="text-sm font-medium">Téléphone *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="(514) 123-4567"
                      value={quoteForm.phone}
                      onChange={(e) => setQuoteForm({...quoteForm, phone: e.target.value})}
                      className="h-9"
                    />
                  </div>

                  <div>
                    <Label htmlFor="message" className="text-sm font-medium">Détails supplémentaires</Label>
                    <Textarea
                      id="message"
                      placeholder="Préférences alimentaires, restrictions..."
                      rows={3}
                      value={quoteForm.message}
                      onChange={(e) => setQuoteForm({...quoteForm, message: e.target.value})}
                      className="text-sm"
                    />
                  </div>

              {/* Plats sélectionnés - Version compacte */}
              {Object.keys(selectedItems).length > 0 && (
                <div className="mt-4 pt-4 border-t">
                  <h4 className="font-semibold text-gray-900 mb-2 text-sm flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-orange-600" />
                    Plats sélectionnés ({Object.keys(selectedItems).length})
                  </h4>
                  <div className="space-y-1.5 max-h-[200px] overflow-y-auto">
                    {Object.values(selectedItems).map(({item, quantity}) => (
                      <div key={item.id} className="flex items-center justify-between bg-gray-50 p-2 rounded text-sm">
                        <span className="font-medium text-gray-800 text-xs truncate flex-1">{item.name_fr}</span>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0 hover:bg-gray-200"
                            onClick={() => {
                              const newItems = {...selectedItems};
                              if (newItems[item.id].quantity > 1) {
                                newItems[item.id].quantity--;
                              } else {
                                delete newItems[item.id];
                              }
                              setSelectedItems(newItems);
                            }}
                          >
                            -
                          </Button>
                          <span className="w-6 text-center font-medium text-gray-700 text-xs">{quantity}</span>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0 hover:bg-gray-200"
                            onClick={() => {
                              setSelectedItems({
                                ...selectedItems,
                                [item.id]: {item, quantity: quantity + 1}
                              });
                            }}
                          >
                            +
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {Object.keys(selectedItems).length > 0 && (
                <Button
                  variant="outline"
                  className="w-full border-orange-600 text-orange-600 hover:bg-orange-50 h-11 mt-4"
                  onClick={() => setShowQuotePreview(true)}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Voir mon devis ({Object.keys(selectedItems).length} plat{Object.keys(selectedItems).length > 1 ? 's' : ''})
                </Button>
              )}

              <Button 
                  className="w-full bg-orange-600 hover:bg-orange-700 h-11 mt-4"
                  onClick={async () => {
                    if (!quoteForm.name || !quoteForm.email || !quoteForm.phone || !quoteForm.eventType || !quoteForm.guestCount) {
                      toast({
                        title: "Champs requis manquants",
                        description: "Veuillez remplir tous les champs marqués d'un astérisque (*)",
                        variant: "destructive"
                      });
                      return;
                    }

                    try {
                      // Préparer les items sélectionnés
                      const selectedItemsArray = Object.values(selectedItems).map(item => ({
                        id: item.item.id,
                        name: item.item.name_fr,
                        quantity: item.quantity
                      }));

                      const response = await fetch("/api/catering-quotes", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          eventType: quoteForm.eventType,
                          guestCount: parseInt(quoteForm.guestCount),
                          eventDate: quoteForm.eventDate || null,
                          eventTime: quoteForm.eventTime || null,
                          location: quoteForm.location || null,
                          budgetRange: quoteForm.budget || null,
                          customerName: quoteForm.name,
                          customerEmail: quoteForm.email,
                          customerPhone: quoteForm.phone,
                          message: quoteForm.message || null,
                          selectedItems: selectedItemsArray.length > 0 ? selectedItemsArray : null,
                          estimatedPrice: null
                        })
                      });

                      if (!response.ok) {
                        throw new Error("Erreur lors de l'envoi");
                      }

                      toast({
                        title: "✅ Demande envoyée !",
                        description: "Nous vous contacterons sous 24h avec votre devis personnalisé"
                      });
                      
                      // Reset form
                      setShowQuoteForm(false);
                      setQuoteForm({
                        eventType: "", guestCount: "", eventDate: "", eventTime: "",
                        location: "", budget: "", name: "", email: "", phone: "", message: ""
                      });
                      setSelectedItems({});
                    } catch (error) {
                      console.error("Error submitting quote:", error);
                      toast({
                        title: "Erreur",
                        description: "Une erreur est survenue. Veuillez réessayer ou nous appeler directement.",
                        variant: "destructive"
                      });
                    }
                  }}
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Envoyer ma demande
                </Button>

              <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-800 flex items-start gap-2">
                  <Clock className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>
                    <strong>Délai de préparation:</strong> Minimum 48h pour petits événements, 7 jours pour 50+ personnes.
                    Pour les grandes occasions, nous recommandons 2-3 semaines de préavis.
                  </span>
                </p>
              </div>
            </CardContent>
          </Card>
        )}
          </div>
          )}

          {/* Colonne droite : Menu scrollable - en premier sur mobile */}
          <div className={`${showQuoteForm ? "order-1 lg:order-2 lg:min-h-screen" : "w-full"}`}>
          {/* Bouton d'action mobile pour ouvrir le modal */}
          <div className="lg:hidden mb-6">
            <div className="bg-gradient-to-r from-orange-500 to-amber-500 text-white p-4 rounded-lg shadow-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                    <ChefHat className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">Créez votre menu</h3>
                    <p className="text-sm opacity-90">
                      {Object.keys(selectedItems).length > 0 
                        ? `${Object.keys(selectedItems).length} plat${Object.keys(selectedItems).length > 1 ? 's' : ''} sélectionné${Object.keys(selectedItems).length > 1 ? 's' : ''}`
                        : "Sélectionnez des plats (optionnel) ou demandez un devis personnalisé"}
                    </p>
                  </div>
                </div>
                <Dialog open={showMobileQuoteModal} onOpenChange={setShowMobileQuoteModal}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="bg-white text-orange-600 hover:bg-white/90 shadow-lg">
                      <Edit3 className="w-4 h-4 mr-2" />
                      {Object.keys(selectedItems).length > 0 ? "Mon Devis" : "Demander Devis"}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <FileText className="w-5 h-5" />
                        Demande de Devis Traiteur
                      </DialogTitle>
                      <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg mt-2">
                        <p className="text-sm text-blue-800">
                          📝 <strong>Info:</strong> Vous pouvez demander un devis même sans sélectionner de plats. 
                          Notre équipe vous contactera pour discuter de vos besoins.
                        </p>
                      </div>
                    </DialogHeader>
                    
                    {/* Contenu du formulaire dans le modal */}
                    <div className="space-y-4 p-1">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="modal-eventType" className="text-sm font-medium">Type d'événement *</Label>
                          <Select value={quoteForm.eventType} onValueChange={(value) => setQuoteForm({...quoteForm, eventType: value})}>
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionnez..." />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="mariage">Mariage</SelectItem>
                              <SelectItem value="anniversaire">Anniversaire</SelectItem>
                              <SelectItem value="corporatif">Événement Corporatif</SelectItem>
                              <SelectItem value="bapteme">Baptême / Communion</SelectItem>
                              <SelectItem value="graduation">Graduation</SelectItem>
                              <SelectItem value="funeral">Funérailles</SelectItem>
                              <SelectItem value="baby-shower">Baby Shower</SelectItem>
                              <SelectItem value="other">Autre</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div>
                          <Label htmlFor="modal-guestCount" className="text-sm font-medium">Nombre d'invités *</Label>
                          <Input
                            id="modal-guestCount"
                            type="number"
                            placeholder="Ex: 50"
                            value={quoteForm.guestCount}
                            onChange={(e) => setQuoteForm({...quoteForm, guestCount: e.target.value})}
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label htmlFor="modal-eventDate" className="text-sm font-medium">Date</Label>
                          <Input
                            id="modal-eventDate"
                            type="date"
                            value={quoteForm.eventDate}
                            onChange={(e) => setQuoteForm({...quoteForm, eventDate: e.target.value})}
                            min={new Date().toISOString().split('T')[0]}
                          />
                        </div>
                        <div>
                          <Label htmlFor="modal-eventTime" className="text-sm font-medium">Heure</Label>
                          <Input
                            id="modal-eventTime"
                            type="time"
                            value={quoteForm.eventTime}
                            onChange={(e) => setQuoteForm({...quoteForm, eventTime: e.target.value})}
                          />
                        </div>
                      </div>
                      
                      <div>
                        <Label htmlFor="modal-location" className="text-sm font-medium">Lieu</Label>
                        <Input
                          id="modal-location"
                          placeholder="Ex: Montréal, Laval..."
                          value={quoteForm.location}
                          onChange={(e) => setQuoteForm({...quoteForm, location: e.target.value})}
                        />
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="modal-name" className="text-sm font-medium">Nom *</Label>
                          <Input
                            id="modal-name"
                            value={quoteForm.name}
                            onChange={(e) => setQuoteForm({...quoteForm, name: e.target.value})}
                            placeholder="Votre nom complet"
                          />
                        </div>
                        <div>
                          <Label htmlFor="modal-email" className="text-sm font-medium">Email *</Label>
                          <Input
                            id="modal-email"
                            type="email"
                            value={quoteForm.email}
                            onChange={(e) => setQuoteForm({...quoteForm, email: e.target.value})}
                            placeholder="votre@email.com"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <Label htmlFor="modal-phone" className="text-sm font-medium">Téléphone</Label>
                        <Input
                          id="modal-phone"
                          value={quoteForm.phone}
                          onChange={(e) => setQuoteForm({...quoteForm, phone: e.target.value})}
                          placeholder="(514) 123-4567"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="modal-message" className="text-sm font-medium">Détails</Label>
                        <Textarea
                          id="modal-message"
                          placeholder="Préférences alimentaires, restrictions..."
                          rows={3}
                          value={quoteForm.message}
                          onChange={(e) => setQuoteForm({...quoteForm, message: e.target.value})}
                        />
                      </div>
                      
                      {/* Plats sélectionnés dans le modal (optionnel) */}
                      {Object.keys(selectedItems).length > 0 ? (
                        <div className="border-t pt-4">
                          <h4 className="font-semibold text-gray-900 mb-3">Plats pré-sélectionnés ({Object.keys(selectedItems).length})</h4>
                          <div className="space-y-2 max-h-32 overflow-y-auto">
                            {Object.values(selectedItems).map(({item, quantity}) => (
                              <div key={item.id} className="flex items-center justify-between bg-gray-50 p-2 rounded text-sm">
                                <span className="font-medium text-gray-800 truncate flex-1">{item.name_fr}</span>
                                <span className="text-gray-600 ml-2">×{quantity}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="border-t pt-4">
                          <div className="bg-gray-50 p-3 rounded-lg text-center">
                            <p className="text-sm text-gray-600">
                              🐈‍⬛ Aucun plat sélectionné - Notre équipe vous proposera des options personnalisées
                            </p>
                          </div>
                        </div>
                      )}
                      
                      <Button 
                        className="w-full bg-orange-600 hover:bg-orange-700" 
                        size="lg"
                        onClick={() => {
                          // Logique d'envoi ici
                          setShowMobileQuoteModal(false);
                          toast({
                            title: "Devis envoyé !",
                            description: "Nous vous contacterons sous 24h",
                          });
                        }}
                      >
                        <Mail className="w-4 h-4 mr-2" />
                        Envoyer ma demande
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>

          {/* Header avec recherche */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-3xl md:text-2xl font-bold text-gray-900 mb-1">Notre Menu Traiteur</h2>
              <p className="text-sm text-gray-600">
                {totalItems} plats disponibles • Sélectionnez vos plats ci-dessous
                {searchTerm && (
                  <Badge variant="outline" className="bg-orange-50 border-orange-200 text-orange-700 ml-2">
                    Recherche: "{searchTerm}"
                  </Badge>
                )}
              </p>
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={expandAll}
                className="border-orange-300 text-orange-700 hover:bg-orange-50"
              >
                <ChevronDown className="w-4 h-4 mr-1" />
                Tout afficher
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={collapseAll}
                className="border-orange-300 text-orange-700 hover:bg-orange-50"
              >
                <ChevronUp className="w-4 h-4 mr-1" />
                Tout réduire
              </Button>
            </div>
          </div>

          {/* Barre de recherche */}
          <div className="relative max-w-2xl">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              placeholder="Rechercher un plat, une catégorie..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-11 h-12 border-orange-200 focus:border-orange-400 focus:ring-orange-400 text-base"
            />
          </div>
        </div>

        {/* Accordéon des catégories */}
        <div className="space-y-4">
          {filteredCategories.length === 0 ? (
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardContent className="p-12 text-center">
                <div className="text-gray-400 mb-4">
                  <Search className="w-16 h-16 mx-auto" />
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Aucun plat trouvé</h3>
                <p className="text-gray-600 mb-4">
                  Essayez de modifier votre recherche
                </p>
                <Button
                  onClick={() => setSearchTerm("")}
                  className="bg-orange-600 hover:bg-orange-700"
                >
                  Réinitialiser la recherche
                </Button>
              </CardContent>
            </Card>
          ) : (
            filteredCategories.map((category) => {
              const isExpanded = expandedCategories.has(category.id);
              const itemCount = category.items.length;

              return (
                <Card
                  key={category.id}
                  className="bg-white/98 backdrop-blur-xl border-2 border-orange-200/60 shadow-2xl overflow-hidden transition-all duration-300 hover:shadow-3xl hover:scale-[1.02] hover:border-orange-300/80 animate-fadeIn relative group rounded-2xl"
                  style={{
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(255,247,237,0.98) 100%)'
                  }}
                >
                  {/* Accent décoratif sur le côté */}
                  <div className="absolute left-0 top-0 bottom-0 w-2 bg-gradient-to-b from-orange-500 via-amber-500 to-orange-400 transform origin-top scale-y-0 group-hover:scale-y-100 transition-transform duration-500 shadow-lg"></div>
                  {/* En-tête de catégorie */}
                  <button
                    onClick={() => toggleCategory(category.id)}
                    className="w-full px-6 md:px-8 py-6 flex items-center justify-between text-left hover:bg-gradient-to-r hover:from-orange-50/80 hover:to-amber-50/80 transition-all duration-300 relative"
                  >
                    {/* Effet de brillance au survol */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 transform -skew-x-12"></div>
                    <div className="flex items-center gap-4 md:gap-6 relative z-10">
                      <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-gradient-to-br from-orange-500 via-amber-500 to-orange-400 flex items-center justify-center text-white font-bold text-xl md:text-2xl shadow-2xl transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent"></div>
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-gradient-to-br from-white/20 via-transparent to-transparent transition-opacity duration-300"></div>
                        <span className="relative z-10">{category.id}</span>
                      </div>
                      <div>
                        <h3 className="text-xl md:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-amber-600 mb-1">
                          {category.name_fr}
                        </h3>
                        <p className="text-sm md:text-base text-gray-600 font-medium">
                          {itemCount} plat{itemCount !== 1 ? 's' : ''} disponible{itemCount !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="secondary" className="bg-orange-100 text-orange-700 font-semibold">
                        {itemCount}
                      </Badge>
                      {isExpanded ? (
                        <ChevronUp className="w-6 h-6 text-orange-600" />
                      ) : (
                        <ChevronDown className="w-6 h-6 text-orange-600" />
                      )}
                    </div>
                  </button>

                  {/* Contenu de la catégorie */}
                  {isExpanded && (
                    <div className="border-t border-orange-100 bg-gradient-to-b from-orange-50/30 to-transparent animate-fadeIn">
                      <div className="p-6 relative">
                        {/* Motif décoratif subtil */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-orange-200/10 rounded-full blur-2xl"></div>
                        {/* Grille 2 colonnes pour réduire le scroll */}
                        <div className="grid md:grid-cols-2 gap-x-8 gap-y-2">
                          {category.items.map((item, itemIndex) => {
                            const itemImage = getItemImage(item);
                            const sortedPrices = item.prices
                              ? [...item.prices].sort((a, b) => a.display_order - b.display_order)
                              : [];
                            const hasMultiplePrices = sortedPrices.length > 1;
                            const defaultPrice = sortedPrices.find(p => p.is_default === 1) || sortedPrices[0];

                            return (
                            <div
                              key={item.id}
                              className="group hover:bg-gradient-to-r hover:from-orange-50/70 hover:to-amber-50/70 transition-all duration-300 py-4 px-3 rounded-lg border-b border-orange-100/50 last:border-0 relative overflow-hidden hover:shadow-md hover:scale-[1.02] cursor-pointer"
                            >
                              {/* Effet de brillance au survol */}
                              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 transform translate-x-[-100%] group-hover:translate-x-[100%]"></div>
                              {/* Style menu de restaurant classique */}
                              <div className="space-y-3">
                                {/* Ligne principale avec code, nom et prix */}
                                {sortedPrices.length === 0 ? (
                                  <div className="flex items-baseline gap-2">
                                    <Badge
                                      variant="outline"
                                      className="bg-orange-600 text-white border-0 font-mono text-xs px-2 py-0.5 flex-shrink-0"
                                    >
                                      #{item.id}
                                    </Badge>
                                    <span className="font-serif text-base font-semibold text-gray-800 flex-shrink-0">
                                      {item.name_fr}
                                    </span>
                                    <span className="flex-1 border-b border-dotted border-gray-300 mx-2 mb-1"></span>
                                    <span className="font-bold text-orange-600 flex-shrink-0 italic text-sm">
                                      Sur demande
                                    </span>
                                  </div>
                                ) : hasMultiplePrices ? (
                                  <>
                                    <div className="flex items-baseline gap-2">
                                      <Badge
                                        variant="outline"
                                        className="bg-orange-600 text-white border-0 font-mono text-xs px-2 py-0.5 flex-shrink-0"
                                      >
                                        #{item.id}
                                      </Badge>
                                      <span className="font-serif text-base font-semibold text-gray-800">
                                        {item.name_fr}
                                      </span>
                                    </div>
                                    <div className="pl-14 space-y-1.5">
                                      {sortedPrices.map(price => (
                                        <div key={price.id} className="flex items-baseline gap-2">
                                          <span className="text-sm text-gray-600 flex-shrink-0">
                                            {price.size_label_fr}
                                            {price.is_default === 1 && <span className="text-orange-600 ml-1">⭐</span>}
                                          </span>
                                          <span className="flex-1 border-b border-dotted border-gray-300 mx-2 mb-1"></span>
                                          <span className="font-bold text-orange-600 flex-shrink-0">
                                            {formatPriceCAD(price.price)}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  </>
                                ) : (
                                  <div className="flex items-baseline gap-2">
                                    <Badge
                                      variant="outline"
                                      className="bg-orange-600 text-white border-0 font-mono text-xs px-2 py-0.5 flex-shrink-0"
                                    >
                                      #{item.id}
                                    </Badge>
                                    <span className="font-serif text-base font-semibold text-gray-800 flex-shrink-0">
                                      {item.name_fr}
                                    </span>
                                    <span className="flex-1 border-b border-dotted border-gray-300 mx-2 mb-1"></span>
                                    <span className="font-bold text-orange-600 flex-shrink-0">
                                      {formatPriceCAD(defaultPrice.price)}
                                    </span>
                                  </div>
                                )}
                                
                                {/* Description */}
                                {item.description_fr && (
                                  <p className="text-gray-600 text-sm pl-14 italic leading-relaxed">
                                    {item.description_fr}
                                  </p>
                                )}

                                {/* Bouton Ajouter au devis */}
                                {showQuoteForm && (
                                  <div className="pl-14 mt-2">
                                    <Button
                                      size="sm"
                                      variant={selectedItems[item.id] ? "default" : "outline"}
                                      className={selectedItems[item.id] ? "bg-orange-600 hover:bg-orange-700" : "border-orange-300 text-orange-700 hover:bg-orange-50"}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (selectedItems[item.id]) {
                                          const newItems = {...selectedItems};
                                          delete newItems[item.id];
                                          setSelectedItems(newItems);
                                        } else {
                                          setSelectedItems({
                                            ...selectedItems,
                                            [item.id]: {item, quantity: 1}
                                          });
                                        }
                                      }}
                                    >
                                      {selectedItems[item.id] ? (
                                        <>
                                          <CheckCircle2 className="w-4 h-4 mr-1" />
                                          Ajouté ({selectedItems[item.id].quantity})
                                        </>
                                      ) : (
                                        <>
                                          + Ajouter au devis
                                        </>
                                      )}
                                    </Button>
                                  </div>
                                )}

                                {/* Image optionnelle (plus petite) */}
                                {itemImage && (
                                  <div className="pl-14">
                                    <img
                                      src={itemImage}
                                      alt={item.name_fr}
                                      className="w-32 h-24 object-cover rounded-lg shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                                      loading="lazy"
                                    />
                                  </div>
                                )}
                              </div>
                            </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </Card>
              );
            })
          )}
        </div>

        {/* Aide supplémentaire */}
        <Card className="mt-12 bg-gradient-to-br from-orange-600 to-amber-600 text-white border-0 shadow-2xl relative overflow-hidden animate-fadeIn">
          {/* Motifs décoratifs dans la carte d'aide */}
          <div className="absolute inset-0 overflow-hidden opacity-20">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-white rounded-full blur-3xl"></div>
            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-orange-900 rounded-full blur-3xl"></div>
          </div>
          <CardContent className="p-8 relative z-10">
            <div className="text-center max-w-3xl mx-auto">
              <h3 className="text-2xl font-bold mb-4">
                💡 Comment utiliser ce menu
              </h3>
              <div className="grid md:grid-cols-3 gap-6 text-left">
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 hover:bg-white/20 transition-all duration-300 hover:scale-105 hover:shadow-xl transform">
                  <div className="text-3xl mb-2 animate-bounce">👆</div>
                  <h4 className="font-semibold mb-2">Sélectionnez vos plats</h4>
                  <p className="text-sm text-orange-100">
                    Cliquez sur les plats qui vous intéressent pour les ajouter à votre sélection (optionnel)
                  </p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 hover:bg-white/20 transition-all duration-300 hover:scale-105 hover:shadow-xl transform" style={{animationDelay: '0.1s'}}>
                  <div className="text-3xl mb-2 animate-bounce" style={{animationDelay: '0.2s'}}>📝</div>
                  <h4 className="font-semibold mb-2">Demandez un devis</h4>
                  <p className="text-sm text-orange-100">
                    Utilisez le bouton orange pour ouvrir le formulaire et demander votre devis personnalisé
                  </p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 hover:bg-white/20 transition-all duration-300 hover:scale-105 hover:shadow-xl transform" style={{animationDelay: '0.2s'}}>
                  <div className="text-3xl mb-2 animate-bounce" style={{animationDelay: '0.4s'}}>✨</div>
                  <h4 className="font-semibold mb-2">Devis personnalisé</h4>
                  <p className="text-sm text-orange-100">
                    Vous pouvez demander un devis général même sans sélectionner de plats spécifiques
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      </div>

      {/* Footer CTA */}
      <div className="bg-gradient-to-r from-orange-600 via-amber-600 to-orange-700 text-white py-16 mt-16 relative overflow-hidden">
        {/* Motifs décoratifs dans le CTA */}
        <div className="absolute inset-0 overflow-hidden opacity-10">
          <div className="absolute top-0 left-1/4 w-64 h-64 bg-white rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-orange-900 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Prêt à régaler vos invités ?
            </h2>
            <p className="text-xl text-orange-100 mb-8">
              Contactez-nous dès maintenant pour planifier votre événement et recevoir un devis personnalisé
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/contact"
                className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold rounded-lg bg-white text-orange-600 hover:bg-orange-50 transition-colors shadow-lg"
              >
                <Phone className="w-6 h-6 mr-2" />
                Nous appeler maintenant
              </a>
              <a
                href="/contact"
                className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold rounded-lg border-2 border-white text-white hover:bg-white hover:text-orange-600 transition-colors"
              >
                <Mail className="w-6 h-6 mr-2" />
                Demander un devis
              </a>
            </div>
          </div>
        </div>
          </div>
        </div>
      </div>

      {!embedded && <Footer />}
      
      {/* Bouton flottant mobile pour ouvrir le formulaire */}
      <div className="lg:hidden fixed bottom-6 right-6 z-50">
        <Dialog open={showMobileQuoteModal} onOpenChange={setShowMobileQuoteModal}>
          <DialogTrigger asChild>
            <Button 
              size="lg" 
              className="rounded-full bg-orange-600 hover:bg-orange-700 shadow-2xl w-16 h-16 relative"
              title="Demander un devis"
            >
              <div className="relative">
                <Edit3 className="w-6 h-6" />
                {Object.keys(selectedItems).length > 0 && (
                  <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs bg-white text-orange-600 rounded-full">
                    {Object.keys(selectedItems).length}
                  </Badge>
                )}
              </div>
            </Button>
          </DialogTrigger>
        </Dialog>
      </div>
    </div>
  );
}
