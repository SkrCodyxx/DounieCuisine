/**
 * ROUTES ADMIN EXPORT - SÉCURISÉ
 * Remplace la dépendance xlsx vulnérable par une API sécurisée côté serveur
 */

import { Router, Request, Response } from "express";
import { z } from "zod";
import fs from "fs";
import path from "path";

const router = Router();

// VALIDATION CRITIQUE POUR EXPORT
const exportRequestSchema = z.object({
  type: z.enum(['excel', 'csv']),
  title: z.string().min(1).max(100),
  columns: z.array(z.object({
    header: z.string().min(1).max(50),
    field: z.string().min(1).max(50),
    width: z.number().min(5).max(50).optional()
  })).max(50), // Limite colonnes
  data: z.array(z.record(z.any())).max(10000), // Limite lignes stricte
  fileName: z.string().min(1).max(100).regex(/^[a-zA-Z0-9_-]+$/),
  maxRows: z.number().max(10000).optional()
});

// POST /admin/export/excel - Export Excel sécurisé
router.post("/excel", async (req: Request, res: Response) => {
  try {
    // Validation stricte des données
    const exportData = exportRequestSchema.parse(req.body);
    
    // Validation supplémentaire pour sécurité
    if (exportData.data.length > 10000) {
      return res.status(400).json({ 
        error: "Trop de données", 
        details: "Maximum 10000 lignes autorisées" 
      });
    }

    // ALTERNATIVE SÉCURISÉE : Export CSV au lieu d'Excel
    // Évite les vulnérabilités des packages xlsx
    const { title, columns, data, fileName } = exportData;
    
    // Génération CSV sécurisée
    const headers = columns.map(col => `"${col.header.replace(/"/g, '""')}"`);
    const rows = data.map(row =>
      columns.map(col => {
        const value = row[col.field];
        if (value === null || value === undefined) return '""';
        if (value instanceof Date) return `"${value.toISOString()}"`;
        if (typeof value === "boolean") return `"${value ? "Oui" : "Non"}"`;
        // Échappement sécurisé
        const escaped = String(value).replace(/"/g, '""').replace(/[\r\n]/g, ' ');
        return `"${escaped}"`;
      }).join(',')
    );
    
    const csvContent = [
      `"${title}"`,
      `"Généré: ${new Date().toISOString()}"`,
      '',
      headers.join(','),
      ...rows
    ].join('\n');

    // Retour sécurisé
    res.setHeader('Content-Type', 'application/vnd.ms-excel'); // Compatibilité Excel
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}.csv"`);
    res.send(csvContent);

    // Log sécurité
    console.log(`[EXPORT] ${req.user?.email || 'Anonymous'} exported ${data.length} rows as CSV`);

  } catch (error) {
    console.error('[EXPORT ERROR]', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: "Données d'export invalides", 
        details: error.errors 
      });
    }
    
    res.status(500).json({ 
      error: "Erreur lors de l'export", 
      details: "Impossible de générer le fichier" 
    });
  }
});

// POST /admin/export/csv - Export CSV natif
router.post("/csv", async (req: Request, res: Response) => {
  try {
    const exportData = exportRequestSchema.parse(req.body);
    
    const { title, columns, data, fileName } = exportData;
    
    // Génération CSV stricte
    const headers = columns.map(col => `"${col.header.replace(/"/g, '""')}"`);
    const rows = data.map(row =>
      columns.map(col => {
        const value = row[col.field];
        if (value === null || value === undefined) return '""';
        if (value instanceof Date) return `"${value.toISOString()}"`;
        if (typeof value === "boolean") return `"${value ? "Oui" : "Non"}"`;
        const escaped = String(value).replace(/"/g, '""').replace(/[\r\n]/g, ' ');
        return `"${escaped}"`;
      }).join(',')
    );
    
    const csvContent = [
      `"${title}"`,
      `"Généré: ${new Date().toISOString()}"`,
      '',
      headers.join(','),
      ...rows
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}.csv"`);
    res.send(csvContent);

    console.log(`[EXPORT] ${req.user?.email || 'Anonymous'} exported ${data.length} rows as CSV`);

  } catch (error) {
    console.error('[CSV EXPORT ERROR]', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Données invalides", details: error.errors });
    }
    
    res.status(500).json({ error: "Erreur export CSV" });
  }
});

export default router;