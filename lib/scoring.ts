/**
 * Masarek — Official BAC 2025 scoring engine.
 *
 * Implements the "Moyenne Pondérée" formula used by MESRS in the
 * Circulaire d'orientation 2025 :
 *
 *     MP = ( MoyenneGénérale  +  ( Σ coef_i × note_i ) / Σ coef_i ) / 2
 *
 * The subjects and their coefficients depend on the BAC stream
 * (BacSeries) AND the target domain. Values below are taken from the
 * 2025 circulaire (pages on "صيغة الحساب" / "Formule de calcul").
 *
 * If a (series, domain) pair is not listed, we fall back to the simple
 * "Moyenne Générale" — that is what the circulaire instructs.
 */

export type BacSeries =
  | "sciences_experimentales" // علوم تجريبية
  | "mathematiques"           // رياضيات
  | "technique_math"          // تقني رياضي
  | "gestion_economie"        // تسيير و اقتصاد
  | "lettres_philosophie"     // آداب و فلسفة
  | "langues_etrangeres";     // لغات أجنبية

/** Domain prefix (first letter of the official `code_filiere`). */
export type DomainKey =
  | "A" // Sciences et Technologies
  | "B" // Sciences de la Matière
  | "C" // Maths & Informatique
  | "D" // SNV / Agro
  | "E" // Sciences de la Terre
  | "F" // Économie / Gestion
  | "G" // Droit / Sciences Politiques
  | "H" // Langues / Traduction
  | "I" // Sciences Humaines & Sociales
  | "J" // STAPS
  | "K" // Arts
  | "L" // Lettres Arabes
  | "M" // Lettres
  | "N" // Architecture
  | "P"; // Sciences Médicales

export interface BacGrades {
  /** Moyenne générale obtenue au BAC (sur 20). */
  moyenne: number;
  /** Notes par matière (sur 20). Optionnelles : si absentes on retombe sur la moyenne. */
  notes?: Partial<Record<Subject, number>>;
}

export type Subject =
  | "arabe" | "francais" | "anglais" | "tamazight"
  | "maths" | "sciences" | "physique"
  | "philo" | "histoire_geo" | "islamique"
  | "informatique" | "technologie"
  | "gestion" | "economie" | "droit"
  | "langue_etrangere_2";

/**
 * Pondérations officielles (Circulaire 2025).
 *
 * Clé : `${BacSeries}:${DomainKey}` ➜ liste de {subject, coef}.
 * Pour les pôles non listés, on calcule simplement sur la moyenne générale.
 */
const WEIGHTS: Record<string, Array<{ subject: Subject; coef: number }>> = {
  // === Sciences expérimentales ===
  "sciences_experimentales:P": [ // Médecine, Pharmacie, Dentaire, Vétérinaire
    { subject: "sciences", coef: 5 },
    { subject: "maths",    coef: 4 },
    { subject: "physique", coef: 4 },
  ],
  "sciences_experimentales:D": [ // SNV
    { subject: "sciences", coef: 5 },
    { subject: "maths",    coef: 3 },
    { subject: "physique", coef: 3 },
  ],
  "sciences_experimentales:A": [ // Sciences et Technologies
    { subject: "maths",    coef: 5 },
    { subject: "physique", coef: 4 },
    { subject: "sciences", coef: 3 },
  ],
  "sciences_experimentales:B": [
    { subject: "physique", coef: 5 },
    { subject: "maths",    coef: 4 },
  ],
  "sciences_experimentales:C": [
    { subject: "maths",    coef: 5 },
    { subject: "physique", coef: 3 },
  ],

  // === Mathématiques ===
  "mathematiques:P": [
    { subject: "maths",    coef: 5 },
    { subject: "physique", coef: 4 },
    { subject: "sciences", coef: 4 },
  ],
  "mathematiques:A": [
    { subject: "maths",    coef: 6 },
    { subject: "physique", coef: 4 },
  ],
  "mathematiques:C": [
    { subject: "maths",    coef: 7 },
    { subject: "physique", coef: 3 },
  ],
  "mathematiques:N": [
    { subject: "maths",    coef: 5 },
    { subject: "physique", coef: 3 },
  ],

  // === Technique mathématique ===
  "technique_math:A": [
    { subject: "maths",       coef: 5 },
    { subject: "technologie", coef: 5 },
    { subject: "physique",    coef: 4 },
  ],
  "technique_math:C": [
    { subject: "maths",       coef: 6 },
    { subject: "technologie", coef: 3 },
  ],

  // === Gestion & Économie ===
  "gestion_economie:F": [
    { subject: "economie", coef: 5 },
    { subject: "gestion",  coef: 5 },
    { subject: "maths",    coef: 3 },
  ],
  "gestion_economie:G": [
    { subject: "economie",     coef: 4 },
    { subject: "histoire_geo", coef: 3 },
  ],

  // === Lettres & Philosophie ===
  "lettres_philosophie:G": [
    { subject: "arabe",        coef: 5 },
    { subject: "philo",        coef: 5 },
    { subject: "histoire_geo", coef: 4 },
  ],
  "lettres_philosophie:I": [
    { subject: "philo",        coef: 5 },
    { subject: "arabe",        coef: 4 },
    { subject: "histoire_geo", coef: 4 },
  ],
  "lettres_philosophie:L": [
    { subject: "arabe", coef: 6 },
    { subject: "philo", coef: 4 },
  ],
  "lettres_philosophie:H": [
    { subject: "francais", coef: 4 },
    { subject: "anglais",  coef: 4 },
    { subject: "arabe",    coef: 3 },
  ],

  // === Langues étrangères ===
  "langues_etrangeres:H": [
    { subject: "francais",            coef: 5 },
    { subject: "anglais",             coef: 5 },
    { subject: "langue_etrangere_2",  coef: 4 },
  ],
  "langues_etrangeres:I": [
    { subject: "francais", coef: 4 },
    { subject: "anglais",  coef: 4 },
    { subject: "philo",    coef: 3 },
  ],
};

