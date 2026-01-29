import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatCurrencyCIV, formatDateFR, formatDateShort, formatPercentage, amountToWords } from './formatCurrency';

// ================== CONFIGURATION ==================

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
    secondary: [59, 130, 246] as [number, number, number],
    dark: [31, 41, 55] as [number, number, number],
    light: [249, 250, 251] as [number, number, number],
    success: [16, 185, 129] as [number, number, number],
    danger: [239, 68, 68] as [number, number, number],
    warning: [245, 158, 11] as [number, number, number],
  },
  fonts: {
    title: 18,
    subtitle: 14,
    heading: 12,
    body: 10,
    small: 8,
    tiny: 7,
  },
};

// ================== HELPERS ==================

function addProfessionalHeader(doc: jsPDF) {
  const pageWidth = doc.internal.pageSize.width;
  
  // Bande de couleur en haut
  doc.setFillColor(...PDF_CONFIG.colors.primary);
  doc.rect(0, 0, pageWidth, 8, 'F');
  
  // Logo / Nom de l'entreprise
  doc.setFontSize(PDF_CONFIG.fonts.title);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PDF_CONFIG.colors.primary);
  doc.text(PDF_CONFIG.company.name, pageWidth / 2, 20, { align: 'center' });
  
  // Tagline
  doc.setFontSize(PDF_CONFIG.fonts.body);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(100, 100, 100);
  doc.text(PDF_CONFIG.company.tagline, pageWidth / 2, 27, { align: 'center' });
  
  // Ligne de séparation élégante
  doc.setDrawColor(...PDF_CONFIG.colors.primary);
  doc.setLineWidth(0.8);
  doc.line(20, 32, pageWidth - 20, 32);
  
  // Ligne fine en dessous
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(20, 34, pageWidth - 20, 34);
}

function addProfessionalFooter(doc: jsPDF, pageNumber: number, totalPages: number) {
  const pageHeight = doc.internal.pageSize.height;
  const pageWidth = doc.internal.pageSize.width;
  
  // Ligne de séparation
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.5);
  doc.line(20, pageHeight - 38, pageWidth - 20, pageHeight - 38);
  
  // Informations de l'entreprise
  doc.setFontSize(PDF_CONFIG.fonts.tiny);
  doc.setTextColor(100, 100, 100);
  doc.setFont('helvetica', 'normal');
  
  const footerLines = [
    `${PDF_CONFIG.company.name} – Capital social : ${PDF_CONFIG.company.capital}`,
    PDF_CONFIG.company.address,
    `RCCM : ${PDF_CONFIG.company.rccm} | Banque : ${PDF_CONFIG.company.bank}`,
    `Tél : ${PDF_CONFIG.company.phone} | ${PDF_CONFIG.company.email} | ${PDF_CONFIG.company.website}`,
  ];
  
  let yPos = pageHeight - 32;
  footerLines.forEach((line) => {
    doc.text(line, pageWidth / 2, yPos, { align: 'center' });
    yPos += 5;
  });
  
  // Numéro de page avec style
  doc.setFontSize(PDF_CONFIG.fonts.small);
  doc.setFont('helvetica', 'bold');
  doc.text(`Page ${pageNumber} / ${totalPages}`, pageWidth - 25, pageHeight - 10, { align: 'right' });
  
  // Date de génération
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(PDF_CONFIG.fonts.tiny);
  doc.text(`Généré le ${formatDateFR(new Date())}`, 20, pageHeight - 10);
}

function addDocumentTitle(doc: jsPDF, title: string, subtitle?: string, yStart: number = 45) {
  const pageWidth = doc.internal.pageSize.width;
  
  // Titre principal
  doc.setFontSize(PDF_CONFIG.fonts.subtitle);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PDF_CONFIG.colors.dark);
  doc.text(title.toUpperCase(), pageWidth / 2, yStart, { align: 'center' });
  
  if (subtitle) {
    doc.setFontSize(PDF_CONFIG.fonts.body);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text(subtitle, pageWidth / 2, yStart + 7, { align: 'center' });
    return yStart + 15;
  }
  
  return yStart + 10;
}

