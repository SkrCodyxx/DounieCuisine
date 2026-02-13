"use client";

import { useState } from "react";
import PageLayout from "@/components/layout/page-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Mail, Phone, MapPin } from "lucide-react";
import { useSiteInfo } from "@/hooks/use-site-info";
import { apiRequest } from "@/lib/query-client";
import { useToast } from "@/hooks/use-toast";

export default function ContactPage() {
  const { data: siteInfo } = useSiteInfo();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    try {
      await apiRequest("POST", "/api/contact", {
        name: formData.get("name"),
        email: formData.get("email"),
        phone: formData.get("phone") || null,
        inquiryType: formData.get("inquiryType") || "general",
        subject: formData.get("subject") || null,
        message: formData.get("message"),
      });

      toast({ title: "Message envoye!", description: "Nous vous repondrons bientot." });
      (e.target as HTMLFormElement).reset();
    } catch {
      toast({ title: "Erreur", description: "Une erreur s'est produite.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageLayout>
      <section className="py-12 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
              <Mail className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-3xl md:text-5xl font-serif font-bold text-balance">Contactez-nous</h1>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto text-pretty">
              {"Nous sommes la pour repondre a toutes vos questions"}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Contact info */}
            <div className="space-y-6">
              {siteInfo?.phone1 && (
                <div className="flex items-start gap-4 p-4 rounded-lg border bg-card">
                  <Phone className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold">Telephone</h3>
                    <a href={`tel:${siteInfo.phone1}`} className="text-muted-foreground hover:text-primary transition-colors">
                      {siteInfo.phone1}
                    </a>
                  </div>
                </div>
              )}
              {siteInfo?.emailPrimary && (
                <div className="flex items-start gap-4 p-4 rounded-lg border bg-card">
                  <Mail className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold">Email</h3>
                    <a href={`mailto:${siteInfo.emailPrimary}`} className="text-muted-foreground hover:text-primary transition-colors">
                      {siteInfo.emailPrimary}
                    </a>
                  </div>
                </div>
              )}
              {siteInfo?.address && (
                <div className="flex items-start gap-4 p-4 rounded-lg border bg-card">
                  <MapPin className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold">Adresse</h3>
                    <p className="text-muted-foreground">
                      {siteInfo.address}
                      {siteInfo.city && `, ${siteInfo.city}`}
                      {siteInfo.province && `, ${siteInfo.province}`}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Form */}
            <div className="lg:col-span-2">
              <form onSubmit={handleSubmit} className="space-y-6 p-6 rounded-xl border bg-card">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nom complet *</Label>
                    <Input id="name" name="name" required placeholder="Votre nom" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input id="email" name="email" type="email" required placeholder="votre@email.com" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telephone</Label>
                    <Input id="phone" name="phone" type="tel" placeholder="(514) 000-0000" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="inquiryType">Type de demande</Label>
                    <Select name="inquiryType" defaultValue="general">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general">{"Question generale"}</SelectItem>
                        <SelectItem value="catering">Service traiteur</SelectItem>
                        <SelectItem value="event">Evenement</SelectItem>
                        <SelectItem value="order">Commande</SelectItem>
                        <SelectItem value="other">Autre</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subject">Sujet</Label>
                  <Input id="subject" name="subject" placeholder="Sujet de votre message" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Message *</Label>
                  <Textarea id="message" name="message" required rows={5} placeholder="Votre message..." />
                </div>

                <Button type="submit" size="lg" className="w-full" disabled={loading}>
                  {loading ? "Envoi en cours..." : "Envoyer le message"}
                </Button>
              </form>
            </div>
          </div>
        </div>
      </section>
    </PageLayout>
  );
}
