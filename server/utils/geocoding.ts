/**
 * Geocoding and Distance Calculation Utilities
 * Uses OpenStreetMap Nominatim API for geocoding (free, no API key required)
 * Uses Haversine formula for distance calculation
 * 
 * IMPORTANT: Nominatim Usage Policy requires max 1 request per second
 * We implement caching and rate limiting to comply
 */

interface Coordinates {
  lat: number;
  lon: number;
}

interface GeocodeResult {
  success: boolean;
  coordinates?: Coordinates;
  error?: string;
}

// In-memory cache for geocoded addresses (primarily for business address)
const geocodeCache = new Map<string, Coordinates>();

// Rate limiting: Track last request time (Nominatim requires 1 req/sec)
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL_MS = 1100; // 1.1 seconds to be safe

/**
 * Geocode an address using OpenStreetMap Nominatim API with caching and rate limiting
 * @param address Full address string (e.g., "123 Rue Saint-Laurent, Montreal, QC, Canada")
 * @param isBusinessAddress Mark as true for business address (higher cache priority)
 * @returns GeocodeResult with coordinates or error
 */
export async function geocodeAddress(address: string, isBusinessAddress: boolean = false): Promise<GeocodeResult> {
  try {
    // Clean and format address
    const cleanAddress = address.trim();
    if (!cleanAddress) {
      return { success: false, error: "Adresse vide" };
    }

    // Check cache first
    const cacheKey = cleanAddress.toLowerCase();
    if (geocodeCache.has(cacheKey)) {
      return {
        success: true,
        coordinates: geocodeCache.get(cacheKey)!
      };
    }

    // Rate limiting: Ensure we respect Nominatim's 1 req/sec policy
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime;
    if (timeSinceLastRequest < MIN_REQUEST_INTERVAL_MS) {
      const waitTime = MIN_REQUEST_INTERVAL_MS - timeSinceLastRequest;
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    // Use Nominatim API (free, no key required)
    const url = `https://nominatim.openstreetmap.org/search?` +
      `q=${encodeURIComponent(cleanAddress)}&` +
      `format=json&` +
      `limit=1&` +
      `addressdetails=1&` +
      `countrycodes=ca`; // Restrict to Canada

    lastRequestTime = Date.now();

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Dounie-Cuisine-Delivery-System/1.0' // Required by Nominatim
      }
    });

    if (!response.ok) {
      return { success: false, error: "Erreur lors de la géolocalisation" };
    }

    const data = await response.json();

    if (!data || data.length === 0) {
      return { success: false, error: "Adresse non trouvée" };
    }

    const result = data[0];
    const coordinates: Coordinates = {
      lat: parseFloat(result.lat),
      lon: parseFloat(result.lon)
    };

    // Cache the result (especially important for business address)
    geocodeCache.set(cacheKey, coordinates);

    return {
      success: true,
      coordinates
    };
  } catch (error: any) {
    console.error("Geocoding error:", error);
    return { success: false, error: error.message || "Erreur de géolocalisation" };
  }
}

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param coord1 First coordinate {lat, lon}
 * @param coord2 Second coordinate {lat, lon}
 * @returns Distance in kilometers
 */
export function calculateDistance(coord1: Coordinates, coord2: Coordinates): number {
  const R = 6371; // Earth's radius in kilometers

  // Convert degrees to radians
  const lat1Rad = toRadians(coord1.lat);
  const lat2Rad = toRadians(coord2.lat);
  const deltaLatRad = toRadians(coord2.lat - coord1.lat);
  const deltaLonRad = toRadians(coord2.lon - coord1.lon);

  // Haversine formula
  const a = Math.sin(deltaLatRad / 2) * Math.sin(deltaLatRad / 2) +
    Math.cos(lat1Rad) * Math.cos(lat2Rad) *
    Math.sin(deltaLonRad / 2) * Math.sin(deltaLonRad / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const distance = R * c; // Distance in kilometers
  return Math.round(distance * 100) / 100; // Round to 2 decimal places
}

/**
 * Helper function to convert degrees to radians
 */
function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Check if a delivery address is within the delivery radius
 * @param deliveryAddress Customer's delivery address
 * @param businessAddress Business address
 * @param radiusKm Maximum delivery radius in kilometers
 * @returns Result with distance and whether address is within radius
 */
export async function isWithinDeliveryRadius(
  deliveryAddress: string,
  businessAddress: string,
  radiusKm: number
): Promise<{
  success: boolean;
  withinRadius?: boolean;
  distance?: number;
  error?: string;
  isServerError?: boolean; // Distinguish server vs client errors
}> {
  try {
    // Geocode business address first (will be cached for subsequent requests)
    const businessResult = await geocodeAddress(businessAddress, true);

    if (!businessResult.success) {
      // Business address geocoding failure is a SERVER error, not client error
      console.error("Business address geocoding failed:", businessResult.error);
      return {
        success: false,
        error: "Configuration du système incorrecte. Veuillez contacter le support.",
        isServerError: true
      };
    }

    // Then geocode delivery address (respects rate limiting due to await)
    const deliveryResult = await geocodeAddress(deliveryAddress, false);

    if (!deliveryResult.success) {
      // Delivery address geocoding failure is a CLIENT error
      return {
        success: false,
        error: `Adresse de livraison invalide: ${deliveryResult.error}`,
        isServerError: false
      };
    }

    // Calculate distance
    const distance = calculateDistance(
      deliveryResult.coordinates!,
      businessResult.coordinates!
    );

    const withinRadius = distance <= radiusKm;

    return {
      success: true,
      withinRadius,
      distance,
      isServerError: false
    };
  } catch (error: any) {
    console.error("Delivery radius check error:", error);
    return {
      success: false,
      error: error.message || "Erreur lors de la vérification du rayon de livraison",
      isServerError: true
    };
  }
}