function addInfoBox(doc: jsPDF, data: { label: string; value: string }[], y: number, color: [number, number, number] = PDF_CONFIG.colors.light) {
  const pageWidth = doc.internal.pageSize.width;
  const boxWidth = pageWidth - 40;
  const boxHeight = 25;
  
  doc.setFillColor(...color);
  doc.roundedRect(20, y, boxWidth, boxHeight, 3, 3, 'F');
  
  const colWidth = boxWidth / data.length;
  
  data.forEach((item, index) => {
    const x = 20 + colWidth * index + colWidth / 2;
    
    doc.setFontSize(PDF_CONFIG.fonts.small);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text(item.label, x, y + 10, { align: 'center' });
    
    doc.setFontSize(PDF_CONFIG.fonts.body);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...PDF_CONFIG.colors.dark);
    doc.text(item.value, x, y + 19, { align: 'center' });
  });
  
  return y + boxHeight + 10;
}

function addSummaryCard(doc: jsPDF, title: string, items: { label: string; value: string; color?: [number, number, number] }[], y: number) {
  const pageWidth = doc.internal.pageSize.width;
  
  // Titre de la section
  doc.setFillColor(...PDF_CONFIG.colors.primary);
  doc.roundedRect(20, y, pageWidth - 40, 8, 2, 2, 'F');
  
  doc.setFontSize(PDF_CONFIG.fonts.body);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text(title.toUpperCase(), pageWidth / 2, y + 6, { align: 'center' });
  
  y += 15;
  
  // Items
  items.forEach((item) => {
    doc.setFontSize(PDF_CONFIG.fonts.body);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...PDF_CONFIG.colors.dark);
    doc.text(item.label, 25, y);
    
    doc.setFont('helvetica', 'bold');
    if (item.color) {
      doc.setTextColor(...item.color);
    }
    doc.text(item.value, pageWidth - 25, y, { align: 'right' });
    
    y += 8;
  });
  
  return y + 5;
}

// ================== EXPORTS ==================

export function exportJournalComptablePDF(transactions: any[], period: string) {
  const doc = new jsPDF();
  
  addProfessionalHeader(doc);
  let y = addDocumentTitle(doc, 'Journal Comptable', `Période : ${period}`);
  
  const totalIncome = transactions.filter(t => t.transaction_type === 'income').reduce((sum, t) => sum + Number(t.amount), 0);
  const totalExpenses = transactions.filter(t => t.transaction_type === 'expense').reduce((sum, t) => sum + Number(t.amount), 0);
  
  y = addInfoBox(doc, [
    { label: 'Total Entrées', value: formatCurrencyCIV(totalIncome) },
    { label: 'Total Sorties', value: formatCurrencyCIV(totalExpenses) },
    { label: 'Solde', value: formatCurrencyCIV(totalIncome - totalExpenses) },
  ], y);
  
  autoTable(doc, {
    startY: y,
    head: [['Date', 'Référence', 'Libellé', 'Débit', 'Crédit', 'Solde']],
    body: (() => {
      let runningBalance = 0;
      return transactions.map(t => {
        const amount = Number(t.amount);
        if (t.transaction_type === 'income') {
          runningBalance += amount;
        } else {
          runningBalance -= amount;
        }
        return [
          formatDateShort(t.date),
          t.reference || '-',
          t.description || (t.transaction_type === 'income' ? 'Entrée' : 'Sortie'),
          t.transaction_type === 'expense' ? formatCurrencyCIV(amount) : '-',
          t.transaction_type === 'income' ? formatCurrencyCIV(amount) : '-',
          formatCurrencyCIV(runningBalance),
        ];
      });
    })(),
    headStyles: {
      fillColor: PDF_CONFIG.colors.primary,
      textColor: 255,
      fontStyle: 'bold',
      fontSize: 9,
    },
    bodyStyles: {
      fontSize: 8,
    },
    alternateRowStyles: {
      fillColor: [245, 250, 245],
    },
    columnStyles: {
      0: { cellWidth: 25 },
      1: { cellWidth: 25 },
      2: { cellWidth: 60 },
      3: { halign: 'right', cellWidth: 28 },
      4: { halign: 'right', cellWidth: 28 },
      5: { halign: 'right', cellWidth: 28, fontStyle: 'bold' },
    },
    margin: { bottom: 45 },
    didDrawPage: (data) => {
      addProfessionalFooter(doc, data.pageNumber, doc.getNumberOfPages());
    },
  });
  
  doc.save(`Journal_Comptable_${new Date().toISOString().split('T')[0]}.pdf`);
}

