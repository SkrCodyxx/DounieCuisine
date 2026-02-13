"use client";

import PageLayout from "@/components/layout/page-layout";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { HelpCircle } from "lucide-react";

const faqItems = [
  {
    question: "Comment passer une commande pour emporter?",
    answer:
      "Visitez notre page Menu, selectionnez vos plats preferes, ajoutez-les au panier et procedez au paiement. Vous recevrez une confirmation par email avec les details de votre commande.",
  },
  {
    question: "Offrez-vous un service de traiteur?",
    answer:
      "Oui! Nous offrons un service traiteur complet pour tous types d'evenements: mariages, fetes corporatives, anniversaires, etc. Consultez notre menu traiteur et demandez un devis personnalise.",
  },
  {
    question: "Quels sont vos delais de livraison?",
    answer:
      "Pour les commandes a emporter, prevoyez environ 30 a 45 minutes de preparation. Pour le service traiteur, nous recommandons de passer commande au moins 48 heures a l'avance.",
  },
  {
    question: "Quels modes de paiement acceptez-vous?",
    answer:
      "Nous acceptons Visa, Mastercard, American Express, Discover, Interac, Visa Debit et Debit Mastercard. Tous les paiements sont securises par SSL.",
  },
  {
    question: "Avez-vous des options pour les allergies alimentaires?",
    answer:
      "Absolument. Chaque plat indique les allergenes potentiels. N'hesitez pas a nous contacter pour des demandes specifiques ou des accommodations dietetiques.",
  },
  {
    question: "Comment annuler ou modifier une commande?",
    answer:
      "Contactez-nous par telephone ou email le plus rapidement possible apres avoir passe votre commande. Nous ferons notre possible pour accommoder les changements.",
  },
  {
    question: "Offrez-vous des services de DJ et d'animation?",
    answer:
      "Oui, nous offrons des services de DJ et d'animation professionnelle pour accompagner nos services traiteur lors de vos evenements.",
  },
];

export default function FAQPage() {
  return (
    <PageLayout>
      <section className="py-12 md:py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
              <HelpCircle className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-3xl md:text-5xl font-serif font-bold text-balance">Questions Frequentes</h1>
            <p className="mt-4 text-lg text-muted-foreground text-pretty">
              Trouvez les reponses a vos questions les plus courantes
            </p>
          </div>

          <Accordion type="single" collapsible className="space-y-4">
            {faqItems.map((item, i) => (
              <AccordionItem key={i} value={`item-${i}`} className="border rounded-lg px-6 bg-card">
                <AccordionTrigger className="text-left font-semibold hover:no-underline py-5">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-5">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>
    </PageLayout>
  );
}
