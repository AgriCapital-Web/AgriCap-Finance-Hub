import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatCurrency, formatDate } from './mockData';

// =====================================================
// Types
// =====================================================
interface Associate {
  id: string;
  full_name: string;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  entry_date: string;
  total_contribution: number | null;
  participation_rate: number | null;
  is_active: boolean | null;
  contact_person_name?: string | null;
  contact_person_phone?: string | null;
}

interface Contribution {
  id: string;
  associate_id: string;
  amount: number;
  contribution_date: string;
  contribution_type?: string | null;
  description?: string | null;
}

// =====================================================
// PDF Constants
// =====================================================
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

// =====================================================
// PDF Helpers
// =====================================================
function addPdfHeader(doc: jsPDF) {
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(27, 122, 61); // Primary green
  doc.text(PDF_HEADER.company, doc.internal.pageSize.width / 2, 20, { align: 'center' });
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text(PDF_HEADER.tagline, doc.internal.pageSize.width / 2, 28, { align: 'center' });
  
  doc.setDrawColor(27, 122, 61);
  doc.setLineWidth(0.5);
  doc.line(20, 32, doc.internal.pageSize.width - 20, 32);
}

function addPdfFooter(doc: jsPDF, pageNumber: number, totalPages: number) {
  const pageHeight = doc.internal.pageSize.height;
  const pageWidth = doc.internal.pageSize.width;
  
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(20, pageHeight - 35, pageWidth - 20, pageHeight - 35);
  
  doc.setFontSize(7);
  doc.setTextColor(100, 100, 100);
  doc.text(PDF_FOOTER.line1, pageWidth / 2, pageHeight - 28, { align: 'center' });
  doc.text(PDF_FOOTER.line2, pageWidth / 2, pageHeight - 23, { align: 'center' });
  doc.text(PDF_FOOTER.line3, pageWidth / 2, pageHeight - 18, { align: 'center' });
  doc.text(PDF_FOOTER.line4, pageWidth / 2, pageHeight - 13, { align: 'center' });
  
  doc.text(`Page ${pageNumber} / ${totalPages}`, pageWidth - 25, pageHeight - 8, { align: 'right' });
}

