import { SquareClient, SquareEnvironment } from "square";
import type { IStorage } from "../storage";

// Cache pour le client Square pour éviter de recréer à chaque requête
let squareClientCache: SquareClient | null = null;
let settingsTimestamp = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Récupère un client Square initialisé avec les credentials depuis la DB
 * Utilise un cache pour éviter de recréer le client à chaque requête
 */
export async function getSquareClient(storage: IStorage): Promise<SquareClient> {
  const now = Date.now();

  // Retourner le client en cache s'il est encore valide
  if (squareClientCache && (now - settingsTimestamp) < CACHE_TTL) {
    return squareClientCache;
  }

  // Récupérer le token non masqué depuis la DB
  const accessToken = await storage.getSquareAccessToken();
  
  if (!accessToken) {
    throw new Error("Square Access Token non configuré. Veuillez configurer les credentials Square dans l'admin.");
  }

  // Récupérer l'environnement (sandbox ou production)
  const environment = process.env.SQUARE_ENVIRONMENT === 'production' 
    ? SquareEnvironment.Production 
    : SquareEnvironment.Sandbox;

  // Créer un nouveau client
  squareClientCache = new SquareClient({
    token: accessToken,
    environment: environment,
  });

  settingsTimestamp = now;

  return squareClientCache;
}

/**
 * Invalide le cache du client Square
 * Utilisé quand les settings Square sont mis à jour
 */
export function invalidateSquareClientCache(): void {
  squareClientCache = null;
  settingsTimestamp = 0;
}

/**
 * Récupère les informations de location Square
 */
export async function getSquareLocationId(storage: IStorage): Promise<string> {
  const locationId = process.env.SQUARE_LOCATION_ID || '';
  
  if (!locationId) {
    throw new Error("Square Location ID non configuré. Veuillez configurer les credentials Square dans le fichier .env");
  }
  
  return locationId;
}

/**
 * Récupère l'Application ID Square (pour le Web Payments SDK côté frontend)
 */
export async function getSquareApplicationId(storage: IStorage): Promise<string> {
  const applicationId = process.env.SQUARE_APPLICATION_ID || '';
  
  if (!applicationId) {
    throw new Error("Square Application ID non configuré. Veuillez configurer les credentials Square dans le fichier .env");
  }
  
  return applicationId;
}

/**
 * Récupère l'Access Token Square
 */
export async function getSquareAccessToken(storage: IStorage): Promise<string> {
  const accessToken = await storage.getSquareAccessToken();
  
  if (!accessToken) {
    throw new Error("Square Access Token non configuré. Veuillez configurer les credentials Square dans l'admin.");
  }
  
  return accessToken;
}
