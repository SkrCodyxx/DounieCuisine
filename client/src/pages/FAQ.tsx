import { useState } from "react";
import Navigation from "@/components/Navigation";
import TopInfoBar from "@/components/TopInfoBar";
import Footer from "@/components/Footer";
import { ChevronDown, Search, Phone, Mail, MessageCircle } from "lucide-react";
import { Input } from "@/components/ui/input";

interface FAQItem {
  id: number;
  question: string;
  answer: string;
  category: "commandes" | "livraison" | "traiteur" | "paiement" | "general";
}

const faqData: FAQItem[] = [
  // Commandes
  {
    id: 1,
    category: "commandes",
    question: "Comment passer une commande ?",
    answer: "Vous pouvez passer commande directement sur notre site en ajoutant vos plats préférés au panier, puis en procédant au paiement. Vous pouvez également nous appeler ou nous envoyer un message via WhatsApp."
  },
  {
    id: 2,
    category: "commandes",
    question: "Puis-je modifier ma commande après l'avoir passée ?",
    answer: "Oui, vous pouvez modifier votre commande dans les 15 minutes suivant sa validation. Contactez-nous rapidement par téléphone au numéro indiqué sur votre confirmation."
  },
  {
    id: 3,
    category: "commandes",
    question: "Quel est le délai de préparation ?",
    answer: "Nos plats sont préparés frais. Comptez entre 30 à 45 minutes pour une commande standard. Pour les grandes quantités ou événements, contactez-nous au moins 24h à l'avance."
  },
  {
    id: 4,
    category: "commandes",
    question: "Proposez-vous des options végétariennes ou sans gluten ?",
    answer: "Oui ! Nous avons plusieurs options végétariennes et pouvons adapter certains plats selon vos restrictions alimentaires. Consultez notre menu ou contactez-nous pour plus d'informations."
  },
  
  // Livraison
  {
    id: 5,
    category: "livraison",
    question: "Dans quelles zones livrez-vous ?",
    answer: "Nous livrons principalement dans la région de Montréal et les environs proches. Entrez votre code postal lors de la commande pour vérifier la disponibilité. Pour les zones éloignées, des frais supplémentaires peuvent s'appliquer."
  },
  {
    id: 6,
    category: "livraison",
    question: "Quels sont les frais de livraison ?",
    answer: "Les frais de livraison varient selon votre distance. Ils sont automatiquement calculés lors du paiement. Nous offrons la livraison gratuite pour les commandes de plus de 50$."
  },
  {
    id: 7,
    category: "livraison",
    question: "Puis-je suivre ma livraison en temps réel ?",
    answer: "Oui ! Une fois votre commande en route, vous recevrez un SMS avec un lien de suivi. Vous pourrez voir la position du livreur en temps réel."
  },
  {
    id: 8,
    category: "livraison",
    question: "Que se passe-t-il si je ne suis pas disponible à la livraison ?",
    answer: "Assurez-vous d'être disponible à l'heure prévue. Si personne ne répond, le livreur vous contactera par téléphone. En cas d'absence prolongée, la commande sera retournée et aucun remboursement ne sera effectué."
  },

  // Traiteur
  {
    id: 9,
    category: "traiteur",
    question: "Proposez-vous des services de traiteur pour événements ?",
    answer: "Absolument ! Nous offrons des services de traiteur complets pour mariages, anniversaires, événements corporatifs et plus. Contactez-nous pour discuter de votre événement et obtenir un devis personnalisé."
  },
  {
    id: 10,
    category: "traiteur",
    question: "Quel est le délai pour commander un service traiteur ?",
    answer: "Nous recommandons de nous contacter au moins 1 semaine à l'avance pour les petits événements (10-30 personnes) et 2-3 semaines pour les grands événements (50+ personnes). Pour les mariages, contactez-nous idéalement 1-2 mois à l'avance."
  },
  {
    id: 11,
    category: "traiteur",
    question: "Fournissez-vous le matériel (assiettes, couverts, nappes) ?",
    answer: "Oui, nous pouvons fournir tout le matériel nécessaire : vaisselle, couverts, nappes, chafing dishes, etc. Ces services sont inclus dans certains forfaits ou disponibles moyennant des frais supplémentaires."
  },
  {
    id: 12,
    category: "traiteur",
    question: "Proposez-vous des dégustations avant l'événement ?",
    answer: "Oui ! Pour les événements importants (50+ personnes), nous offrons des séances de dégustation sur rendez-vous. Des frais peuvent s'appliquer mais sont déduits de la facture finale si vous confirmez la commande."
  },

  // Paiement
  {
    id: 13,
    category: "paiement",
    question: "Quels modes de paiement acceptez-vous ?",
    answer: "Nous acceptons les cartes de crédit (Visa, Mastercard, Amex), les cartes de débit, les paiements par Interac et les paiements en ligne sécurisés via Square. Pour les grands événements, nous acceptons aussi les virements bancaires."
  },
  {
    id: 14,
    category: "paiement",
    question: "Mes informations de paiement sont-elles sécurisées ?",
    answer: "Oui, absolument ! Tous les paiements sont traités via Square, une plateforme de paiement hautement sécurisée avec chiffrement SSL. Nous ne stockons jamais vos informations de carte bancaire."
  },
  {
    id: 15,
    category: "paiement",
    question: "Puis-je obtenir une facture pour ma commande ?",
    answer: "Oui, une facture détaillée vous est automatiquement envoyée par email après chaque commande. Vous pouvez également télécharger vos factures depuis votre compte client."
  },
  {
    id: 16,
    category: "paiement",
    question: "Quelle est votre politique de remboursement ?",
    answer: "Si vous n'êtes pas satisfait de votre commande, contactez-nous dans les 24h. Nous évaluerons la situation et proposerons un remboursement partiel ou total, ou un avoir pour une prochaine commande, selon le cas."
  },

  // Général
  {
    id: 17,
    category: "general",
    question: "Où êtes-vous situés ?",
    answer: "Nous sommes basés à Montréal. Consultez notre page Contact pour l'adresse exacte, les horaires d'ouverture et une carte interactive."
  },
  {
    id: 18,
    category: "general",
    question: "Proposez-vous un programme de fidélité ?",
    answer: "Oui ! Créez un compte sur notre site pour accumuler des points à chaque commande. Ces points peuvent être échangés contre des réductions sur vos prochaines commandes."
  },
  {
    id: 19,
    category: "general",
    question: "Comment puis-je vous contacter ?",
    answer: "Vous pouvez nous joindre par téléphone, email, ou via le formulaire de contact sur notre site. Nous sommes également disponibles sur WhatsApp pour une réponse rapide."
  },
  {
    id: 20,
    category: "general",
    question: "Organisez-vous des événements ou ateliers culinaires ?",
    answer: "Oui ! Nous organisons régulièrement des événements, soirées à thème et ateliers de cuisine. Consultez notre page Événements pour voir le calendrier et vous inscrire."
  }
];