// =====================================================
// Excel Export
// =====================================================
export function exportAssociatesExcel(associates: Associate[], contributions: Contribution[]) {
  const wb = XLSX.utils.book_new();
  const totalApports = associates.reduce((sum, a) => sum + (a.total_contribution || 0), 0);

  // Feuille résumé
  const summaryData = [
    ['AGRICAPITAL SARL - Rapport des Associés'],
    ['Généré le:', new Date().toLocaleDateString('fr-FR')],
    [],
    ['RÉSUMÉ'],
    ['Nombre d\'associés', associates.length],
    ['Associés actifs', associates.filter(a => a.is_active).length],
    ['Total des apports', totalApports],
    ['Nombre d\'apports', contributions.length],
    [],
  ];
  
  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  summarySheet['!cols'] = [{ wch: 25 }, { wch: 20 }];
  XLSX.utils.book_append_sheet(wb, summarySheet, 'Résumé');

  // Feuille des associés
  const associatesData = associates.map(a => ({
    'Nom Complet': a.full_name,
    'Prénom': a.first_name || '-',
    'Nom': a.last_name || '-',
    'Email': a.email || '-',
    'Téléphone': a.phone || '-',
    'Adresse': a.address || '-',
    'Date d\'entrée': formatDate(a.entry_date),
    'Total Apports (FCFA)': a.total_contribution || 0,
    'Taux de participation (%)': a.participation_rate || 0,
    'Statut': a.is_active ? 'Actif' : 'Inactif',
    'Contact urgence': a.contact_person_name || '-',
    'Tél. urgence': a.contact_person_phone || '-',
  }));

  const associatesSheet = XLSX.utils.json_to_sheet(associatesData);
  associatesSheet['!cols'] = [
    { wch: 25 }, // Nom
    { wch: 15 }, // Prénom
    { wch: 15 }, // Nom
    { wch: 25 }, // Email
    { wch: 15 }, // Tel
    { wch: 30 }, // Adresse
    { wch: 12 }, // Date
    { wch: 18 }, // Apports
    { wch: 12 }, // Taux
    { wch: 10 }, // Statut
    { wch: 20 }, // Contact
    { wch: 15 }, // Tel urgence
  ];
  XLSX.utils.book_append_sheet(wb, associatesSheet, 'Associés');

  // Feuille des apports détaillés
  if (contributions.length > 0) {
    const contributionsData = contributions.map(c => {
      const associate = associates.find(a => a.id === c.associate_id);
      return {
        'Date': formatDate(c.contribution_date),
        'Associé': associate?.full_name || 'Inconnu',
        'Type d\'apport': c.contribution_type || 'Non spécifié',
        'Montant (FCFA)': c.amount,
        'Description': c.description || '-',
      };
    });

    const contributionsSheet = XLSX.utils.json_to_sheet(contributionsData);
    contributionsSheet['!cols'] = [
      { wch: 12 },
      { wch: 25 },
      { wch: 20 },
      { wch: 18 },
      { wch: 40 },
    ];
    XLSX.utils.book_append_sheet(wb, contributionsSheet, 'Apports');
  }

  // Feuille d'analyse par associé
  const analysisData = associates.map(a => {
    const assocContribs = contributions.filter(c => c.associate_id === a.id);
    const firstContrib = assocContribs.length > 0 
      ? assocContribs.reduce((min, c) => c.contribution_date < min.contribution_date ? c : min, assocContribs[0])
      : null;
    const lastContrib = assocContribs.length > 0
      ? assocContribs.reduce((max, c) => c.contribution_date > max.contribution_date ? c : max, assocContribs[0])
      : null;
    
    return {
      'Associé': a.full_name,
      'Nombre d\'apports': assocContribs.length,
      'Total apports (FCFA)': a.total_contribution || 0,
      'Taux (%)': a.participation_rate || 0,
      'Premier apport': firstContrib ? formatDate(firstContrib.contribution_date) : '-',
      'Dernier apport': lastContrib ? formatDate(lastContrib.contribution_date) : '-',
      'Montant moyen': assocContribs.length > 0 ? Math.round((a.total_contribution || 0) / assocContribs.length) : 0,
    };
  });

  const analysisSheet = XLSX.utils.json_to_sheet(analysisData);
  analysisSheet['!cols'] = [
    { wch: 25 },
    { wch: 15 },
    { wch: 18 },
    { wch: 10 },
    { wch: 15 },
    { wch: 15 },
    { wch: 18 },
  ];
  XLSX.utils.book_append_sheet(wb, analysisSheet, 'Analyse');

  XLSX.writeFile(wb, `Associes_Agricapital_${new Date().toISOString().split('T')[0]}.xlsx`);
}

