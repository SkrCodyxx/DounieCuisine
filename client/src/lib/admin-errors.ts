/**
 * Utilitaires pour la gestion des erreurs dans l'interface d'administration
 * Fournit des messages d'erreur détaillés et contextualisés
 */

export interface ApiError {
  message: string;
  status?: number;
  details?: string;
}

/**
 * Extrait et formate une erreur depuis une réponse fetch
 */
export async function parseApiError(response: Response): Promise<ApiError> {
  let message = "Une erreur s'est produite";
  let details = "";

  try {
    const data = await response.json();
    message = data.message || data.error || message;
    details = data.details || "";
  } catch {
    // Si impossible de parser le JSON, utiliser le status text
    message = response.statusText || message;
  }

  // Ajouter des messages contextuels selon le code d'erreur
  switch (response.status) {
    case 400:
      details = details || "Données invalides. Vérifiez les champs requis.";
      break;
    case 401:
      message = "Session expirée";
      details = "Veuillez vous reconnecter à votre compte administrateur.";
      break;
    case 403:
      message = "Accès refusé";
      details = "Vous n'avez pas les permissions nécessaires pour cette action.";
      break;
    case 404:
      message = "Ressource introuvable";
      details = details || "L'élément demandé n'existe plus ou a été supprimé.";
      break;
    case 409:
      message = "Conflit détecté";
      details = details || "Cette opération entre en conflit avec des données existantes.";
      break;
    case 413:
      message = "Fichier trop volumineux";
      details = "La taille du fichier dépasse la limite autorisée.";
      break;
    case 415:
      message = "Format non supporté";
      details = "Le type de fichier n'est pas accepté.";
      break;
    case 422:
      message = "Données non valides";
      details = details || "Les données envoyées ne respectent pas le format attendu.";
      break;
    case 429:
      message = "Trop de requêtes";
      details = "Veuillez patienter quelques instants avant de réessayer.";
      break;
    case 500:
      message = "Erreur serveur interne";
      details = "Une erreur technique s'est produite. Contactez le support si le problème persiste.";
      break;
    case 502:
      message = "Serveur indisponible";
      details = "Le serveur ne répond pas. Veuillez réessayer dans quelques instants.";
      break;
    case 503:
      message = "Service temporairement indisponible";
      details = "Maintenance en cours. Réessayez dans quelques minutes.";
      break;
  }

  return {
    message,
    status: response.status,
    details: details || `Code d'erreur: ${response.status}`,
  };
}

/**
 * Formate une erreur pour l'affichage dans un toast
 */
export function formatErrorForToast(error: unknown, context?: string) {
  if (error instanceof Error) {
    return {
      title: `❌ ${context || "Erreur"}`,
      description: error.message || "Une erreur inattendue s'est produite",
      variant: "destructive" as const,
    };
  }

  if (typeof error === "object" && error !== null && "message" in error) {
    const apiError = error as ApiError;
    return {
      title: `❌ ${apiError.message}`,
      description: apiError.details || `Code: ${apiError.status || "inconnu"}`,
      variant: "destructive" as const,
    };
  }

  return {
    title: `❌ ${context || "Erreur"}`,
    description: "Une erreur technique s'est produite. Veuillez réessayer.",
    variant: "destructive" as const,
  };
}

/**
 * Messages de succès contextualisés
 */
export const successMessages = {
  create: (item: string) => ({
    title: `✅ ${item} créé avec succès`,
    description: `Le ${item.toLowerCase()} a été ajouté à votre système`,
  }),
  update: (item: string) => ({
    title: `✅ ${item} modifié avec succès`,
    description: "Les modifications ont été enregistrées",
  }),
  delete: (item: string) => ({
    title: `🗑️ ${item} supprimé avec succès`,
    description: `Le ${item.toLowerCase()} a été retiré du système`,
  }),
  upload: (item: string) => ({
    title: `📤 ${item} téléversé avec succès`,
    description: "Le fichier est maintenant disponible",
  }),
  save: () => ({
    title: "💾 Sauvegarde réussie",
    description: "Toutes les modifications ont été enregistrées",
  }),
  activate: (item: string) => ({
    title: `✅ ${item} activé`,
    description: `Le ${item.toLowerCase()} est maintenant visible publiquement`,
  }),
  deactivate: (item: string) => ({
    title: `⏸️ ${item} désactivé`,
    description: `Le ${item.toLowerCase()} a été masqué du public`,
  }),
};

/**
 * Gestion des erreurs de validation de formulaire
 */
export function getValidationError(field: string, value: any): string | null {
  if (!value || (typeof value === "string" && value.trim() === "")) {
    return `Le champ "${field}" est requis`;
  }

  if (typeof value === "string") {
    if (field.toLowerCase().includes("email") && !value.includes("@")) {
      return "Adresse email invalide";
    }
    if (field.toLowerCase().includes("url") && !value.startsWith("http")) {
      return "L'URL doit commencer par http:// ou https://";
    }
    if (field.toLowerCase().includes("phone") && value.length < 10) {
      return "Numéro de téléphone invalide (minimum 10 chiffres)";
    }
  }

  if (typeof value === "number") {
    if (field.toLowerCase().includes("price") && value < 0) {
      return "Le prix ne peut pas être négatif";
    }
    if (field.toLowerCase().includes("quantity") && value < 0) {
      return "La quantité ne peut pas être négative";
    }
  }

  return null;
}

/**
 * Messages d'erreur spécifiques par contexte
 */
export const contextualErrors = {
  network: {
    title: "❌ Erreur de connexion",
    description:
      "Impossible de se connecter au serveur. Vérifiez votre connexion internet et réessayez.",
  },
  timeout: {
    title: "⏱️ Délai d'attente dépassé",
    description:
      "L'opération a pris trop de temps. Le serveur est peut-être surchargé. Réessayez plus tard.",
  },
  unauthorized: {
    title: "🔒 Session expirée",
    description:
      "Votre session a expiré pour des raisons de sécurité. Veuillez vous reconnecter.",
  },
  forbidden: {
    title: "⛔ Accès interdit",
    description:
      "Vous n'avez pas les permissions nécessaires. Contactez un super administrateur.",
  },
  notFound: {
    title: "🔍 Introuvable",
    description:
      "L'élément recherché n'existe pas ou a été supprimé récemment.",
  },
  conflict: {
    title: "⚠️ Conflit détecté",
    description:
      "Cette action est en conflit avec des données existantes. Vérifiez les doublons.",
  },
  validation: {
    title: "📝 Validation échouée",
    description:
      "Certains champs contiennent des erreurs. Corrigez-les et réessayez.",
  },
  fileSize: {
    title: "📦 Fichier trop volumineux",
    description:
      "La taille maximale autorisée est de 5 MB. Compressez votre fichier.",
  },
  fileType: {
    title: "🚫 Type de fichier non supporté",
    description:
      "Seuls les formats JPG, PNG, GIF et WebP sont acceptés pour les images.",
  },
};
