import React, { useState } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Star, MessageSquare, User, Send } from "lucide-react";

export default function LeaveReview() {
  const { toast } = useToast();
  const [clientName, setClientName] = useState("");
  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName || !comment) {
      toast({ title: "Merci", description: "Merci de remplir votre nom et votre commentaire.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      await apiRequest("POST", "/api/testimonials", {
        clientName,
        rating,
        comment,
      });

      setClientName("");
      setComment("");
      setRating(5);

      toast({ title: "Merci!", description: "Votre avis a été envoyé et sera publié après validation." });
    } catch (err: any) {
      console.error("Error submitting testimonial:", err);
      toast({ title: "Erreur", description: err?.message || "Une erreur est survenue.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="max-w-3xl mx-auto mt-8 bg-gradient-to-br from-white via-white to-primary/5 border-0 shadow-xl">
      <CardHeader className="text-center pb-4">
        <div className="flex items-center justify-center mb-4">
          <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
            <MessageSquare className="w-6 h-6 text-white" />
          </div>
        </div>
        <CardTitle className="text-2xl font-serif text-primary mb-2">
          Partagez votre expérience
        </CardTitle>
        <p className="text-muted-foreground leading-relaxed">
          Votre avis nous aide à améliorer nos services et inspire d'autres gourmets. 
          Il sera publié après validation.
        </p>
      </CardHeader>
      
      <CardContent className="pt-0">
        <form onSubmit={submit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="clientName" className="flex items-center gap-2 text-sm font-medium">
              <User className="w-4 h-4 text-primary" />
              Votre nom
            </Label>
            <Input
              id="clientName"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="Ex: Marie Dubois"
              className="focus:ring-primary focus:border-primary"
            />
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-sm font-medium">
              <Star className="w-4 h-4 text-primary" />
              Votre note
            </Label>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className={`transition-colors ${
                    star <= rating 
                      ? "text-yellow-400 hover:text-yellow-500" 
                      : "text-gray-300 hover:text-gray-400"
                  }`}
                >
                  <Star className="w-8 h-8 fill-current" />
                </button>
              ))}
              <span className="ml-2 text-sm text-muted-foreground">
                {rating} étoile{rating > 1 ? 's' : ''}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="comment" className="flex items-center gap-2 text-sm font-medium">
              <MessageSquare className="w-4 h-4 text-primary" />
              Votre commentaire
            </Label>
            <Textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Racontez-nous votre expérience culinaire chez Dounie Cuisine..."
              className="min-h-[120px] resize-none focus:ring-primary focus:border-primary"
            />
          </div>

          <div className="pt-4 border-t border-gray-100">
            <Button 
              type="submit" 
              disabled={loading || !clientName || !comment}
              className="w-full bg-primary hover:bg-primary/90 text-white py-3 text-base font-medium"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  Envoi en cours...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Send className="w-4 h-4" />
                  Envoyer mon avis
                </div>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