// =====================================================
// PDF Export
// =====================================================
export function exportAssociatesPDF(associates: Associate[], contributions: Contribution[]) {
  const doc = new jsPDF();
  const totalApports = associates.reduce((sum, a) => sum + (a.total_contribution || 0), 0);
  
  addPdfHeader(doc);
  
  // Titre
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('RAPPORT DES ASSOCIÉS', doc.internal.pageSize.width / 2, 45, { align: 'center' });
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Généré le : ${new Date().toLocaleDateString('fr-FR')}`, doc.internal.pageSize.width / 2, 52, { align: 'center' });
  
  // Résumé
  doc.setFillColor(27, 122, 61);
  doc.rect(20, 58, doc.internal.pageSize.width - 40, 25, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  const colWidth = (doc.internal.pageSize.width - 40) / 4;
  doc.text(`Associés: ${associates.length}`, 20 + colWidth / 2, 70, { align: 'center' });
  doc.text(`Actifs: ${associates.filter(a => a.is_active).length}`, 20 + colWidth * 1.5, 70, { align: 'center' });
  doc.text(`Total apports: ${formatCurrency(totalApports)}`, 20 + colWidth * 2.5, 70, { align: 'center' });
  doc.text(`Nb apports: ${contributions.length}`, 20 + colWidth * 3.5, 70, { align: 'center' });
  
  // Tableau des associés
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Liste des Associés', 20, 95);
  
  autoTable(doc, {
    startY: 100,
    head: [['Nom', 'Contact', 'Entrée', 'Apports', 'Taux', 'Statut']],
    body: associates.map(a => [
      a.full_name,
      a.phone || a.email || '-',
      formatDate(a.entry_date),
      formatCurrency(a.total_contribution || 0),
      `${(a.participation_rate || 0).toFixed(2)}%`,
      a.is_active ? 'Actif' : 'Inactif',
    ]),
    headStyles: {
      fillColor: [27, 122, 61],
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
      0: { cellWidth: 40 },
      3: { halign: 'right' },
      4: { halign: 'right' },
      5: { halign: 'center' },
    },
    margin: { bottom: 40 },
    didDrawPage: (data) => {
      addPdfFooter(doc, data.pageNumber, doc.getNumberOfPages());
    },
  });

  // Page des apports récents (si y en a)
  if (contributions.length > 0) {
    doc.addPage();
    addPdfHeader(doc);
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('Historique des Apports (20 derniers)', 20, 45);
    
    const recentContributions = contributions.slice(0, 20);
    
    autoTable(doc, {
      startY: 50,
      head: [['Date', 'Associé', 'Type', 'Montant', 'Description']],
      body: recentContributions.map(c => {
        const associate = associates.find(a => a.id === c.associate_id);
        return [
          formatDate(c.contribution_date),
          associate?.full_name || 'Inconnu',
          c.contribution_type || 'Apport',
          formatCurrency(c.amount),
          (c.description || '-').substring(0, 30),
        ];
      }),
      headStyles: {
        fillColor: [27, 122, 61],
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
        3: { halign: 'right' },
      },
      margin: { bottom: 40 },
      didDrawPage: (data) => {
        addPdfFooter(doc, data.pageNumber, doc.getNumberOfPages());
      },
    });
  }
  
  doc.save(`Associes_Agricapital_${new Date().toISOString().split('T')[0]}.pdf`);
}

// =====================================================
// Export individuel associé
// =====================================================
export function exportAssociateDetailPDF(associate: Associate, contributions: Contribution[]) {
  const doc = new jsPDF();
  const assocContribs = contributions.filter(c => c.associate_id === associate.id);
  
  addPdfHeader(doc);
  
  // Titre
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('FICHE ASSOCIÉ', doc.internal.pageSize.width / 2, 45, { align: 'center' });
  
  // Infos associé
  doc.setFontSize(12);
  doc.text(associate.full_name, doc.internal.pageSize.width / 2, 55, { align: 'center' });
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  let yPos = 70;
  
  // Infos générales
  doc.setFillColor(245, 245, 245);
  doc.rect(20, yPos - 5, doc.internal.pageSize.width - 40, 45, 'F');
  
  doc.text(`Email: ${associate.email || '-'}`, 25, yPos);
  yPos += 8;
  doc.text(`Téléphone: ${associate.phone || '-'}`, 25, yPos);
  yPos += 8;
  doc.text(`Adresse: ${associate.address || '-'}`, 25, yPos);
  yPos += 8;
  doc.text(`Date d'entrée: ${formatDate(associate.entry_date)}`, 25, yPos);
  yPos += 8;
  doc.text(`Statut: ${associate.is_active ? 'Actif' : 'Inactif'}`, 25, yPos);
  
  yPos += 20;
  
  // Résumé financier
  doc.setFillColor(27, 122, 61);
  doc.rect(20, yPos, doc.internal.pageSize.width - 40, 20, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.text(`Total apports: ${formatCurrency(associate.total_contribution || 0)}`, 30, yPos + 12);
  doc.text(`Taux: ${(associate.participation_rate || 0).toFixed(2)}%`, 110, yPos + 12);
  doc.text(`Nb apports: ${assocContribs.length}`, 160, yPos + 12);
  
  yPos += 30;
  
  // Tableau des apports
  if (assocContribs.length > 0) {
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    doc.text('Historique des apports', 20, yPos);
    
    autoTable(doc, {
      startY: yPos + 5,
      head: [['Date', 'Type', 'Montant', 'Description']],
      body: assocContribs.map(c => [
        formatDate(c.contribution_date),
        c.contribution_type || 'Apport',
        formatCurrency(c.amount),
        (c.description || '-').substring(0, 40),
      ]),
      headStyles: {
        fillColor: [27, 122, 61],
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
        2: { halign: 'right' },
      },
      margin: { bottom: 40 },
      didDrawPage: (data) => {
        addPdfFooter(doc, data.pageNumber, doc.getNumberOfPages());
      },
    });
  }
  
  doc.save(`Associe_${associate.full_name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
}