export function exportGrandLivrePDF(transactions: any[], accounts: { id: string; name: string; number: string }[], period: string) {
  const doc = new jsPDF();
  
  addProfessionalHeader(doc);
  let y = addDocumentTitle(doc, 'Grand Livre', `Période : ${period}`);
  
  // Grouper par compte
  const groupedByAccount = transactions.reduce((acc, t) => {
    const accountId = t.account_id || 'non-classé';
    if (!acc[accountId]) {
      acc[accountId] = [];
    }
    acc[accountId].push(t);
    return acc;
  }, {} as Record<string, any[]>);
  
  Object.entries(groupedByAccount).forEach(([accountId, txs]) => {
    const account = accounts.find(a => a.id === accountId);
    const accountName = account ? `${account.number} - ${account.name}` : 'Compte non classé';
    
    doc.setFontSize(PDF_CONFIG.fonts.heading);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...PDF_CONFIG.colors.primary);
    doc.text(accountName, 20, y);
    y += 5;
    
    autoTable(doc, {
      startY: y,
      head: [['Date', 'Libellé', 'Débit', 'Crédit']],
      body: (txs as any[]).map(t => [
        formatDateShort(t.date),
        t.description || '-',
        t.transaction_type === 'expense' ? formatCurrencyCIV(Number(t.amount)) : '-',
        t.transaction_type === 'income' ? formatCurrencyCIV(Number(t.amount)) : '-',
      ]),
      headStyles: {
        fillColor: PDF_CONFIG.colors.secondary,
        textColor: 255,
        fontSize: 8,
      },
      bodyStyles: { fontSize: 8 },
      margin: { bottom: 45 },
      didDrawPage: (data) => {
        addProfessionalFooter(doc, data.pageNumber, doc.getNumberOfPages());
      },
    });
    
    y = (doc as any).lastAutoTable.finalY + 15;
    
    if (y > doc.internal.pageSize.height - 60) {
      doc.addPage();
      addProfessionalHeader(doc);
      y = 45;
    }
  });
  
  doc.save(`Grand_Livre_${new Date().toISOString().split('T')[0]}.pdf`);
}

export function exportBalanceComptablePDF(data: { account: string; debit: number; credit: number; solde: number }[], period: string) {
  const doc = new jsPDF();
  
  addProfessionalHeader(doc);
  let y = addDocumentTitle(doc, 'Balance Comptable', `Période : ${period}`);
  
  const totalDebit = data.reduce((sum, d) => sum + d.debit, 0);
  const totalCredit = data.reduce((sum, d) => sum + d.credit, 0);
  
  y = addInfoBox(doc, [
    { label: 'Total Débits', value: formatCurrencyCIV(totalDebit) },
    { label: 'Total Crédits', value: formatCurrencyCIV(totalCredit) },
    { label: 'Différence', value: formatCurrencyCIV(totalDebit - totalCredit) },
  ], y);
  
  autoTable(doc, {
    startY: y,
    head: [['N° Compte', 'Libellé', 'Débit', 'Crédit', 'Solde Débiteur', 'Solde Créditeur']],
    body: data.map(d => [
      d.account.split(' - ')[0] || '-',
      d.account.split(' - ')[1] || d.account,
      formatCurrencyCIV(d.debit),
      formatCurrencyCIV(d.credit),
      d.solde > 0 ? formatCurrencyCIV(d.solde) : '-',
      d.solde < 0 ? formatCurrencyCIV(Math.abs(d.solde)) : '-',
    ]),
    foot: [[
      '', 'TOTAUX',
      formatCurrencyCIV(totalDebit),
      formatCurrencyCIV(totalCredit),
      formatCurrencyCIV(data.filter(d => d.solde > 0).reduce((sum, d) => sum + d.solde, 0)),
      formatCurrencyCIV(Math.abs(data.filter(d => d.solde < 0).reduce((sum, d) => sum + d.solde, 0))),
    ]],
    headStyles: {
      fillColor: PDF_CONFIG.colors.primary,
      textColor: 255,
      fontStyle: 'bold',
      fontSize: 8,
    },
    footStyles: {
      fillColor: PDF_CONFIG.colors.dark,
      textColor: 255,
      fontStyle: 'bold',
    },
    bodyStyles: { fontSize: 8 },
    columnStyles: {
      2: { halign: 'right' },
      3: { halign: 'right' },
      4: { halign: 'right' },
      5: { halign: 'right' },
    },
    margin: { bottom: 45 },
    didDrawPage: (data) => {
      addProfessionalFooter(doc, data.pageNumber, doc.getNumberOfPages());
    },
  });
  
  doc.save(`Balance_Comptable_${new Date().toISOString().split('T')[0]}.pdf`);
}

