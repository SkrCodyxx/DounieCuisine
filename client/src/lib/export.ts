import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
// SUPPRIMÉ : import * as XLSX from "xlsx"; - DÉPENDANCE VULNÉRABLE
// Remplacé par une alternative côté serveur avec validation stricte

export interface ExportColumn {
  header: string;
  field: string;
  width?: number;
}

export interface ExportOptions {
  title: string;
  columns: ExportColumn[];
  data: any[];
  fileName: string;
  companyInfo?: {
    name: string;
    address?: string;
    phone?: string;
    email?: string;
  };
}

// NOUVELLE INTERFACE POUR EXPORT SÉCURISÉ CÔTÉ SERVEUR
export interface SecureExportRequest {
  type: 'excel' | 'csv';
  title: string;
  columns: ExportColumn[];
  data: any[];
  fileName: string;
  maxRows?: number; // Limite de sécurité
}

/**
 * Export data to PDF with professional formatting
 */
export function exportToPDF(options: ExportOptions) {
  const { title, columns, data, fileName, companyInfo } = options;
  
  const doc = new jsPDF();
  
  // Add header information
  let startY = 20;
  
  if (companyInfo) {
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text(companyInfo.name, 14, startY);
    startY += 10;
    
    if (companyInfo.address) {
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(companyInfo.address, 14, startY);
      startY += 6;
    }
    
    if (companyInfo.phone) {
      doc.text(`Tel: ${companyInfo.phone}`, 14, startY);
      startY += 6;
    }
    
    if (companyInfo.email) {
      doc.text(`Email: ${companyInfo.email}`, 14, startY);
      startY += 10;
    }
  }
  
  // Add title
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text(title, 14, startY);
  startY += 10;
  
  // Add generation date
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, startY);
  startY += 15;
  
  // Prepare data for table
  const headers = columns.map(col => col.header);
  const rows = data.map(row =>
    columns.map(col => {
      const value = row[col.field];
      if (value === null || value === undefined) return "";
      if (value instanceof Date) return value.toLocaleDateString();
      if (typeof value === "boolean") return value ? "Yes" : "No";
      return String(value);
    })
  );
  
  // Add table using autoTable
  autoTable(doc, {
    head: [headers],
    body: rows,
    startY: startY,
    headStyles: {
      fillColor: [230, 93, 4], // Orange color
      textColor: [255, 255, 255],
      fontStyle: "bold",
      halign: "left",
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245],
    },
    margin: { top: startY, left: 14, right: 14 },
    styles: {
      fontSize: 9,
      cellPadding: 3,
    },
  });
  
  // Save PDF
  doc.save(`${fileName}.pdf`);
}

/**
 * Export data to Excel via serveur sécurisé (REMPLACE xlsx vulnérable)
 * Utilise une API côté serveur avec validation stricte
 */
export async function exportToExcel(options: ExportOptions): Promise<boolean> {
  const { title, columns, data, fileName } = options;
  
  try {
    // Validation côté client AVANT envoi au serveur
    if (!title || !columns || !data || !fileName) {
      throw new Error("Paramètres d'export manquants");
    }
    
    if (data.length > 10000) { // Limite de sécurité
      throw new Error("Trop de données à exporter (max 10000 lignes)");
    }

    // Préparer la requête sécurisée
    const exportRequest: SecureExportRequest = {
      type: 'excel',
      title: title.slice(0, 100), // Limite de sécurité 
      columns: columns.map(col => ({
        header: String(col.header).slice(0, 50),
        field: String(col.field).slice(0, 50),
        width: Math.min(col.width || 15, 50)
      })),
      data: data.slice(0, 10000), // Limite stricte
      fileName: fileName.replace(/[^a-zA-Z0-9_-]/g, ''), // Sanitize
      maxRows: 10000
    };

    // Appel API sécurisé côté serveur 
    const response = await fetch('/api/admin/export/excel', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}` 
      },
      body: JSON.stringify(exportRequest)
    });

    if (!response.ok) {
      throw new Error(`Erreur export: ${response.statusText}`);
    }

    // Télécharger le fichier généré côté serveur
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = `${fileName}.xlsx`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    
    return true;
  } catch (error) {
    console.error('[EXPORT ERROR]', error);
    alert(`Erreur lors de l'export: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    return false;
  }
}

/**
 * Export data to CSV (alternative sécurisée à Excel)
 */
export function exportToCSV(options: ExportOptions) {
  const { title, columns, data, fileName } = options;
  
  // Validation de sécurité
  if (data.length > 50000) {
    alert("Trop de données à exporter en CSV (max 50000 lignes)");
    return;
  }
  
  try {
    // Headers
    const headers = columns.map(col => `"${String(col.header).replace(/"/g, '""')}"`);
    
    // Data rows avec échappement CSV sécurisé
    const rows = data.slice(0, 50000).map(row =>
      columns.map(col => {
        const value = row[col.field];
        if (value === null || value === undefined) return '""';
        if (value instanceof Date) return `"${value.toLocaleDateString()}"`;
        if (typeof value === "boolean") return `"${value ? "Oui" : "Non"}"`;
        // Échappement sécurisé des guillemets et retours à la ligne
        const escaped = String(value).replace(/"/g, '""').replace(/\r?\n/g, ' ');
        return `"${escaped}"`;
      }).join(',')
    );
    
    // Création du contenu CSV
    const csvContent = [
      `"${title}"`,
      `"Généré: ${new Date().toLocaleString()}"`,
      '', // Ligne vide
      headers.join(','),
      ...rows
    ].join('\n');
    
    // Téléchargement sécurisé
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = `${fileName.replace(/[^a-zA-Z0-9_-]/g, '')}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    
  } catch (error) {
    console.error('[CSV EXPORT ERROR]', error);
    alert('Erreur lors de l\'export CSV');
  }
}

/**
 * Quick export helper - exports in all formats SÉCURISÉS
 */
export function exportDataAllFormats(options: ExportOptions) {
  return {
    pdf: () => exportToPDF(options),
    excel: () => exportToExcel(options), // Maintenant async et sécurisé
    csv: () => exportToCSV(options), // Alternative sécurisée
  };
}

// SUPPRIMÉ : Anciennes fonctions utilisant xlsx vulnérable