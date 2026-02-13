import "express-session";

declare module "express-session" {
  interface SessionData {
    adminUserId?: number;
    adminEmail?: string;
    customerId?: number;
    lastActivity?: string;
    createdAt?: string;
    lastRotation?: string;
    userType?: 'admin' | 'customer';
  }
}
