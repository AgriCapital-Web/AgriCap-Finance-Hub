import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatCurrency, formatDate } from './mockData';

const PDF_HEADER = {
  company: 'AGRICAPITAL SARL',
  tagline: 'Accompagnement agricole et services intégrés',
};

const PDF_FOOTER = {
  line1: 'AGRICAPITAL SARL – Capital social : 5 000 000 F CFA',
  line2: 'Gonaté, Daloa – Côte d\'Ivoire',
  line3: 'RCCM : CI-DAL-01-2025-B12-13435 | Banque : Baobab CI',
  line4: 'Tél : +225 07 59 56 60 87 | contact@agricapital.ci | www.agricapital.ci',
};

function addHeader(doc: jsPDF) {
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(27, 122, 61); // Primary green
  doc.text(PDF_HEADER.company, doc.internal.pageSize.width / 2, 20, { align: 'center' });
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text(PDF_HEADER.tagline, doc.internal.pageSize.width / 2, 28, { align: 'center' });
  
  // Line separator
  doc.setDrawColor(27, 122, 61);
  doc.setLineWidth(0.5);
  doc.line(20, 32, doc.internal.pageSize.width - 20, 32);
}

function addFooter(doc: jsPDF, pageNumber: number, totalPages: number) {
  const pageHeight = doc.internal.pageSize.height;
  const pageWidth = doc.internal.pageSize.width;
  
  // Line separator
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(20, pageHeight - 35, pageWidth - 20, pageHeight - 35);
  
  doc.setFontSize(7);
  doc.setTextColor(100, 100, 100);
  doc.text(PDF_FOOTER.line1, pageWidth / 2, pageHeight - 28, { align: 'center' });
  doc.text(PDF_FOOTER.line2, pageWidth / 2, pageHeight - 23, { align: 'center' });
  doc.text(PDF_FOOTER.line3, pageWidth / 2, pageHeight - 18, { align: 'center' });
  doc.text(PDF_FOOTER.line4, pageWidth / 2, pageHeight - 13, { align: 'center' });
  
  // Page number
  doc.text(`Page ${pageNumber} / ${totalPages}`, pageWidth - 25, pageHeight - 8, { align: 'right' });
}

export function exportTransactionsPDF(transactions: any[], title: string, period: string) {
  const doc = new jsPDF();
  
  addHeader(doc);
  
  // Title
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text(title, 20, 45);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Période : ${period}`, 20, 52);
  doc.text(`Généré le : ${new Date().toLocaleDateString('fr-FR')}`, 20, 58);
  
  // Summary
  const totalIncome = transactions.filter(t => t.transaction_type === 'income').reduce((sum, t) => sum + Number(t.amount), 0);
  const totalExpenses = transactions.filter(t => t.transaction_type === 'expense').reduce((sum, t) => sum + Number(t.amount), 0);
  
  doc.setFillColor(245, 245, 245);
  doc.rect(20, 65, doc.internal.pageSize.width - 40, 20, 'F');
  
  doc.setFontSize(10);
  doc.text(`Total Entrées: ${formatCurrency(totalIncome)}`, 25, 77);
  doc.text(`Total Sorties: ${formatCurrency(totalExpenses)}`, 100, 77);
  doc.setFont('helvetica', 'bold');
  doc.text(`Solde: ${formatCurrency(totalIncome - totalExpenses)}`, 170, 77);
  
  // Table
  autoTable(doc, {
    startY: 90,
    head: [['Date', 'Type', 'Description', 'Montant', 'Statut']],
    body: transactions.map(t => [
      formatDate(t.date),
      t.transaction_type === 'income' ? 'Entrée' : 'Sortie',
      t.description || '-',
      formatCurrency(t.amount),
      t.validation_status || 'draft',
    ]),
    headStyles: {
      fillColor: [27, 122, 61],
      textColor: 255,
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [245, 250, 245],
    },
    margin: { bottom: 40 },
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
  doc.text(`Entrées: ${formatCurrency(data.totalIncome)}`, 20 + colWidth / 2, 82, { align: 'center' });
  doc.text(`Sorties: ${formatCurrency(data.totalExpenses)}`, 20 + colWidth * 1.5, 82, { align: 'center' });
  doc.text(`Solde: ${formatCurrency(data.balance)}`, 20 + colWidth * 2.5, 82, { align: 'center' });
  
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
      formatCurrency(cat.value),
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
    doc.text(formatCurrency(item.amount), midX - 10, yPos, { align: 'right' });
    yPos += 8;
  });
  
  const totalAssets = data.assets.reduce((sum, a) => sum + a.amount, 0);
  doc.setFont('helvetica', 'bold');
  doc.text('TOTAL ACTIF', 25, yPos + 5);
  doc.text(formatCurrency(totalAssets), midX - 10, yPos + 5, { align: 'right' });
  
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
    doc.text(formatCurrency(item.amount), doc.internal.pageSize.width - 25, yPos, { align: 'right' });
    yPos += 8;
  });
  
  const totalLiabilities = data.liabilities.reduce((sum, l) => sum + l.amount, 0);
  doc.setFont('helvetica', 'bold');
  doc.text('TOTAL PASSIF', midX + 15, yPos + 5);
  doc.text(formatCurrency(totalLiabilities), doc.internal.pageSize.width - 25, yPos + 5, { align: 'right' });
  
  addFooter(doc, 1, 1);
  
  doc.save(`Bilan_Comptable_${new Date().toISOString().split('T')[0]}.pdf`);
}