export function exportCompteResultatPDF(data: {
  period: string;
  produits: { label: string; amount: number }[];
  charges: { label: string; amount: number }[];
}) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  
  addProfessionalHeader(doc);
  let y = addDocumentTitle(doc, 'Compte de Résultat', `Exercice : ${data.period}`);
  
  const totalProduits = data.produits.reduce((sum, p) => sum + p.amount, 0);
  const totalCharges = data.charges.reduce((sum, c) => sum + c.amount, 0);
  const resultat = totalProduits - totalCharges;
  
  // Section Produits
  y = addSummaryCard(doc, 'Produits d\'Exploitation', 
    data.produits.map(p => ({
      label: p.label,
      value: formatCurrencyCIV(p.amount),
      color: PDF_CONFIG.colors.success,
    })),
    y
  );
  
  doc.setFillColor(230, 255, 230);
  doc.roundedRect(20, y, pageWidth - 40, 12, 2, 2, 'F');
  doc.setFontSize(PDF_CONFIG.fonts.body);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PDF_CONFIG.colors.success);
  doc.text('TOTAL PRODUITS', 25, y + 8);
  doc.text(formatCurrencyCIV(totalProduits), pageWidth - 25, y + 8, { align: 'right' });
  y += 20;
  
  // Section Charges
  y = addSummaryCard(doc, 'Charges d\'Exploitation',
    data.charges.map(c => ({
      label: c.label,
      value: formatCurrencyCIV(c.amount),
      color: PDF_CONFIG.colors.danger,
    })),
    y
  );
  
  doc.setFillColor(255, 230, 230);
  doc.roundedRect(20, y, pageWidth - 40, 12, 2, 2, 'F');
  doc.setTextColor(...PDF_CONFIG.colors.danger);
  doc.text('TOTAL CHARGES', 25, y + 8);
  doc.text(formatCurrencyCIV(totalCharges), pageWidth - 25, y + 8, { align: 'right' });
  y += 25;
  
  // Résultat
  const resultColor = resultat >= 0 ? PDF_CONFIG.colors.success : PDF_CONFIG.colors.danger;
  doc.setFillColor(...resultColor);
  doc.roundedRect(20, y, pageWidth - 40, 20, 3, 3, 'F');
  
  doc.setFontSize(PDF_CONFIG.fonts.heading);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('RÉSULTAT NET', 25, y + 13);
  doc.text(formatCurrencyCIV(resultat), pageWidth - 25, y + 13, { align: 'right' });
  
  y += 30;
  doc.setFontSize(PDF_CONFIG.fonts.small);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(100, 100, 100);
  doc.text(`Arrêté en lettres : ${amountToWords(Math.abs(resultat))} francs CFA`, 20, y);
  
  addProfessionalFooter(doc, 1, 1);
  
  doc.save(`Compte_Resultat_${new Date().toISOString().split('T')[0]}.pdf`);
}

export function exportBilanComptablePDF(data: {
  period: string;
  actifs: { label: string; amount: number }[];
  passifs: { label: string; amount: number }[];
}) {
  const doc = new jsPDF('landscape');
  const pageWidth = doc.internal.pageSize.width;
  const midX = pageWidth / 2;
  
  addProfessionalHeader(doc);
  let y = addDocumentTitle(doc, 'Bilan Comptable', `Au ${data.period}`);
  
  const totalActifs = data.actifs.reduce((sum, a) => sum + a.amount, 0);
  const totalPassifs = data.passifs.reduce((sum, p) => sum + p.amount, 0);
  
  // En-tête des colonnes
  doc.setFillColor(...PDF_CONFIG.colors.primary);
  doc.rect(20, y, midX - 25, 10, 'F');
  doc.rect(midX + 5, y, midX - 25, 10, 'F');
  
  doc.setFontSize(PDF_CONFIG.fonts.body);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('ACTIF', (20 + midX - 25) / 2 + 10, y + 7, { align: 'center' });
  doc.text('PASSIF', midX + 5 + (midX - 25) / 2, y + 7, { align: 'center' });
  
  y += 15;
  
  // Contenu
  const maxRows = Math.max(data.actifs.length, data.passifs.length);
  
  for (let i = 0; i < maxRows; i++) {
    doc.setFontSize(PDF_CONFIG.fonts.body);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...PDF_CONFIG.colors.dark);
    
    if (data.actifs[i]) {
      doc.text(data.actifs[i].label, 25, y);
      doc.text(formatCurrencyCIV(data.actifs[i].amount), midX - 30, y, { align: 'right' });
    }
    
    if (data.passifs[i]) {
      doc.text(data.passifs[i].label, midX + 10, y);
      doc.text(formatCurrencyCIV(data.passifs[i].amount), pageWidth - 25, y, { align: 'right' });
    }
    
    y += 8;
  }
  
  y += 5;
  
  // Totaux
  doc.setLineWidth(0.5);
  doc.setDrawColor(...PDF_CONFIG.colors.dark);
  doc.line(20, y, midX - 20, y);
  doc.line(midX + 5, y, pageWidth - 20, y);
  
  y += 8;
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(PDF_CONFIG.fonts.heading);
  
  doc.text('TOTAL ACTIF', 25, y);
  doc.text(formatCurrencyCIV(totalActifs), midX - 30, y, { align: 'right' });
  
  doc.text('TOTAL PASSIF', midX + 10, y);
  doc.text(formatCurrencyCIV(totalPassifs), pageWidth - 25, y, { align: 'right' });
  
  addProfessionalFooter(doc, 1, 1);
  
  doc.save(`Bilan_Comptable_${new Date().toISOString().split('T')[0]}.pdf`);
}

