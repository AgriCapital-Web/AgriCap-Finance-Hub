import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatCurrencyCIV, formatDateShort, formatDateFR } from './formatCurrency';

const PDF_CONFIG = {
  company: {
    name: 'AGRICAPITAL SARL',
    tagline: 'Accompagnement agricole et services intégrés',
    capital: '5 000 000 F CFA',
    address: 'Gonaté, Daloa – Côte d\'Ivoire',
    rccm: 'CI-DAL-01-2025-B12-13435',
    bank: 'Baobab CI',
    phone: '+225 07 59 56 60 87',
    email: 'contact@agricapital.ci',
    website: 'www.agricapital.ci',
  },
  colors: {
    primary: [27, 122, 61] as [number, number, number],
  },
};

function addHeader(doc: jsPDF) {
  const pageWidth = doc.internal.pageSize.width;
  
  // Bande verte en haut
  doc.setFillColor(...PDF_CONFIG.colors.primary);
  doc.rect(0, 0, pageWidth, 8, 'F');
  
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PDF_CONFIG.colors.primary);
  doc.text(PDF_CONFIG.company.name, pageWidth / 2, 20, { align: 'center' });
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(100, 100, 100);
  doc.text(PDF_CONFIG.company.tagline, pageWidth / 2, 27, { align: 'center' });
  
  // Ligne de séparation
  doc.setDrawColor(...PDF_CONFIG.colors.primary);
  doc.setLineWidth(0.8);
  doc.line(20, 32, pageWidth - 20, 32);
}

function addFooter(doc: jsPDF, pageNumber: number, totalPages: number) {
  const pageHeight = doc.internal.pageSize.height;
  const pageWidth = doc.internal.pageSize.width;
  
  // Ligne de séparation
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.5);
  doc.line(20, pageHeight - 38, pageWidth - 20, pageHeight - 38);
  
  doc.setFontSize(7);
  doc.setTextColor(100, 100, 100);
  doc.setFont('helvetica', 'normal');
  
  doc.text(`${PDF_CONFIG.company.name} – Capital social : ${PDF_CONFIG.company.capital}`, pageWidth / 2, pageHeight - 32, { align: 'center' });
  doc.text(PDF_CONFIG.company.address, pageWidth / 2, pageHeight - 27, { align: 'center' });
  doc.text(`RCCM : ${PDF_CONFIG.company.rccm} | Banque : ${PDF_CONFIG.company.bank}`, pageWidth / 2, pageHeight - 22, { align: 'center' });
  doc.text(`Tél : ${PDF_CONFIG.company.phone} | ${PDF_CONFIG.company.email} | ${PDF_CONFIG.company.website}`, pageWidth / 2, pageHeight - 17, { align: 'center' });
  
  // Page
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text(`Page ${pageNumber} / ${totalPages}`, pageWidth - 25, pageHeight - 10, { align: 'right' });
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text(`Généré le ${formatDateFR(new Date())}`, 20, pageHeight - 10);
}