const categories = [
  { id: "all", label: "Toutes", icon: "🏠" },
  { id: "commandes", label: "Commandes", icon: "🛒" },
  { id: "livraison", label: "Livraison", icon: "🚚" },
  { id: "traiteur", label: "Traiteur", icon: "🍽️" },
  { id: "paiement", label: "Paiement", icon: "💳" },
  { id: "general", label: "Général", icon: "❓" }
];

export default function FAQ() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [openItems, setOpenItems] = useState<number[]>([]);

  const toggleItem = (id: number) => {
    setOpenItems(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const filteredFAQ = faqData.filter(item => {
    const matchesSearch = 
      item.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <TopInfoBar />
      <Navigation />

      {/* Hero Section - connexion parfaite TopInfoBar > Navigation > Hero */}
      <section className="relative pt-[7.5rem] md:pt-[8.75rem] lg:pt-36 pb-20 bg-gradient-to-r from-orange-600 via-orange-500 to-yellow-500 overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white">
          <h1 className="font-serif text-6xl md:text-7xl font-bold mb-6">
            Questions Fréquentes
          </h1>
          <p className="text-2xl md:text-3xl text-white/95 max-w-3xl mx-auto leading-relaxed mb-12">
            Trouvez rapidement les réponses à vos questions
          </p>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Rechercher une question..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 pr-4 py-6 text-lg bg-white/95 backdrop-blur border-0 shadow-xl rounded-2xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-8 bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap gap-3 justify-center">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-6 py-3 rounded-full font-semibold transition-all ${
                  selectedCategory === cat.id
                    ? "bg-orange-500 text-white shadow-lg scale-105"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                <span className="mr-2">{cat.icon}</span>
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Items */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {filteredFAQ.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">
                Aucune question ne correspond à votre recherche.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredFAQ.map(item => (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl shadow-md hover:shadow-lg transition-all overflow-hidden border border-gray-100"
                >
                  <button
                    onClick={() => toggleItem(item.id)}
                    className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
                  >
                    <h3 className="text-lg font-semibold text-gray-900 pr-4">
                      {item.question}
                    </h3>
                    <ChevronDown
                      className={`w-5 h-5 text-orange-500 flex-shrink-0 transition-transform ${
                        openItems.includes(item.id) ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  {openItems.includes(item.id) && (
                    <div className="px-6 pb-5 text-gray-600 leading-relaxed border-t border-gray-100 pt-4">
                      {item.answer}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Contact CTA */}
      <section className="py-16 bg-gradient-to-r from-orange-50 to-amber-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Vous ne trouvez pas votre réponse ?
          </h2>
          <p className="text-gray-600 mb-8">
            Notre équipe est là pour vous aider ! Contactez-nous par le moyen qui vous convient.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <a
              href="tel:+15145551234"
              className="inline-flex items-center gap-2 px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg shadow-lg transition-all"
            >
              <Phone className="w-5 h-5" />
              Téléphoner
            </a>
            <a
              href="mailto:info@douniecuisine.com"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white hover:bg-gray-50 text-gray-900 font-semibold rounded-lg shadow-lg transition-all border border-gray-200"
            >
              <Mail className="w-5 h-5" />
              Email
            </a>
            <a
              href="/contact"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white hover:bg-gray-50 text-gray-900 font-semibold rounded-lg shadow-lg transition-all border border-gray-200"
            >
              <MessageCircle className="w-5 h-5" />
              Formulaire
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