export function exportFluxTresoreriePDF(data: {
  period: string;
  exploitation: { label: string; amount: number }[];
  investissement: { label: string; amount: number }[];
  financement: { label: string; amount: number }[];
  soldeDebut: number;
}) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  
  addProfessionalHeader(doc);
  let y = addDocumentTitle(doc, 'Tableau des Flux de Trésorerie', `Période : ${data.period}`);
  
  const totalExploitation = data.exploitation.reduce((sum, e) => sum + e.amount, 0);
  const totalInvestissement = data.investissement.reduce((sum, i) => sum + i.amount, 0);
  const totalFinancement = data.financement.reduce((sum, f) => sum + f.amount, 0);
  const variationTresorerie = totalExploitation + totalInvestissement + totalFinancement;
  const soldeFin = data.soldeDebut + variationTresorerie;
  
  // Solde de début
  doc.setFillColor(...PDF_CONFIG.colors.light);
  doc.roundedRect(20, y, pageWidth - 40, 12, 2, 2, 'F');
  doc.setFontSize(PDF_CONFIG.fonts.body);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PDF_CONFIG.colors.dark);
  doc.text('Trésorerie au début de la période', 25, y + 8);
  doc.text(formatCurrencyCIV(data.soldeDebut), pageWidth - 25, y + 8, { align: 'right' });
  y += 20;
  
  // Section Exploitation
  y = addSummaryCard(doc, 'Flux de Trésorerie liés à l\'Activité', data.exploitation.map(e => ({
    label: e.label,
    value: formatCurrencyCIV(e.amount),
    color: e.amount >= 0 ? PDF_CONFIG.colors.success : PDF_CONFIG.colors.danger,
  })), y);
  
  doc.setFont('helvetica', 'bold');
  doc.text('= Flux net d\'exploitation', 25, y);
  const exploitColor = totalExploitation >= 0 ? PDF_CONFIG.colors.success : PDF_CONFIG.colors.danger;
  doc.setTextColor(...exploitColor);
  doc.text(formatCurrencyCIV(totalExploitation), pageWidth - 25, y, { align: 'right' });
  y += 15;
  
  // Section Investissement
  y = addSummaryCard(doc, 'Flux de Trésorerie liés aux Investissements', data.investissement.map(i => ({
    label: i.label,
    value: formatCurrencyCIV(i.amount),
    color: i.amount >= 0 ? PDF_CONFIG.colors.success : PDF_CONFIG.colors.danger,
  })), y);
  
  doc.setTextColor(...PDF_CONFIG.colors.dark);
  doc.setFont('helvetica', 'bold');
  doc.text('= Flux net d\'investissement', 25, y);
  const investColor = totalInvestissement >= 0 ? PDF_CONFIG.colors.success : PDF_CONFIG.colors.danger;
  doc.setTextColor(...investColor);
  doc.text(formatCurrencyCIV(totalInvestissement), pageWidth - 25, y, { align: 'right' });
  y += 15;
  
  // Section Financement
  y = addSummaryCard(doc, 'Flux de Trésorerie liés au Financement', data.financement.map(f => ({
    label: f.label,
    value: formatCurrencyCIV(f.amount),
    color: f.amount >= 0 ? PDF_CONFIG.colors.success : PDF_CONFIG.colors.danger,
  })), y);
  
  doc.setTextColor(...PDF_CONFIG.colors.dark);
  doc.setFont('helvetica', 'bold');
  doc.text('= Flux net de financement', 25, y);
  const financeColor = totalFinancement >= 0 ? PDF_CONFIG.colors.success : PDF_CONFIG.colors.danger;
  doc.setTextColor(...financeColor);
  doc.text(formatCurrencyCIV(totalFinancement), pageWidth - 25, y, { align: 'right' });
  y += 20;
  
  // Variation et solde final
  doc.setFillColor(...PDF_CONFIG.colors.secondary);
  doc.roundedRect(20, y, pageWidth - 40, 12, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.text('Variation de la Trésorerie', 25, y + 8);
  doc.text(formatCurrencyCIV(variationTresorerie), pageWidth - 25, y + 8, { align: 'right' });
  y += 18;
  
  const finalColor = soldeFin >= 0 ? PDF_CONFIG.colors.success : PDF_CONFIG.colors.danger;
  doc.setFillColor(...finalColor);
  doc.roundedRect(20, y, pageWidth - 40, 15, 3, 3, 'F');
  doc.setFontSize(PDF_CONFIG.fonts.heading);
  doc.setTextColor(255, 255, 255);
  doc.text('TRÉSORERIE À LA FIN DE LA PÉRIODE', 25, y + 10);
  doc.text(formatCurrencyCIV(soldeFin), pageWidth - 25, y + 10, { align: 'right' });
  
  addProfessionalFooter(doc, 1, 1);
  
  doc.save(`Flux_Tresorerie_${new Date().toISOString().split('T')[0]}.pdf`);
}

