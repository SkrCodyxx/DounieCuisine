import express, { type Express } from "express";
import fs from "fs";
import path from "path";

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

export function serveStatic(app: Express) {
  const distPath = path.resolve(process.cwd(), "dist", "public");

  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  // Servir les assets avec cache approprié
  app.use(express.static(distPath, {
    setHeaders: (res, path) => {
      // Assets avec hash: cache long
      if (path.match(/\.(js|css|woff2?|ttf|eot|svg|png|jpg|jpeg|gif|webp)$/)) {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      }
      // index.html: pas de cache pour forcer la revalidation
      if (path.endsWith('index.html')) {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
      }
    }
  }));

  // fall through to index.html ONLY for non-API routes (SPA routing)
  app.use((req, res, next) => {
    // Si c'est une route API qui n'a pas été trouvée, renvoyer 404
    if (req.path.startsWith("/api/")) {
      return res.status(404).json({ message: "API route not found" });
    }
    // Sinon, renvoyer index.html pour le SPA routing avec headers anti-cache
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