export function exportTransactionsPDF(transactions: any[], title: string, period: string) {
  const doc = new jsPDF();
  
  addHeader(doc);
  
  // Titre
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text(title.toUpperCase(), doc.internal.pageSize.width / 2, 45, { align: 'center' });
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Période : ${period}`, doc.internal.pageSize.width / 2, 52, { align: 'center' });
  
  // Résumé
  const totalIncome = transactions.filter(t => t.transaction_type === 'income').reduce((sum, t) => sum + Number(t.amount), 0);
  const totalExpenses = transactions.filter(t => t.transaction_type === 'expense').reduce((sum, t) => sum + Number(t.amount), 0);
  
  doc.setFillColor(245, 250, 245);
  doc.roundedRect(20, 58, doc.internal.pageSize.width - 40, 20, 2, 2, 'F');
  
  doc.setFontSize(10);
  doc.text(`Total Entrées: ${formatCurrencyCIV(totalIncome)}`, 30, 70);
  doc.text(`Total Sorties: ${formatCurrencyCIV(totalExpenses)}`, 90, 70);
  doc.setFont('helvetica', 'bold');
  doc.text(`Solde: ${formatCurrencyCIV(totalIncome - totalExpenses)}`, 155, 70);
  
  // Tableau
  autoTable(doc, {
    startY: 85,
    head: [['Date', 'Type', 'Description', 'Montant', 'Statut']],
    body: transactions.map(t => [
      formatDateShort(t.date),
      t.transaction_type === 'income' ? 'Entrée' : 'Sortie',
      t.description || '-',
      formatCurrencyCIV(Number(t.amount)),
      t.validation_status || 'draft',
    ]),
    headStyles: {
      fillColor: PDF_CONFIG.colors.primary,
      textColor: 255,
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [245, 250, 245],
    },
    margin: { bottom: 45 },
    didDrawPage: (data) => {
      addFooter(doc, data.pageNumber, doc.getNumberOfPages());
    },
  });
  
  doc.save(`${title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
}

export function exportFinancialReportPDF(data: {
  title: string;
  period: string;
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  byCategory: { name: string; value: number }[];
}) {
  const doc = new jsPDF();
  
  addHeader(doc);
  
  // Title
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text(data.title, 20, 45);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Période : ${data.period}`, 20, 52);
  
  // Summary box
  doc.setFillColor(27, 122, 61);
  doc.rect(20, 60, doc.internal.pageSize.width - 40, 30, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.text('RÉSUMÉ FINANCIER', doc.internal.pageSize.width / 2, 70, { align: 'center' });
  
  doc.setFontSize(10);
  const colWidth = (doc.internal.pageSize.width - 40) / 3;
  doc.text(`Entrées: ${formatCurrencyCIV(data.totalIncome)}`, 20 + colWidth / 2, 82, { align: 'center' });
  doc.text(`Sorties: ${formatCurrencyCIV(data.totalExpenses)}`, 20 + colWidth * 1.5, 82, { align: 'center' });
  doc.text(`Solde: ${formatCurrencyCIV(data.balance)}`, 20 + colWidth * 2.5, 82, { align: 'center' });
  
  // Category breakdown
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Répartition des Dépenses', 20, 105);
  
  autoTable(doc, {
    startY: 110,
    head: [['Catégorie', 'Montant', '% du Total']],
    body: data.byCategory.map(cat => [
      cat.name,
      formatCurrencyCIV(cat.value),
      `${((cat.value / data.totalExpenses) * 100).toFixed(1)}%`,
    ]),
    headStyles: {
      fillColor: [27, 122, 61],
      textColor: 255,
    },
    margin: { bottom: 40 },
    didDrawPage: (pageData) => {
      addFooter(doc, pageData.pageNumber, doc.getNumberOfPages());
    },
  });
  
  doc.save(`Rapport_Financier_${new Date().toISOString().split('T')[0]}.pdf`);
}

export function exportBalanceSheetPDF(data: {
  period: string;
  assets: { label: string; amount: number }[];
  liabilities: { label: string; amount: number }[];
}) {
  const doc = new jsPDF();
  
  addHeader(doc);
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('BILAN COMPTABLE', doc.internal.pageSize.width / 2, 45, { align: 'center' });
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Période : ${data.period}`, doc.internal.pageSize.width / 2, 52, { align: 'center' });
  
  const midX = doc.internal.pageSize.width / 2;
  
  // Assets
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(27, 122, 61);
  doc.text('ACTIF', 30, 70);
  
  let yPos = 80;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);
  
  data.assets.forEach(item => {
    doc.text(item.label, 25, yPos);
    doc.text(formatCurrencyCIV(item.amount), midX - 10, yPos, { align: 'right' });
    yPos += 8;
  });
  
  const totalAssets = data.assets.reduce((sum, a) => sum + a.amount, 0);
  doc.setFont('helvetica', 'bold');
  doc.text('TOTAL ACTIF', 25, yPos + 5);
  doc.text(formatCurrencyCIV(totalAssets), midX - 10, yPos + 5, { align: 'right' });
  
  // Liabilities
  yPos = 70;
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(27, 122, 61);
  doc.text('PASSIF', midX + 20, yPos);
  
  yPos = 80;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);
  
  data.liabilities.forEach(item => {
    doc.text(item.label, midX + 15, yPos);
    doc.text(formatCurrencyCIV(item.amount), doc.internal.pageSize.width - 25, yPos, { align: 'right' });
    yPos += 8;
  });
  
  const totalLiabilities = data.liabilities.reduce((sum, l) => sum + l.amount, 0);
  doc.setFont('helvetica', 'bold');
  doc.text('TOTAL PASSIF', midX + 15, yPos + 5);
  doc.text(formatCurrencyCIV(totalLiabilities), doc.internal.pageSize.width - 25, yPos + 5, { align: 'right' });
  
  addFooter(doc, 1, 1);
  
  doc.save(`Bilan_Comptable_${new Date().toISOString().split('T')[0]}.pdf`);
}
