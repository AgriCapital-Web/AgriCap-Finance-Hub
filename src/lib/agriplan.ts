/**
 * AGRIPLAN — SOURCE DE VÉRITÉ UNIQUE (côté client)
 *
 * Offre AgriPlan reconfigurée sur 36 mois / 3 ans :
 *  - Mise en place initiale : 200 000 FCFA (paiement initial, DI AgriPlan)
 *  - Accompagnement : 10 000 FCFA par trimestre × 12 trimestres = 120 000 FCFA
 *  - Total : 320 000 FCFA
 *
 * Les montants ne doivent JAMAIS être codés en dur ailleurs : ils proviennent
 * de la table `configurations_systeme` (catégorie `agriplan`) via `useAgriPlanConfig`.
 * Les constantes ci-dessous ne servent que de valeurs de repli avant migration.
 */

export const AGRIPLAN_OFFRE_CODE = "agri-plan";

export interface AgriPlanConfig {
  /** Mise en place initiale (FCFA) */
  montantInitial: number;
  /** Accompagnement par trimestre (FCFA) */
  montantTrimestre: number;
  /** Nombre de trimestres */
  nbTrimestres: number;
  /** Durée totale en mois */
  dureeMois: number;
}

export const AGRIPLAN_DEFAULT_CONFIG: AgriPlanConfig = {
  montantInitial: 200_000,
  montantTrimestre: 10_000,
  nbTrimestres: 12,
  dureeMois: 36,
};

export interface AgriPlanTotaux {
  miseEnPlace: number;
  accompagnement: number;
  total: number;
}

export function computeAgriPlanTotaux(cfg: AgriPlanConfig): AgriPlanTotaux {
  const accompagnement = cfg.montantTrimestre * cfg.nbTrimestres;
  return {
    miseEnPlace: cfg.montantInitial,
    accompagnement,
    total: cfg.montantInitial + accompagnement,
  };
}

export type AgriPlanEcheanceStatut = "a_venir" | "du" | "paye" | "en_retard" | "annule";

export interface AgriPlanEcheance {
  id: string;
  numero_echeance: number;
  /** 0 = paiement initial, 1..N = trimestres */
  type: "mise_en_place" | "accompagnement";
  annee: number;
  trimestre: number;
  date_echeance: string; // ISO yyyy-mm-dd
  montant: number;
  statut: AgriPlanEcheanceStatut;
  date_paiement: string | null;
  montant_paye: number;
  solde: number;
  jours_retard: number;
  reference_paiement: string | null;
  moyen_paiement: string | null;
}

const iso = (d: Date) => d.toISOString().slice(0, 10);

function addMonths(date: Date, months: number): Date {
  const d = new Date(date.getTime());
  const day = d.getDate();
  d.setMonth(d.getMonth() + months);
  if (d.getDate() < day) d.setDate(0);
  return d;
}

/**
 * Génère l'échéancier prévisionnel AgriPlan :
 * 1 paiement initial + N échéances trimestrielles.
 */
export function buildAgriPlanEcheancier(
  cfg: AgriPlanConfig,
  dateDebut: Date | string = new Date(),
  today: Date = new Date(),
): AgriPlanEcheance[] {
  const start = typeof dateDebut === "string" ? new Date(dateDebut) : dateDebut;
  const rows: AgriPlanEcheance[] = [];

  rows.push({
    id: "agriplan-mise-en-place",
    numero_echeance: 0,
    type: "mise_en_place",
    annee: 1,
    trimestre: 0,
    date_echeance: iso(start),
    montant: cfg.montantInitial,
    statut: start <= today ? "du" : "a_venir",
    date_paiement: null,
    montant_paye: 0,
    solde: cfg.montantInitial,
    jours_retard: 0,
    reference_paiement: null,
    moyen_paiement: null,
  });

  for (let i = 1; i <= cfg.nbTrimestres; i++) {
    const echeance = addMonths(start, i * 3);
    const retard = Math.floor((today.getTime() - echeance.getTime()) / 86_400_000);
    rows.push({
      id: `agriplan-t${i}`,
      numero_echeance: i,
      type: "accompagnement",
      annee: Math.ceil(i / 4),
      trimestre: ((i - 1) % 4) + 1,
      date_echeance: iso(echeance),
      montant: cfg.montantTrimestre,
      statut: retard > 0 ? "en_retard" : echeance <= today ? "du" : "a_venir",
      date_paiement: null,
      montant_paye: 0,
      solde: cfg.montantTrimestre,
      jours_retard: retard > 0 ? retard : 0,
      reference_paiement: null,
      moyen_paiement: null,
    });
  }

  return rows;
}

export interface AgriPlanSynthese {
  totalPrevu: number;
  totalPaye: number;
  totalRestant: number;
  prochaines: AgriPlanEcheance[];
  enRetard: AgriPlanEcheance[];
  pourcentageAvancement: number;
}

export function summarizeAgriPlan(echeances: AgriPlanEcheance[]): AgriPlanSynthese {
  const actives = echeances.filter((e) => e.statut !== "annule");
  const totalPrevu = actives.reduce((s, e) => s + e.montant, 0);
  const totalPaye = actives.reduce((s, e) => s + (e.montant_paye || 0), 0);
  return {
    totalPrevu,
    totalPaye,
    totalRestant: Math.max(totalPrevu - totalPaye, 0),
    prochaines: actives.filter((e) => e.statut === "a_venir" || e.statut === "du").slice(0, 3),
    enRetard: actives.filter((e) => e.statut === "en_retard"),
    pourcentageAvancement: totalPrevu > 0 ? Math.round((totalPaye / totalPrevu) * 100) : 0,
  };
}

/** Prestations incluses / exclues du forfait AgriPlan */
export const AGRIPLAN_INCLUS: string[] = [
  "Mise en place initiale de la plantation",
  "Fourniture des plants / prestation de pépinière selon configuration",
  "Accompagnement trimestriel pendant 36 mois",
  "Visites de parcelle et conseils techniques",
  "Comptes rendus de visite et suivi de l'évolution",
];

export const AGRIPLAN_EXCLUS: string[] = [
  "Intrants (engrais, produits phytosanitaires, etc.)",
  "Fournitures supplémentaires",
  "Prestations supplémentaires hors forfait",
];

export const AGRIPLAN_ACCOMPAGNEMENT: string[] = [
  "Suivi de l'évolution de la plantation",
  "Visite de parcelle",
  "Conseils techniques",
  "Encadrement client",
  "Évaluation de l'état de la plantation",
  "Évolution du projet",
  "Compte rendu de visite",
  "Historique des suivis",
];

export const formatFCFA = (n: number) => `${Math.round(n).toLocaleString("fr-FR")} FCFA`;
