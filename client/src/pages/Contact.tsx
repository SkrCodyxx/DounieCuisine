import React, { useState, useEffect } from "react";
import { Phone, Mail, MapPin, Clock, Send, Star, Award, Users, CheckCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import Navigation from "@/components/Navigation";
import TopInfoBar from "@/components/TopInfoBar";
import Footer from "@/components/Footer";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useSiteInfo } from "@/hooks/useSiteInfo"; // Hook centralisé
import type { SiteInfo as SiteInfoType } from "@shared/schema";

interface ContactMessage {
  name: string;
  email: string;
  phone?: string;
  subject?: string;
  message: string;
}

interface TestimonialForm {
  customerName: string;
  email: string;
  rating: number;
  comment: string;
}

export default function Contact() {
  const { toast } = useToast();
  const [formData, setFormData] = useState<ContactMessage>({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });
  const [testimonialForm, setTestimonialForm] = useState<TestimonialForm>({
    customerName: "",
    email: "",
    rating: 5,
    comment: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // Utiliser hook centralisé avec cache optimisé
  const { data: siteInfo } = useSiteInfo();

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleTestimonialChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setTestimonialForm((prev) => ({ ...prev, [name]: value }));
  };

  // Map address for iframe
  const mapAddress = siteInfo?.address 
    ? `${siteInfo.address}, ${siteInfo.city}, ${siteInfo.province || 'QC'} ${siteInfo.postalCode}`
    : '3954 Boul. Leman, Laval, QC H7E 1A1';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setFormData({
          name: "",
          email: "",
          phone: "",
          subject: "",
          message: "",
        });
        toast({
          title: "✓ Message envoyé avec succès !",
          description: "Notre équipe vous répondra dans les plus brefs délais.",
        });
      } else {
        toast({
          title: "Erreur",
          description: "Une erreur s'est produite. Veuillez réessayer.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur s'est produite. Veuillez réessayer.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTestimonialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingReview(true);

    try {
      // Adapter les données au format attendu par l'API
      const testimonialData = {
        clientName: testimonialForm.customerName,
        rating: testimonialForm.rating,
        comment: testimonialForm.comment,
      };

      const response = await fetch("/api/testimonials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(testimonialData),
      });

      if (response.ok) {
        setTestimonialForm({
          customerName: "",
          email: "",
          rating: 5,
          comment: "",
        });
        toast({
          title: "✓ Avis envoyé avec succès !",
          description: "Merci pour votre retour. Votre avis sera publié après validation.",
        });
      } else {
        toast({
          title: "Erreur",
          description: "Une erreur s'est produite. Veuillez réessayer.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur s'est produite. Veuillez réessayer.",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingReview(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <TopInfoBar />
      <Navigation />
      
      {/* Hero Section - connexion parfaite TopInfoBar > Navigation > Hero */}
      <section className="relative bg-gradient-to-br from-orange-600 via-orange-500 to-amber-500 pt-[7.5rem] md:pt-[8.75rem] lg:pt-36 pb-12 md:pb-20">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <div className="flex items-center justify-center mb-6 md:mb-8 lg:mb-10 mt-8 md:mt-12 lg:mt-16">
              <div className="w-24 h-24 md:w-48 md:h-48 lg:w-56 lg:h-56 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm relative overflow-hidden group hover:scale-110 transition-transform duration-300 shadow-2xl">
                <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent"></div>
                <Phone className="w-12 h-12 md:w-24 md:h-24 lg:w-28 lg:h-28 text-white relative z-10 group-hover:rotate-12 transition-transform duration-300" />
              </div>
            </div>
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full mb-6">
              <Sparkles className="w-5 h-5 text-white" />
              <span className="text-white font-semibold">Disponible 6j/7</span>
            </div>
            <h1 className="text-2xl md:text-3xl lg:text-5xl xl:text-6xl font-bold text-white mb-4 md:mb-6 tracking-tight font-serif">
              Contactez {siteInfo?.businessName || 'Dounie Cuisine'}
            </h1>
            <p className="text-sm md:text-lg lg:text-xl xl:text-2xl text-white/95 px-2 leading-relaxed">
              {siteInfo?.description || "Une question ? Un événement à planifier ? Notre équipe est là pour vous accompagner."}
            </p>
          </div>
        </div>
      </section>

      {/* Contact Info Cards */}
      <section className="py-8 md:py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            
            <Card className="border border-green-100 shadow-md hover:shadow-xl hover:border-green-300 transition-all duration-300 hover:-translate-y-1">
              <CardContent className="p-4 md:p-6 text-center">
                <div className="w-12 h-12 md:w-14 md:h-14 bg-gradient-to-br from-green-100 to-green-200 rounded-full flex items-center justify-center mx-auto mb-3 md:mb-4">
                  <Phone className="w-6 h-6 md:w-7 md:h-7 text-green-600" />
                </div>
                <h3 className="font-bold text-slate-900 mb-2 text-sm md:text-base">Téléphone</h3>
                <a href={`tel:${siteInfo?.phone1}`} className="text-slate-600 hover:text-orange-600 text-sm font-medium transition-colors">
                  {siteInfo?.phone1 || "Chargement..."}
                </a>
                {siteInfo?.phone2 && (
                  <a href={`tel:${siteInfo.phone2}`} className="block text-slate-500 hover:text-orange-600 text-xs mt-1 transition-colors">
                    {siteInfo.phone2}
                  </a>
                )}
              </CardContent>
            </Card>

            <Card className="border border-blue-100 shadow-md hover:shadow-xl hover:border-blue-300 transition-all duration-300 hover:-translate-y-1">
              <CardContent className="p-6 text-center">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Mail className="w-7 h-7 text-blue-600" />
                </div>
                <h3 className="font-bold text-slate-900 mb-2">E-mail</h3>
                <div className="space-y-1">
                  <a 
                    href={`mailto:${(siteInfo as any)?.email_primary || siteInfo?.emailPrimary}`} 
                    className="block text-slate-600 hover:text-orange-600 text-sm font-medium break-all transition-colors"
                  >
                    {(siteInfo as any)?.email_primary || siteInfo?.emailPrimary || "Chargement..."}
                  </a>
                  {((siteInfo as any)?.email_secondary || siteInfo?.emailSecondary) && (
                    <a 
                      href={`mailto:${(siteInfo as any)?.email_secondary || siteInfo?.emailSecondary}`}
                      className="block text-slate-500 hover:text-orange-600 text-xs mt-1 transition-colors"
                    >
                      {(siteInfo as any)?.email_secondary || siteInfo?.emailSecondary}
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="border border-purple-100 shadow-md hover:shadow-xl hover:border-purple-300 transition-all duration-300 hover:-translate-y-1">
              <CardContent className="p-6 text-center">
                <div className="w-14 h-14 bg-gradient-to-br from-purple-100 to-purple-200 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MapPin className="w-7 h-7 text-purple-600" />
                </div>
                <h3 className="font-bold text-slate-900 mb-2">Adresse</h3>
                {siteInfo?.address ? (
                  <a 
                    href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${siteInfo.address}, ${siteInfo.city}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-slate-600 hover:text-orange-600 text-sm font-medium transition-colors"
                  >
                    {siteInfo.address}<br />{siteInfo.city}, {siteInfo.province || 'QC'} {siteInfo.postalCode}
                  </a>
                ) : (
                  <p className="text-slate-600 text-sm font-medium">Chargement...</p>
                )}
              </CardContent>
            </Card>

            <Card className="border border-orange-100 shadow-md hover:shadow-xl hover:border-orange-300 transition-all duration-300 hover:-translate-y-1">
              <CardContent className="p-6 text-center">
                <div className="w-14 h-14 bg-gradient-to-br from-orange-100 to-orange-200 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock className="w-7 h-7 text-orange-600" />
                </div>
                <h3 className="font-bold text-slate-900 mb-2">Horaires</h3>
                {(() => {
                  const businessHours = (siteInfo as any)?.business_hours || siteInfo?.businessHours;
                  
                  if (businessHours && typeof businessHours === 'object' && !Array.isArray(businessHours)) {
                    const dayNames: Record<string, string> = {
                      monday: 'Lun', mon: 'Lun',
                      tuesday: 'Mar', tue: 'Mar',
                      wednesday: 'Mer', wed: 'Mer',
                      thursday: 'Jeu', thu: 'Jeu',
                      friday: 'Ven', fri: 'Ven',
                      saturday: 'Sam', sat: 'Sam',
                      sunday: 'Dim', sun: 'Dim'
                    };
                    
                    const entries = Object.entries(businessHours)
                      .map(([day, hours]) => {
                        const displayName = dayNames[day] || day;
                        if (hours && typeof hours === 'object' && (hours as any).isOpen) {
                          return (
                            <div key={day} className="flex justify-between gap-2">
                              <span className="font-semibold">{displayName}:</span>
                              <span>{(hours as any).open} - {(hours as any).close}</span>
                            </div>
                          );
                        }
                        return null;
                      })
                      .filter(Boolean);
                    
                    return entries.length > 0 ? (
                      <div className="text-slate-600 text-xs font-medium space-y-0.5">
                        {entries}
                      </div>
                    ) : (
                      <p className="text-slate-600 text-sm font-medium">Nous contacter</p>
                    );
                  } else if (typeof businessHours === 'string') {
                    return (
                      <div className="text-slate-600 text-sm font-medium whitespace-pre-line">
                        {businessHours}
                      </div>
                    );
                  } else {
                    return (
                      <p className="text-slate-600 text-sm font-medium">
                        Nous contacter
                      </p>
                    );
                  }
                })()}
              </CardContent>
            </Card>

          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="grid lg:grid-cols-2 gap-12">
            
            {/* Left: Forms */}
            <div className="space-y-8">
              
              {/* Contact Form */}
              <Card className="border border-slate-200 shadow-lg hover:shadow-2xl transition-all duration-300">
                <CardContent className="p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-gradient-to-br from-orange-100 to-orange-200 rounded-lg">
                      <Mail className="w-6 h-6 text-orange-600" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-slate-900">Envoyez-nous un message</h2>
                      <p className="text-sm text-slate-600">Nous répondons sous 24h</p>
                    </div>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="name" className="text-slate-700 font-medium">
                          Nom complet *
                        </Label>
                        <Input
                          id="name"
                          name="name"
                          required
                          value={formData.name}
                          onChange={handleChange}
                          className="mt-1.5 h-12 focus:ring-2 focus:ring-orange-500"
                          placeholder="Jean Dupont"
                        />
                      </div>
                      <div>
                        <Label htmlFor="email" className="text-slate-700 font-medium">
                          E-mail *
                        </Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          required
                          value={formData.email}
                          onChange={handleChange}
                          className="mt-1.5 h-12 focus:ring-2 focus:ring-orange-500"
                          placeholder="jean@email.com"
                        />
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="phone" className="text-slate-700 font-medium">
                          Téléphone
                        </Label>
                        <Input
                          id="phone"
                          name="phone"
                          type="tel"
                          value={formData.phone}
                          onChange={handleChange}
                          className="mt-1.5 h-12 focus:ring-2 focus:ring-orange-500"
                          placeholder="(514) 123-4567"
                        />
                      </div>
                      <div>
                        <Label htmlFor="subject" className="text-slate-700 font-medium">
                          Sujet
                        </Label>
                        <Input
                          id="subject"
                          name="subject"
                          value={formData.subject}
                          onChange={handleChange}
                          className="mt-1.5 h-12 focus:ring-2 focus:ring-orange-500"
                          placeholder="Votre sujet"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="message" className="text-slate-700 font-medium">
                        Message *
                      </Label>
                      <Textarea
                        id="message"
                        name="message"
                        required
                        value={formData.message}
                        onChange={handleChange}
                        rows={5}
                        className="mt-1.5 focus:ring-2 focus:ring-orange-500 resize-none"
                        placeholder="Décrivez votre demande..."
                      />
                    </div>

                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-orange-600 hover:bg-orange-700 h-12 text-base"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Envoi en cours...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          Envoyer le message
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Review Form */}
              <Card className="border border-slate-200 shadow-lg hover:shadow-2xl transition-all duration-300">
                <CardContent className="p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-lg">
                      <Star className="w-6 h-6 text-yellow-600" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-slate-900">Laissez un avis</h2>
                      <p className="text-sm text-slate-600">Partagez votre expérience</p>
                    </div>
                  </div>

                  <form onSubmit={handleTestimonialSubmit} className="space-y-5">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="customerName" className="text-slate-700 font-medium">
                          Votre nom *
                        </Label>
                        <Input
                          id="customerName"
                          name="customerName"
                          required
                          value={testimonialForm.customerName}
                          onChange={handleTestimonialChange}
                          className="mt-1.5 h-12 focus:ring-2 focus:ring-orange-500"
                          placeholder="Votre nom"
                        />
                      </div>
                      <div>
                        <Label htmlFor="reviewEmail" className="text-slate-700 font-medium">
                          E-mail *
                        </Label>
                        <Input
                          id="reviewEmail"
                          name="email"
                          type="email"
                          required
                          value={testimonialForm.email}
                          onChange={handleTestimonialChange}
                          className="mt-1.5 h-12 focus:ring-2 focus:ring-orange-500"
                          placeholder="votre@email.com"
                        />
                      </div>
                    </div>

                    <div>
                      <Label className="text-slate-700 font-medium mb-3 block">
                        Note *
                      </Label>
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setTestimonialForm(prev => ({ ...prev, rating: star }))}
                            className="focus:outline-none transition-transform hover:scale-110"
                          >
                            <Star
                              className={`w-8 h-8 ${
                                star <= testimonialForm.rating
                                  ? "text-yellow-400 fill-yellow-400"
                                  : "text-slate-300"
                              }`}
                            />
                          </button>
                        ))}
                        <span className="ml-2 text-lg font-semibold text-slate-700">
                          {testimonialForm.rating}/5
                        </span>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="comment" className="text-slate-700 font-medium">
                        Votre avis *
                      </Label>
                      <Textarea
                        id="comment"
                        name="comment"
                        required
                        value={testimonialForm.comment}
                        onChange={handleTestimonialChange}
                        rows={4}
                        className="mt-1.5 focus:ring-2 focus:ring-orange-500 resize-none"
                        placeholder="Partagez votre expérience..."
                      />
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex gap-3">
                        <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-blue-900">
                          Votre avis sera vérifié par notre équipe avant publication.
                        </p>
                      </div>
                    </div>

                    <Button
                      type="submit"
                      disabled={isSubmittingReview}
                      className="w-full bg-orange-600 hover:bg-orange-700 h-12 text-base"
                    >
                      {isSubmittingReview ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Envoi en cours...
                        </>
                      ) : (
                        <>
                          <Star className="w-4 h-4 mr-2" />
                          Publier mon avis
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>

            </div>

            {/* Right: Map & Info */}
            <div className="space-y-8">
              
              {/* Google Map */}
              <Card className="border border-slate-200 shadow-lg hover:shadow-xl transition-shadow overflow-hidden">
                <iframe
                  src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${encodeURIComponent(mapAddress)}&zoom=15`}
                  className="w-full h-96 border-0"
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Notre localisation"
                />
                {siteInfo?.address && (
                  <CardContent className="p-6 bg-gradient-to-r from-orange-50 to-amber-50">
                    <div className="flex items-start gap-4">
                      <MapPin className="w-6 h-6 text-orange-600 flex-shrink-0 mt-1" />
                      <div className="flex-1">
                        <p className="font-bold text-slate-900 mb-1">
                          {siteInfo.businessName || 'Dounie Cuisine'}
                        </p>
                        <p className="text-slate-600 text-sm mb-3">
                          {siteInfo.address}, {siteInfo.city}, {siteInfo.province || 'QC'} {siteInfo.postalCode}
                        </p>
                        <a 
                          href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${siteInfo.address}, ${siteInfo.city}`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-orange-600 hover:text-orange-700 font-semibold text-sm"
                        >
                          <MapPin className="w-4 h-4" />
                          Obtenir l'itinéraire
                        </a>
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>

              {/* Why Choose Us */}
              <Card className="border border-orange-200 shadow-lg hover:shadow-xl transition-shadow bg-gradient-to-br from-orange-50 to-amber-50">
                <CardContent className="p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-gradient-to-br from-orange-100 to-orange-200 rounded-lg">
                      <Sparkles className="w-6 h-6 text-orange-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900">
                      Pourquoi {siteInfo?.businessName || 'nous'} ?
                    </h3>
                  </div>
                  
                  <div className="space-y-5">
                    <div className="flex gap-4 bg-white/80 p-4 rounded-lg">
                      <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Award className="w-6 h-6 text-orange-600" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 mb-1">Excellence culinaire</h4>
                        <p className="text-sm text-slate-600">
                          {siteInfo?.tagline || "Des plats traditionnels haïtiens préparés avec passion et des ingrédients de qualité."}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-4 bg-white/80 p-4 rounded-lg">
                      <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Clock className="w-6 h-6 text-green-600" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 mb-1">Service rapide & fiable</h4>
                        <p className="text-sm text-slate-600">
                          Réponse garantie sous 24h. Livraison et traiteur disponibles sur toute l'île de Montréal.
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-4 bg-white/80 p-4 rounded-lg">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Users className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 mb-1">Équipe passionnée</h4>
                        <p className="text-sm text-slate-600">
                          {siteInfo?.phone1 && `Appelez-nous au ${siteInfo.phone1} pour toute question ou réservation.`}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

            </div>

          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