// Export générique pour les transactions avec format pro
export function exportTransactionsPDFPro(transactions: any[], title: string, period: string) {
  const doc = new jsPDF();
  
  addProfessionalHeader(doc);
  let y = addDocumentTitle(doc, title, `Période : ${period}`);
  
  const totalIncome = transactions.filter(t => t.transaction_type === 'income').reduce((sum, t) => sum + Number(t.amount), 0);
  const totalExpenses = transactions.filter(t => t.transaction_type === 'expense').reduce((sum, t) => sum + Number(t.amount), 0);
  const balance = totalIncome - totalExpenses;
  
  y = addInfoBox(doc, [
    { label: 'Total Entrées', value: formatCurrencyCIV(totalIncome) },
    { label: 'Total Sorties', value: formatCurrencyCIV(totalExpenses) },
    { label: 'Solde Net', value: formatCurrencyCIV(balance) },
  ], y, balance >= 0 ? [230, 255, 230] : [255, 230, 230]);
  
  const statusLabels: Record<string, string> = {
    draft: 'Brouillon',
    submitted: 'Soumis',
    raf_validated: 'Validé RAF',
    dg_validated: 'Validé DG',
    locked: 'Verrouillé',
    rejected: 'Rejeté',
  };
  
  autoTable(doc, {
    startY: y,
    head: [['Date', 'Type', 'Référence', 'Description', 'Montant', 'Statut']],
    body: transactions.map(t => [
      formatDateShort(t.date),
      t.transaction_type === 'income' ? 'Entrée' : 'Sortie',
      t.reference || '-',
      t.description || '-',
      formatCurrencyCIV(Number(t.amount)),
      statusLabels[t.validation_status] || 'Brouillon',
    ]),
    headStyles: {
      fillColor: PDF_CONFIG.colors.primary,
      textColor: 255,
      fontStyle: 'bold',
      fontSize: 9,
    },
    bodyStyles: {
      fontSize: 8,
    },
    alternateRowStyles: {
      fillColor: [245, 250, 245],
    },
    columnStyles: {
      0: { cellWidth: 22 },
      1: { cellWidth: 20 },
      2: { cellWidth: 25 },
      3: { cellWidth: 55 },
      4: { halign: 'right', cellWidth: 30 },
      5: { cellWidth: 25 },
    },
    margin: { bottom: 45 },
    didDrawPage: (pageData) => {
      addProfessionalFooter(doc, pageData.pageNumber, doc.getNumberOfPages());
    },
  });
  
  doc.save(`${title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
}