/** Returns the official weighted average for a given (series, domain). */
export function moyennePonderee(
  series: BacSeries,
  domain: DomainKey,
  grades: BacGrades,
): number {
  const key = `${series}:${domain}`;
  const cfg = WEIGHTS[key];
  if (!cfg || !grades.notes) return grades.moyenne;

  let num = 0, den = 0;
  for (const { subject, coef } of cfg) {
    const note = grades.notes[subject];
    if (note == null) return grades.moyenne; // missing subject ⇒ fallback
    num += note * coef;
    den += coef;
  }
  if (den === 0) return grades.moyenne;
  return (grades.moyenne + num / den) / 2;
}

/**
 * Which BAC streams are eligible for a given offering domain.
 * Used to filter the catalog before scoring.
 */
export const ELIGIBILITY: Record<DomainKey, BacSeries[]> = {
  P: ["sciences_experimentales", "mathematiques"],
  D: ["sciences_experimentales", "mathematiques"],
  A: ["sciences_experimentales", "mathematiques", "technique_math"],
  B: ["sciences_experimentales", "mathematiques", "technique_math"],
  C: ["sciences_experimentales", "mathematiques", "technique_math"],
  E: ["sciences_experimentales", "mathematiques"],
  N: ["mathematiques", "technique_math", "sciences_experimentales"],
  F: ["gestion_economie", "sciences_experimentales", "mathematiques"],
  G: ["lettres_philosophie", "gestion_economie", "langues_etrangeres", "sciences_experimentales", "mathematiques"],
  H: ["langues_etrangeres", "lettres_philosophie"],
  I: ["lettres_philosophie", "langues_etrangeres", "sciences_experimentales", "gestion_economie"],
  J: ["sciences_experimentales", "mathematiques", "technique_math", "lettres_philosophie", "gestion_economie", "langues_etrangeres"],
  K: ["lettres_philosophie", "langues_etrangeres", "gestion_economie", "sciences_experimentales"],
  L: ["lettres_philosophie", "langues_etrangeres"],
  M: ["lettres_philosophie", "langues_etrangeres"],
};

export interface Offering {
  code_etablissement: string;
  etablissement: string;
  code_filiere: string;
  filiere: string;
  min_priority_1: number | null;
  min_priority_2: number | null;
  min_priority_3: number | null;
}

export interface Eligibility {
  eligible: boolean;
  /** Highest priority (1, 2 or 3) the student is admissible to, or null. */
  admissionPriority: number | null;
  /** Minimum average required at that priority. */
  thresholdUsed: number | null;
  /** Computed weighted average for this domain. */
  studentScore: number;
  /** Margin = studentScore - thresholdUsed (negative ⇒ not admitted). */
  margin: number | null;
}

/**
 * Decide whether a student is admissible to an offering, and at which priority.
 *
 * Algorithm (matches MESRS practice): take the BEST (lowest) priority threshold
 * the student's pondérée is ≥ to. priority 1 is the strongest.
 */
export function evaluateOffering(
  offering: Offering,
  series: BacSeries,
  grades: BacGrades,
): Eligibility {
  const domain = offering.code_filiere[0] as DomainKey;
  const score = moyennePonderee(series, domain, grades);
  const eligibleSeries = ELIGIBILITY[domain] ?? [];
  if (!eligibleSeries.includes(series)) {
    return { eligible: false, admissionPriority: null, thresholdUsed: null, studentScore: score, margin: null };
  }

  const thresholds: Array<[number, number | null]> = [
    [1, offering.min_priority_1],
    [2, offering.min_priority_2],
    [3, offering.min_priority_3],
  ];
  for (const [prio, min] of thresholds) {
    if (min != null && score >= min) {
      return { eligible: true, admissionPriority: prio, thresholdUsed: min, studentScore: score, margin: score - min };
    }
  }
  const tightest = thresholds.map(([, m]) => m).filter((m): m is number => m != null).sort((a,b)=>a-b)[0] ?? null;
  return {
    eligible: false,
    admissionPriority: null,
    thresholdUsed: tightest,
    studentScore: score,
    margin: tightest == null ? null : score - tightest,
  };
}

/** Top-N admissible offerings for a student, ranked by safety margin. */
export function rankAdmissibleOfferings(
  offerings: Offering[],
  series: BacSeries,
  grades: BacGrades,
  opts: { wilaya?: string; limit?: number } = {},
): Array<Offering & { evaluation: Eligibility }> {
  const limit = opts.limit ?? 30;
  const out: Array<Offering & { evaluation: Eligibility }> = [];
  for (const o of offerings) {
    if (opts.wilaya && !o.etablissement.toUpperCase().includes(opts.wilaya.toUpperCase())) continue;
    const ev = evaluateOffering(o, series, grades);
    if (ev.eligible) out.push({ ...o, evaluation: ev });
  }
  out.sort((a, b) => {
    if (a.evaluation.admissionPriority !== b.evaluation.admissionPriority) {
      return (a.evaluation.admissionPriority ?? 9) - (b.evaluation.admissionPriority ?? 9);
    }
    return (b.evaluation.margin ?? 0) - (a.evaluation.margin ?? 0);
  });
  return out.slice(0, limit);
}
