/**
 * Generate a unique DC-ID in the format: DC-XXXXXX
 * Where XXXXXX is a random alphanumeric string
 */
export function generateDCID(prefix: string = "DC", length: number = 8): string {
  const characters = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Exclude ambiguous characters
  let result = `${prefix}-`;
  
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  
  return result;
}

/**
 * Validate DC-ID format
 */
export function validateDCID(dcid: string): boolean {
  const pattern = /^DC-[A-Z0-9]{6,12}$/;
  return pattern.test(dcid);
}

/**
 * Generate a unique customer DC-ID with 7 digits: DC-1234567
 */
export function generateCustomerDCID(): string {
  // Generate 7 random digits
  const digits = Math.floor(1000000 + Math.random() * 9000000); // 1000000 to 9999999
  return `DC-${digits}`;
}

/**
 * Generate a unique order DC-ID
 */
export function generateOrderDCID(): string {
  return generateDCID("DC", 8);
}

/**
 * Generate a unique receipt DC-ID
 */
export function generateReceiptDCID(): string {
  return generateDCID("DC", 8);
}

/**
 * Generate a unique email template DC-ID
 */
export function generateEmailTemplateDCID(): string {
  return generateDCID("DC", 8);
}

/**
 * Generate a unique hero slide DC-ID
 */
export function generateHeroSlideDCID(): string {
  return generateDCID("DC", 8);
}
