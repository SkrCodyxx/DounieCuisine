/// <reference types="vite/client" />

// Square Web Payments SDK
declare global {
  interface Window {
    Square?: {
      payments: (appId: string, locationId: string) => {
        card: () => Promise<{
          attach: (selector: string) => Promise<void>;
          tokenize: () => Promise<{ status: string; token?: string; errors?: any[] }>;
        }>;
      };
    };
  }
}

export {};
