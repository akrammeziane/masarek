'use server'

import { auth, signOut as nextSignOut } from '@/lib/auth'
import { db } from '@/lib/db'
import {
  studentProfiles,
  assessmentResponses,
  recommendations,
  savedSpecializations,
  specializations,
} from '@/lib/db/schema'
import { eq, desc, and } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import {
  rankAdmissibleOfferings,
  evaluateOffering,
  type BacSeries,
  type BacGrades,
  type Offering,
} from '@/lib/scoring'
import OFFERINGS_RAW from '@/lib/data/offerings.json'
import SPECIALTIES_JSON from '@/lib/data/specialties.json'
import UNIVERSITIES_JSON from '@/lib/data/universities.json'

// ═══════════════════════════════════════════════════════════════════════════════
// STAGE 1 — DATA INTEGRITY: strict typed coercion of raw JSON rows.
// All threshold fields are coerced to finite numbers (or null).
// All elite flags are coerced to true booleans.
// ═══════════════════════════════════════════════════════════════════════════════

type RawUni = {
  code: string
  name_fr: string
  name_ar?: string | null
  annex_location?: string | null
  wilaya: string | null
  isNationalRegistration?: unknown
  isEcoleSuperieure?: unknown
}
type RawSpec = {
  code: string
  name_fr: string
  name_ar?: string | null
  minGrade?: unknown
  minGradeRequired?: unknown
  isNationalRegistration?: unknown
  isEcoleSuperieure?: unknown
}
type RawOff = {
  university_code: string
  specialty_code: string
  min_priority_1: unknown
  min_priority_2: unknown
  min_priority_3: unknown
  minGrade?: unknown
  minGradeRequired?: unknown
  restriction?: string | null
  isNationalRegistration?: unknown
  isEcoleSuperieure?: unknown
}

function toFiniteNumber(v: unknown): number | null {
  if (v === null || v === undefined || v === '') return null
  const n = typeof v === 'number' ? v : Number(v)
  return Number.isFinite(n) ? n : null
}
function toBool(v: unknown): boolean {
  if (v === true) return true
  if (typeof v === 'string') return v.toLowerCase() === 'true' || v === '1'
  if (typeof v === 'number') return v === 1
  return false
}

// ─── Name cleaners ────────────────────────────────────────────────────────────
function dedupAdjacent(text: string): string {
  let prev: string
  let out = text
  do {
    prev = out
    out = out.replace(/\b((?:[\p{L}\d]+\W+){1,6}[\p{L}\d]+)\W+\1\b/giu, '$1')
  } while (out !== prev)
  return out
}
function balanceParens(text: string): string {
  const opens = (text.match(/\(/g) ?? []).length
  const closes = (text.match(/\)/g) ?? []).length
  if (opens > closes) return text + ')'.repeat(opens - closes)
  if (closes > opens) return '('.repeat(closes - opens) + text
  return text
}
function stripFlags(text: string): string {
  return text
    .replace(/^\s*FB\s+(SP|INF|TC|LMD)\s+/i, '')
    .replace(/\b(a|à)\s+distance\b/gi, 'À distance')
    .trim()
}
const SMALL_FR = new Set([
  'de', 'des', 'du', 'la', 'le', 'les', 'et', 'en', 'd', 'l', 'a', 'au', 'aux',
  'sur', 'pour', 'par', 'ou', 'un', 'une', 'à',
])
function titleCaseFr(text: string): string {
  return text
    .toLowerCase()
    .split(/(\s+|-)/)
    .map((tok, i) => {
      if (!tok.trim() || tok === '-') return tok
      if (i > 0 && SMALL_FR.has(tok)) return tok
      return tok.charAt(0).toUpperCase() + tok.slice(1)
    })
    .join('')
}
function cleanName(raw: string | null | undefined): string {
  if (!raw) return ''
  let s = raw.replace(/\s+/g, ' ').trim()
  s = stripFlags(s)
  s = dedupAdjacent(s)
  s = balanceParens(s)
  s = s.replace(/\s+/g, ' ').replace(/^[\s\-–•·]+/, '').trim()
  return titleCaseFr(s)
}
function isGarbageName(s: string): boolean {
  if (!s) return true
  const letters = s.replace(/[^\p{L}]/gu, '')
  if (letters.length < 4) return true
  if (/^FB\s/i.test(s)) return true
  return false
}
function canonicalKey(name: string): string {
  return name
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toUpperCase().replace(/[^A-Z0-9]+/g, ' ').trim()
}

// ─── Rule D.1 — Bilingual display dedup helper ───────────────────────────────
/**
 * If French and Arabic display strings are equivalent (case-insensitive,
 * accents/whitespace normalised) return ONE copy; otherwise return both
 * joined by a thin separator. Used by every UI string we build.
 */
function displayBilingual(
  nameFr: string | null | undefined,
  nameAr: string | null | undefined,
  sep = ' — ',
): string {
  const fr = (nameFr ?? '').trim()
  const ar = (nameAr ?? '').trim()
  if (!fr) return ar
  if (!ar) return fr
  if (canonicalKey(fr) === canonicalKey(ar)) return fr
  return `${fr}${sep}${ar}`
}

// ─── Fast lookup maps ────────────────────────────────────────────────────────
const UNI_BY_CODE: Map<string, RawUni> = new Map(
  (UNIVERSITIES_JSON as RawUni[]).map((u) => [u.code, u]),
)
const SPEC_BY_CODE: Map<string, RawSpec> = new Map(
  (SPECIALTIES_JSON as RawSpec[]).map((s) => [s.code, s]),
)

/**
 * Elite-bypass detector — Rule B exception source of truth.
 * An offering bypasses the high-achiever low-barrier filter if EITHER
 * the offering row, its university row, or its specialty row carries
 * isNationalRegistration === true OR isEcoleSuperieure === true.
 * Falls back to name/code pattern detection so legacy data still works.
 */
// Add this helper function to strip French accents (é, è, ê, etc.) to handle uppercase unaccented raw data
function normalizeString(text: string): string {
  if (!text) return "";
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function isEliteBypass(o: any, raw?: any): boolean {
  const uni = o.code_etablissement ? UNI_BY_CODE.get(o.code_etablissement) : undefined
  const spec = o.code_filiere ? SPEC_BY_CODE.get(o.code_filiere) : undefined

  if (raw && (toBool(raw.isNationalRegistration) || toBool(raw.isEcoleSuperieure))) return true
  if (uni && (toBool(uni.isNationalRegistration) || toBool(uni.isEcoleSuperieure))) return true
  if (spec && (toBool(spec.isNationalRegistration) || toBool(spec.isEcoleSuperieure))) return true

  // 🚨 شبكة الأمان: البحث عن الكود الطبي (P) في جميع الأماكن الممكنة
  const specCode = o.code_filiere || o.specialtyCode || raw?.specialty_code || '';
  if (specCode.toUpperCase().startsWith('P')) {
    return true; // التخصصات الطبية تعبر الفلاتر إجبارياً
  }

  // فحص النصوص للمدارس العليا
  const name = o.etablissement || o.universityNameFr || '';
  const normalizedName = normalizeString(name);

  if (
    normalizedName.includes('ecole nationale') ||
    normalizedName.includes('ecole superieure') ||
    normalizedName.includes('ecole normale') ||
    normalizedName.includes('grande ecole') ||
    normalizedName.includes('polytechnique')
  ) return true

  return false
}

/** Normalize a raw offering row to the legacy `Offering` shape, with floats. */
function normalizeOffering(o: RawOff): (Offering & { __raw: RawOff }) | null {
  if (!o?.university_code || !o?.specialty_code) return null
  const u = UNI_BY_CODE.get(o.university_code)
  const s = SPEC_BY_CODE.get(o.specialty_code)
  const filiereDisplay = cleanName(s?.name_fr ?? '')
  if (isGarbageName(filiereDisplay)) return null
  const normalized = {
    code_etablissement: o.university_code,
    code_filiere: o.specialty_code,
    etablissement: cleanName(u?.name_fr ?? '') || (u?.name_fr ?? ''),
    filiere: filiereDisplay,
    wilaya: u?.wilaya ?? null,
    min_priority_1: toFiniteNumber(o.min_priority_1),
    min_priority_2: toFiniteNumber(o.min_priority_2),
    min_priority_3: toFiniteNumber(o.min_priority_3),
    restriction: o.restriction ?? null,
    isNationalRegistration:
      toBool(o.isNationalRegistration) ||
      toBool(u?.isNationalRegistration) ||
      toBool(s?.isNationalRegistration),
    isEcoleSuperieure:
      toBool(o.isEcoleSuperieure) ||
      toBool(u?.isEcoleSuperieure) ||
      toBool(s?.isEcoleSuperieure),
    __raw: o,
  } as unknown as Offering & { __raw: RawOff }
  return normalized
}

const ALL_OFFERINGS: Array<Offering & { __raw: RawOff }> = (OFFERINGS_RAW as RawOff[])
  .map(normalizeOffering)
  .filter((o): o is Offering & { __raw: RawOff } => o !== null)

const ACTIVE_UNI_CODES = new Set<string>(
  ALL_OFFERINGS.map((o) => (o as any).code_etablissement as string),
)

// ─── DOMAIN LABEL MAPS ────────────────────────────────────────────────────────
const DOMAIN_AR: Record<string, string> = {
  A: 'العلوم والتكنولوجيا', B: 'علوم المادة',
  C: 'الرياضيات والإعلام الآلي', D: 'علوم الطبيعة والحياة',
  E: 'علوم الأرض', F: 'العلوم الاقتصادية والتسيير',
  G: 'الحقوق والعلوم السياسية', H: 'اللغات والترجمة',
  I: 'العلوم الإنسانية والاجتماعية', J: 'النشاطات البدنية والرياضية',
  K: 'الفنون', L: 'الآداب العربية', M: 'الآداب',
  N: 'العمارة والعمران', P: 'العلوم الطبية',
}
const DOMAIN_FR: Record<string, string> = {
  A: 'Sciences et Technologie', B: 'Sciences de la Matière',
  C: 'Mathématiques et Informatique', D: 'Sciences de la Nature et de la Vie',
  E: 'Sciences de la Terre', F: 'Sciences Économiques, Commerciales et de Gestion',
  G: 'Droit et Sciences Politiques', H: 'Langues et Traduction',
  I: 'Sciences Humaines et Sociales', J: 'Activités Physiques et Sportives',
  K: 'Arts', L: 'Lettres Arabes', M: 'Lettres',
  N: 'Architecture et Urbanisme', P: 'Sciences Médicales',
}

// ─── BAC SERIES MAPPING ───────────────────────────────────────────────────────
const BAC_SERIES_MAP: Record<string, BacSeries> = {
  'sciences-exp': 'sciences_experimentales',
  'math': 'mathematiques',
  'tech-math': 'technique_math',
  'gestion-eco': 'gestion_economie',
  'letters-philo': 'lettres_philosophie',
  'languages': 'langues_etrangeres',
  'sciences_experimentales': 'sciences_experimentales',
  'mathematiques': 'mathematiques',
  'technique_math': 'technique_math',
  'gestion_economie': 'gestion_economie',
  'lettres_philosophie': 'lettres_philosophie',
  'langues_etrangeres': 'langues_etrangeres',
}
function normalizeSeries(raw: string): BacSeries {
  return BAC_SERIES_MAP[raw] ?? (raw as BacSeries)
}

async function getUserId() {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')
  return session.user.id
}

// ─── TYPES ────────────────────────────────────────────────────────────────────
export type SpecialtyCatalogItem = {
  id: string
  codes: string[]
  nameAr: string
  nameFr: string
  displayName: string
  fieldAr: string
  fieldFr: string
  domain: string
  minGrade: number | null
  universitiesCount: number
  durationYears: number
  careerPaths: string[]
  descriptionAr: string
  requiredSeries: string[]
}

export type UniversityCatalogItem = {
  id: string
  code: string
  nameFr: string
  nameAr: string
  displayName: string
  wilaya: string
  type: string
  specialtiesCount: number
  keySpecialties: string[]
  domains: string[]
}

const DOMAIN_SERIES: Record<string, string[]> = {
  A: ['math', 'sciences-exp', 'tech-math'],
  B: ['sciences-exp', 'math', 'tech-math'],
  C: ['sciences-exp', 'math', 'tech-math'],
  D: ['sciences-exp', 'math'],
  E: ['sciences-exp', 'math'],
  F: ['gestion-eco', 'sciences-exp', 'math'],
  G: ['letters-philo', 'gestion-eco', 'languages', 'sciences-exp', 'math'],
  H: ['languages', 'letters-philo'],
  I: ['letters-philo', 'languages', 'sciences-exp', 'gestion-eco'],
  J: ['sciences-exp', 'math', 'tech-math', 'letters-philo', 'gestion-eco', 'languages'],
  K: ['letters-philo', 'languages', 'gestion-eco', 'sciences-exp'],
  L: ['letters-philo', 'languages'],
  M: ['letters-philo', 'languages'],
  N: ['math', 'tech-math', 'sciences-exp'],
  P: ['sciences-exp', 'math'],
}
const DOMAIN_DURATION: Record<string, number> = {
  P: 7, A: 5, N: 5, B: 3, C: 3, D: 3, E: 3,
  F: 4, G: 4, H: 3, I: 4, J: 3, K: 3, L: 3, M: 3,
}
const DOMAIN_CAREERS: Record<string, string[]> = {
  A: ['مهندس', 'تقني متخصص', 'باحث', 'مدير مشاريع'],
  B: ['باحث فيزياء/كيمياء', 'تقني مختبر', 'مهندس مواد', 'أستاذ'],
  C: ['مطور برمجيات', 'مهندس معلوماتية', 'محلل بيانات', 'باحث'],
  D: ['بيولوجي', 'بيطري', 'تقني زراعي', 'باحث بيئي'],
  E: ['جيولوجي', 'مهندس مناجم', 'باحث بيئي', 'خبير موارد طبيعية'],
  F: ['اقتصادي', 'محلل مالي', 'مدير أعمال', 'محاسب'],
  G: ['محامٍ', 'قاضٍ', 'مستشار قانوني', 'دبلوماسي'],
  H: ['مترجم', 'أستاذ لغات', 'مستشار ثقافي', 'دبلوماسي'],
  I: ['باحث اجتماعي', 'عالم نفس', 'أستاذ', 'مستشار'],
  J: ['مدرب رياضي', 'أستاذ تربية بدنية', 'معالج حركي', 'مدير نادٍ'],
  K: ['فنان', 'مصمم', 'مدرس فنون', 'منتج إبداعي'],
  L: ['أستاذ أدب عربي', 'كاتب', 'صحفي', 'محقق تراثي'],
  M: ['أستاذ آداب', 'كاتب', 'مترجم أدبي', 'ناقد أدبي'],
  N: ['مهندس معماري', 'مخطط عمراني', 'مصمم داخلي', 'خبير تراث'],
  P: ['طبيب', 'صيدلاني', 'طبيب أسنان', 'باحث طبي'],
}

// ─── SPECIALTY CATALOGUE — grouped by canonical French name ──────────────────
// Rule D.2: every emitted item carries a compound (specialty|university)
// identifier downstream, but the catalogue itself remains per-specialty.
function buildSpecialtiesCatalogue(): SpecialtyCatalogItem[] {
  const thresholdsByCode = new Map<string, number[]>()
  const universitiesByCode = new Map<string, Set<string>>()
  for (const o of ALL_OFFERINGS) {
    const code = (o as any).code_filiere as string
    const uni = (o as any).code_etablissement as string
    if (!code) continue
    const ts = thresholdsByCode.get(code) ?? []
    for (const v of [
      (o as any).min_priority_1,
      (o as any).min_priority_2,
      (o as any).min_priority_3,
    ]) {
      const n = toFiniteNumber(v)
      if (n !== null) ts.push(n)
    }
    if (!thresholdsByCode.has(code)) thresholdsByCode.set(code, ts)
    if (uni) {
      const set = universitiesByCode.get(code) ?? new Set<string>()
      set.add(uni)
      if (!universitiesByCode.has(code)) universitiesByCode.set(code, set)
    }
  }

  type Bucket = {
    displayName: string
    nameFr: string
    nameAr: string
    domain: string
    codes: string[]
    thresholds: number[]
    universities: Set<string>
  }
  const groups = new Map<string, Bucket>()

  for (const s of SPECIALTIES_JSON as RawSpec[]) {
    if (!s?.code) continue
    const cleanedFr = cleanName(s.name_fr)
    if (isGarbageName(cleanedFr)) continue
    const unis = universitiesByCode.get(s.code)
    if (!unis || unis.size === 0) continue

    const key = canonicalKey(cleanedFr)
    if (!key) continue
    const domain = (s.code[0] ?? '').toUpperCase()
    const cleanedAr = (s.name_ar ?? cleanedFr).toString().trim() || cleanedFr

    let g = groups.get(key)
    if (!g) {
      g = {
        displayName: displayBilingual(cleanedFr, cleanedAr),
        nameFr: cleanedFr,
        nameAr: cleanedAr,
        domain,
        codes: [],
        thresholds: [],
        universities: new Set(),
      }
      groups.set(key, g)
    }
    g.codes.push(s.code)
    const ts = thresholdsByCode.get(s.code) ?? []
    for (const v of ts) g.thresholds.push(v)
    for (const u of unis) g.universities.add(u)
  }

  const out: SpecialtyCatalogItem[] = []
  for (const g of groups.values()) {
    const minGrade: number | null =
      g.thresholds.length > 0
        ? Math.round(Math.min(...g.thresholds) * 100) / 100
        : null
    out.push({
      id: g.codes[0],
      codes: g.codes,
      nameAr: g.nameAr,
      nameFr: g.nameFr,
      displayName: g.displayName,
      fieldAr: DOMAIN_AR[g.domain] ?? '',
      fieldFr: DOMAIN_FR[g.domain] ?? '',
      domain: g.domain,
      minGrade,
      universitiesCount: g.universities.size,
      durationYears: DOMAIN_DURATION[g.domain] ?? 3,
      careerPaths: DOMAIN_CAREERS[g.domain] ?? ['مهني متخصص'],
      descriptionAr: `تخصص في مجال ${DOMAIN_AR[g.domain] ?? ''}`.trim(),
      requiredSeries: DOMAIN_SERIES[g.domain] ?? [],
    })
  }
  out.sort((a, b) => a.nameFr.localeCompare(b.nameFr, 'fr'))
  return out
}

const SPECIALTIES_CATALOGUE: SpecialtyCatalogItem[] = buildSpecialtiesCatalogue()

// ─── ARABIC UNIVERSITY NAME MAP (official MESRS 2025) ────────────────────────
const UNI_AR_NAMES: Record<string, string> = {
  'U001': 'جامعة الجزائر 1 بن يوسف بن خدة',
  'U002': 'جامعة الجزائر 2 أبو القاسم سعد الله',
  'U003': 'جامعة الجزائر 3',
  'U004': 'جامعة عبد الحميد مهري قسنطينة 2',
  'U005': 'جامعة منتوري الإخوة قسنطينة 1',
  'U006': 'جامعة قسنطينة 3 صالح بوبنيدر',
  'U007': 'جامعة وهران 1 أحمد بن بلة',
  'U008': 'جامعة وهران 2 محمد بن أحمد',
  'U009': 'جامعة عبد البلعيد بجاية',
  'U010': 'جامعة عبد الرحمن ميرة بجاية',
  'U011': 'جامعة الحاج لخضر باتنة 1',
  'U012': 'جامعة عباس لغرور باتنة 2',
  'U013': 'جامعة فرحات عباس سطيف 1',
  'U014': 'جامعة محمد لمين دباغين سطيف 2',
  'U015': 'جامعة أبي بكر بلقايد تلمسان',
  'U016': 'جامعة مولود معمري تيزي وزو',
  'U017': 'جامعة محمد خيضر بسكرة',
  'U018': 'جامعة عنابة باجي مختار',
  'U019': 'جامعة البليدة 1 سعد دحلب',
  'U020': 'جامعة علي لونيسي البليدة 2',
  'U021': 'جامعة محمد بوضياف المسيلة',
  'U022': 'جامعة جيجل محمد الصديق بن يحيى',
  'U023': 'جامعة أم البواقي العربي بن مهيدي',
  'U024': 'جامعة الوادي حمة لخضر',
  'U025': 'جامعة المدية يحيى فارس',
  'U026': 'جامعة ورقلة قاصدي مرباح',
  'U027': 'جامعة المسيلة',
  'U028': 'جامعة برج بوعريريج محمد البشير الإبراهيمي',
  'U029': 'جامعة غليزان',
  'U030': 'جامعة مستغانم عبد الحميد بن باديس',
  'U031': 'جامعة سكيكدة 20 أوت 1955',
  'U032': 'جامعة خنشلة',
  'U033': 'جامعة سوق أهراس',
  'U034': 'جامعة تيبازة',
  'U035': 'جامعة تيسمسيلت',
  'U036': 'جامعة ميلة عبد الحفيظ بوالصوف',
  'U037': 'جامعة معسكر مصطفى إسطنبولي',
  'U038': 'جامعة بومرداس أمحمد بوقرة',
  'U039': 'جامعة سيدي بلعباس جيلالي اليابس',
  'U040': 'جامعة تبسة العربي التبسي',
  'U041': 'جامعة البويرة أكلي محند أولحاج',
  'U042': 'جامعة أدرار أحمد دراية',
  'U043': 'جامعة تندوف',
  'U044': 'جامعة إيليزي',
  'U045': 'جامعة إن قزام',
  'U046': 'جامعة تمنراست',
}

function getArabicUniName(code: string, nameFr: string): string {
  if (UNI_AR_NAMES[code]) return UNI_AR_NAMES[code]
  const fr = nameFr.toLowerCase()
  if (fr.includes('annexe')) {
    const wilayaPart = fr.split('annexe')[1]?.trim()
    return `ملحقة ${wilayaPart ? wilayaPart.charAt(0).toUpperCase() + wilayaPart.slice(1) : ''}`
  }
  if (fr.includes('université') || fr.includes('university')) {
    return nameFr.replace(/université/gi, 'جامعة').replace(/university/gi, 'جامعة')
  }
  if (fr.includes('école normale supérieure')) {
    return nameFr.replace(/école normale supérieure/gi, 'المدرسة العليا للأساتذة')
  }
  if (fr.includes('école nationale')) {
    return nameFr.replace(/école nationale/gi, 'المدرسة الوطنية')
  }
  if (fr.includes('école supérieure')) {
    return nameFr.replace(/école supérieure/gi, 'المدرسة العليا')
  }
  if (fr.includes('centre universitaire')) {
    return nameFr.replace(/centre universitaire/gi, 'المركز الجامعي')
  }
  if (fr.includes('institut national')) {
    return nameFr.replace(/institut national/gi, 'المعهد الوطني')
  }
  return nameFr
}

// ─── UNIVERSITY CATALOGUE ────────────────────────────────────────────────────
function deriveUniversityTypeAr(code: string, nameFr: string): string {
  const fr = nameFr.toLowerCase()
  if (fr.includes('école normale supérieure')) return 'مدرسة عليا للأساتذة'
  if (fr.includes('école nationale polytechnique') || fr.includes('enp')) return 'مدرسة وطنية متعددة التقنيات'
  if (fr.includes('école nationale')) return 'مدرسة وطنية'
  if (fr.includes('école supérieure')) return 'مدرسة عليا'
  if (fr.includes('centre universitaire')) return 'مركز جامعي'
  if (fr.includes('institut national')) return 'معهد وطني'
  const c = (code?.[0] ?? '').toUpperCase()
  if (c === 'U') return 'جامعة'
  if (c === 'C') return 'مركز جامعي'
  if (c === 'E' || c === 'S' || c === 'B' || c === 'P') return 'مدرسة/معهد'
  return 'مؤسسة جامعية'
}

const WILAYA_AR: Record<string, string> = {
  'Adrar': 'أدرار', 'Ain Defla': 'عين الدفلى', 'Ain Temouchent': 'عين تموشنت',
  'Alger': 'الجزائر', 'Annaba': 'عنابة', 'Batna': 'باتنة',
  'Bechar': 'بشار', 'Bejaia': 'بجاية', 'Biskra': 'بسكرة',
  'Blida': 'البليدة', 'Bordj Bou Arreridj': 'برج بوعريريج',
  'Bouira': 'البويرة', 'Boumerdes': 'بومرداس', 'Chlef': 'الشلف',
  'Constantine': 'قسنطينة', 'Djelfa': 'الجلفة', 'El Bayadh': 'البيض',
  'El Oued': 'الوادي', 'El Tarf': 'الطارف', 'Ghardaia': 'غرداية',
  'Guelma': 'قالمة', 'Illizi': 'إليزي', 'Jijel': 'جيجل',
  'Khenchela': 'خنشلة', 'Laghouat': 'الأغواط', 'Mascara': 'معسكر',
  'Medea': 'المدية', 'Mila': 'ميلة', 'Mostaganem': 'مستغانم',
  'Msila': 'المسيلة', 'Naama': 'النعامة', 'Oran': 'وهران',
  'Ouargla': 'ورقلة', 'Oum El Bouaghi': 'أم البواقي',
  'Relizane': 'غليزان', 'Saida': 'سعيدة', 'Setif': 'سطيف',
  'Sidi Bel Abbes': 'سيدي بلعباس', 'Skikda': 'سكيكدة',
  'Souk Ahras': 'سوق أهراس', 'Tamanrasset': 'تمنراست', 'Tebessa': 'تبسة',
  'Tiaret': 'تيارت', 'Tindouf': 'تندوف', 'Tipaza': 'تيبازة',
  'Tissemsilt': 'تيسمسيلت', 'Tizi Ouzou': 'تيزي وزو',
  'Tlemcen': 'تلمسان',
  'Touggourt': 'تقرت',
}

function buildUniversitiesCatalogue(): UniversityCatalogItem[] {
  type Agg = { count: number; filieres: string[]; domains: Set<string> }
  const byUni = new Map<string, Agg>()
  for (const o of ALL_OFFERINGS) {
    const uniCode = (o as any).code_etablissement as string
    const filiereNm = (o as any).filiere as string
    const specCode = (o as any).code_filiere as string
    if (!uniCode) continue
    let agg = byUni.get(uniCode)
    if (!agg) { agg = { count: 0, filieres: [], domains: new Set<string>() }; byUni.set(uniCode, agg) }
    agg.count++
    if (filiereNm && agg.filieres.length < 8 && !agg.filieres.includes(filiereNm)) {
      agg.filieres.push(filiereNm)
    }
    const dk = (specCode?.[0] ?? '').toUpperCase()
    if (dk) agg.domains.add(dk)
  }

  const uniqueUnis = new Map<string, RawUni>()
  for (const u of UNIVERSITIES_JSON as RawUni[]) {
    if (u?.code && !uniqueUnis.has(u.code)) uniqueUnis.set(u.code, u)
  }

  const out: UniversityCatalogItem[] = []
  for (const u of uniqueUnis.values()) {
    if (!ACTIVE_UNI_CODES.has(u.code)) continue
    const cleanedNameFr = cleanName(u.name_fr) || u.name_fr
    const nameAr = u.name_ar?.trim() || getArabicUniName(u.code, cleanedNameFr)
    const wilayaAr = WILAYA_AR[u.wilaya ?? ''] ?? u.wilaya ?? ''
    const agg = byUni.get(u.code)
    const domains = agg
      ? Array.from(agg.domains).map((k) => DOMAIN_AR[k]).filter(Boolean) as string[]
      : []
    out.push({
      id: u.code,
      code: u.code,
      nameFr: cleanedNameFr,
      nameAr,
      displayName: displayBilingual(cleanedNameFr, nameAr),
      wilaya: wilayaAr,
      type: deriveUniversityTypeAr(u.code, cleanedNameFr),
      specialtiesCount: agg?.count ?? 0,
      keySpecialties: agg?.filieres ?? [],
      domains: domains.slice(0, 4),
    })
  }
  out.sort((a, b) => a.nameFr.localeCompare(b.nameFr, 'fr'))
  return out
}

const UNIVERSITIES_CATALOGUE: UniversityCatalogItem[] = buildUniversitiesCatalogue()

// ═══════════════════════════════════════════════════════════════════════════════
// STAGE 4 — SCORING / FILTERING / RANKING
// ═══════════════════════════════════════════════════════════════════════════════

const SERIES_ELIGIBLE_DOMAINS: Record<string, string[]> = {
  sciences_experimentales: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'I', 'J', 'K', 'P'],
  mathematiques: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'I', 'J', 'K', 'N', 'P'],
  technique_math: ['A', 'B', 'C', 'F', 'G', 'I', 'J', 'K', 'N'],
  gestion_economie: ['F', 'G', 'I', 'J', 'K'],
  lettres_philosophie: ['G', 'H', 'I', 'J', 'K', 'L', 'M'],
  langues_etrangeres: ['G', 'H', 'I', 'J', 'K', 'L', 'M'],
}

const INTEREST_TO_DOMAINS: Record<string, string[]> = {
  sciences: ['B', 'C', 'D', 'E', 'P'],
  tech: ['C', 'A'],
  engineering: ['A', 'C', 'B'],
  medicine: ['P', 'D'],
  business: ['F'],
  law: ['G'],
  education: ['I', 'L', 'M', 'H'],
  sports: ['J'],
  env: ['D', 'E'],
  languages: ['H', 'M', 'L'],
  politics: ['G', 'I'],
  arts: ['K', 'M', 'N'],
}

// ─── Rule A — ADAPTIVE MAX MARGIN ────────────────────────────────────────────
/**
 * Dynamic margin ceiling that opens the candidate window for high-achievers
 * so elite medicine / engineering options stay reachable.
 *   ≥18.00 → 4.5
 *   ≥17.00 → 5.0
 *   ≥16.00 → 5.5
 *   else   → 6.5
 */
function maxAllowedMargin(studentGrade: number): number {
  if (studentGrade >= 18.0) return 4.5
  if (studentGrade >= 17.0) return 5.0
  if (studentGrade >= 16.0) return 5.5
  return 6.5
}

// Used in the Groq prompt so the LLM sees the same ceiling.
function promptMaxMargin(studentGrade: number): number {
  return maxAllowedMargin(studentGrade)
}

// ─── Rule B — HIGH-ACHIEVER SAFETY FILTER ────────────────────────────────────
/**
 * If student grade ≥ 16.00, DROP any common low-barrier offering whose
 * minimum entry requirement is ≤ 11.00, UNLESS it is explicitly flagged
 * isNationalRegistration === true OR isEcoleSuperieure === true (elite bypass).
 */
const HIGH_ACHIEVER_GRADE = 16.0
const LOW_BARRIER_MIN_GRADE = 11.0

function passesHighAchieverFilter(
  o: any,
  studentGrade: number,
): boolean {
  if (studentGrade < HIGH_ACHIEVER_GRADE) return true
  if (isEliteBypass(o, (o as any).__raw)) return true
  const thresholds = [
    toFiniteNumber(o.min_priority_1),
    toFiniteNumber(o.min_priority_2),
    toFiniteNumber(o.min_priority_3),
    toFiniteNumber(o?.evaluation?.thresholdUsed),
  ].filter((n): n is number => n !== null && n > 0)
  if (thresholds.length === 0) return true
  const minRequirement = Math.min(...thresholds)
  return minRequirement > LOW_BARRIER_MIN_GRADE
}

// ─── Combined candidate gate ─────────────────────────────────────────────────
function isCandidateOffering(
  o: any,
  studentGrade: number,
): boolean {
  // Rule B first — strict drop for high achievers facing trivial majors
  if (!passesHighAchieverFilter(o, studentGrade)) return false
  // Margin ceiling (Rule A)
  const mrg = toFiniteNumber(o?.evaluation?.margin)
  if (mrg !== null && mrg > maxAllowedMargin(studentGrade)) {
    if (!isEliteBypass(o, (o as any).__raw)) return false
  }
  return true
}

// ─── Rule C — PROPORTIONAL MARGIN PENALTY MATRIX ─────────────────────────────
/**
 * Penalty scales aggressively with margin once the gap exceeds 4.0 points.
 *   margin ≤ 4.0  →   0
 *   margin  4.0-5.0 → −10
 *   margin  5.0-6.0 → −25
 *   margin  6.0-8.0 → −45
 *   margin  >8.0   → −70
 * Elite-bypass offerings receive only half the penalty.
 */
const MARGIN_PENALTY_THRESHOLD = 4.0

function marginPenalty(margin: number | null, eliteBypass: boolean): number {
  if (margin === null || margin <= MARGIN_PENALTY_THRESHOLD) return 0
  const m = margin
  let p: number
  if (m <= 5.0) p = 10
  else if (m <= 6.0) p = 25
  else if (m <= 8.0) p = 45
  else p = 70
  if (eliteBypass) p = Math.round(p * 0.5)
  return p
}

function domainInterestScore(domainKey: string, interests: string[]): number {
  let best = 0
  for (const interest of interests) {
    const ordered = INTEREST_TO_DOMAINS[interest] ?? []
    const pos = ordered.indexOf(domainKey)
    if (pos === 0) best = Math.max(best, 10)
    else if (pos === 1) best = Math.max(best, 7)
    else if (pos >= 2) best = Math.max(best, 4)
  }
  return best
}

/**
 * Grade-match base score — rewards proximity to the student's grade.
 * The aggressive penalty for trivially-easy options is applied separately
 * via marginPenalty() so the two effects compose cleanly.
 */
function gradeMatchScore(
  threshold: number | null, 
  studentGrade: number,
  isEliteOrMedical: boolean = false
): number {
  if (threshold === null || threshold === 0) return 5
  const margin = studentGrade - threshold
  if (margin < 0) return -999

  // 1. STRICT DROP RULE: If student scored excellent (>= 16.00), automatically drop low-end regular branches
  if (studentGrade >= 16.00 && threshold <= 11.50 && !isEliteOrMedical) {
    return -999; // Drop completely from recommendations
  }

  // 2. DYNAMIC SCORE SEGMENTATION
  if (margin <= 1.5) return 25; // Boost very close targets (high match accuracy)
  if (margin <= 3.0) return 18;
  
  // 3. PENALTY SEGMENT: If a regular branch has a massive gap from a top student's score, demote it heavily
  if (margin > 4.0 && !isEliteOrMedical) {
    return 2; // Drastically drops the preference index of standard branches
  }

  // Fallback for standard acceptable margins
  if (margin <= 6.5) return 10;
  return 5;
}

function compositeScore(
  o: any,
  studentGrade: number,
  interests: string[],
): number {
  // تغطية كافة أسماء المتغيرات لضمان عدم حدوث Undefined
  const dk = (o.code_filiere?.[0] ?? o.specialtyCode?.[0] ?? (o as any).__raw?.specialty_code?.[0] ?? '').toUpperCase()
  const intScore = domainInterestScore(dk, interests)
  
  const thr = toFiniteNumber(o?.evaluation?.thresholdUsed)
  const mrg = toFiniteNumber(o?.evaluation?.margin)
  
  const elite = isEliteBypass(o, (o as any).__raw)
  const gm = gradeMatchScore(thr, studentGrade, elite)
  
  // 🚨 التدمير المطلق: أي تخصص يُرفض من دالة التقييم، يُدفن بسالب مليون ولن ينقذه أي شيء
  if (gm === -999) {
    return -999999;
  }
  
  // 🚨 تمت إزالة Math.max لكي تعمل النقاط بحرية والجزاءات تتطبق فعلياً
  const base = (intScore * 6) + (gm * 3) + (elite ? 25 : 0)
  
  return base - marginPenalty(mrg, elite)
}

// ═══════════════════════════════════════════════════════════════════════════════
// STAGE 2 — GROQ PAYLOAD (structurally identical fields the prompt expects)
// ═══════════════════════════════════════════════════════════════════════════════

async function getGroqRecommendations(
  data: {
    bacSeries: BacSeries
    bacGrade: number
    interests: string[]
    strengths: Record<string, number>
    workEnv: string
    priorities: string[]
  },
  eligibleOfferings: Array<Offering & { evaluation: ReturnType<typeof evaluateOffering> }>,
): Promise<
  Array<{
    offering: Offering & { evaluation: ReturnType<typeof evaluateOffering> }
    score: number
    reasons: string[]
  }>
> {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) throw new Error('GROQ_API_KEY missing')

  const sg = data.bacGrade
  const maxMrg = promptMaxMargin(sg)

  // Step 1 — apply Rule A + Rule B gate
  const strictFiltered = eligibleOfferings.filter((o) => isCandidateOffering(o, sg))
  const workingPool = strictFiltered.length >= 1 ? strictFiltered : eligibleOfferings

  // Step 2 — composite re-sort (includes Rule C penalty)
  const ranked = [...workingPool].sort(
    (a: any, b: any) =>
      compositeScore(b, sg, data.interests) - compositeScore(a, sg, data.interests),
  )

  // Step 3 — cap over-represented domains while keeping elite variety
  const domainCountCap = new Map<string, number>()
  const cappedFiltered = ranked.filter((o: any) => {
    const dk = (o.code_filiere?.[0] ?? '').toUpperCase()
    const intScore = domainInterestScore(dk, data.interests)
    const elite = isEliteBypass(o, (o as any).__raw)
    const maxAllowed = elite ? 6 : intScore > 0 ? 8 : 2
    const cur = domainCountCap.get(dk) ?? 0
    if (cur >= maxAllowed) return false
    domainCountCap.set(dk, cur + 1)
    return true
  })
  const cappedResult = cappedFiltered.length >= 8 ? cappedFiltered : ranked

  // Step 4 — Rule D.2 compound dedup: specialty|university (NOT specialty only)
  const seenCampus = new Map<string, typeof cappedResult[number]>()
  for (const o of cappedResult) {
    const campusKey = `${(o as any).code_filiere}|${(o as any).code_etablissement}`
    const ex = seenCampus.get(campusKey)
    const oPrio = (o as any).evaluation.admissionPriority ?? 9
    const exPrio = ex ? ((ex as any).evaluation.admissionPriority ?? 9) : 9
    const oMrg = (o as any).evaluation.margin ?? 999
    const exMrg = ex ? ((ex as any).evaluation.margin ?? 999) : 999
    if (!ex || oPrio < exPrio || (oPrio === exPrio && oMrg < exMrg)) {
      seenCampus.set(campusKey, o)
    }
  }
  const dedupedFiltered = Array.from(seenCampus.values()).sort(
    (a: any, b: any) =>
      compositeScore(b, sg, data.interests) - compositeScore(a, sg, data.interests),
  )

  // Step 5 — drop garbage names
  const namedOnly = dedupedFiltered.filter((o: any) => {
    const name = (o.filiere ?? '').trim()
    if (/^[A-Z]\d{2}[A-Z]{3}\d{2}/.test(name)) return false
    if (/^Fb\s/i.test(name)) return false
    if (name.length < 6) return false
    return true
  })
  const readyForAI = namedOnly.length >= 5 ? namedOnly : dedupedFiltered

  // Step 6 — build payload (same field shape the prompt already expects)
  const offeringsForAI = readyForAI.slice(0, 30).map((o: any) => {
    const thr = toFiniteNumber(o.evaluation.thresholdUsed) ?? 0
    const mrg = toFiniteNumber(o.evaluation.margin) ?? 0
    const dk = (o.code_filiere?.[0] ?? '').toUpperCase()
    const tier =
      mrg <= 1.0 ? 'reach' :
      mrg <= 3.0 ? 'match' :
      mrg <= maxMrg ? 'comfortable' : 'safety'
    return {
      // Rule D.2 — compound key prevents location collapsing in the LLM step
      key: `${o.code_etablissement}|${o.code_filiere}`,
      filiere: o.filiere,
      etablissement: o.etablissement,
      domain: DOMAIN_AR[dk] ?? dk,
      domain_key: dk,
      threshold: thr > 0 ? Number(thr.toFixed(2)) : null,
      margin: Number(mrg.toFixed(2)),
      tier,
      is_elite: isEliteBypass(o, (o as any).__raw),
      interest_score: domainInterestScore(dk, data.interests),
    }
  })

  const lvl =
    sg >= 18 ? 'استثنائي (≥18)' :
    sg >= 16 ? 'ممتاز (≥16)' :
    sg >= 14 ? 'جيد جداً (14-16)' :
    sg >= 12 ? 'جيد (12-14)' : 'متوسط (<12)'

  const topStrengths = Object.entries(data.strengths)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([k, v]) => `${k}=${v}/5`)
    .join(', ')

  const systemPrompt = `أنت مستشار توجيه جامعي جزائري محترف. مهمتك اختيار أفضل 10 تخصصات من القائمة المقدمة.

قواعد صارمة:
1. استخدم فقط key من القائمة المقدمة — لا تخترع أي key جديد.
2. الأولوية المطلقة للتخصصات ذات interest_score > 0 (تتوافق مع اهتمامات الطالب).
3. للطالب بمعدل ≥16: أعطِ الأولوية للتخصصات ذات is_elite=true وtier=reach أو match.
4. لا توصي بأكثر من 2 تخصص من نفس domain_key (إلا للنخبوي).
5. match_score يعكس: interest_score×50% + توافق القدرات×30% + tier×20%.
   - tier=reach: +15. tier=match: +10. margin>4 يعاقَب بشدة عند interest_score=0.
6. كل reason جملة عربية قصيرة (<18 كلمة) تربط التخصص بمعطى حقيقي من ملف الطالب.
7. أعد JSON فقط: {"results":[{"key":"...","match_score":85,"reasons":["...","...","..."]}]}`

  const userPrompt = `ملف الطالب:
- الشعبة: ${data.bacSeries} | المعدل: ${sg}/20 (${lvl})
- الاهتمامات: ${data.interests.join(', ') || 'غير محدد'}
- القدرات (1-5): ${topStrengths}
- بيئة العمل المفضلة: ${data.workEnv}
- الأولويات المهنية: ${data.priorities.slice(0, 3).join(', ') || 'غير محدد'}

التخصصات المتاحة (${offeringsForAI.length} خيار):
${JSON.stringify(offeringsForAI, null, 2)}

تعليمات الترتيب:
1. ابدأ بالتخصصات التي interest_score ≥ 7 وis_elite=true أو tier=reach.
2. ثم interest_score 4-6 مع tier=reach أو match.
3. أخيراً الباقي — لكن فقط إذا احتجت لإكمال العدد 10.
الطالب بمعدل ${sg}/20 — لا تملأ القائمة بتخصصات safety ذات margin>${maxMrg} وinterest_score=0.`

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 1600,
      temperature: 0.05,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    }),
  })

  if (!response.ok) {
    throw new Error(`Groq HTTP ${response.status}: ${await response.text()}`)
  }

  const resData = await response.json()
  console.log(
    '🤖 Groq executed — sent', offeringsForAI.length,
    'offerings (after strict filter: kept', strictFiltered.length, 'of', eligibleOfferings.length, ')',
    '| maxMargin:', maxMrg,
  )
  const raw: string = resData?.choices?.[0]?.message?.content ?? '{}'

  let parsed: Array<{ key: string; match_score: number; reasons: string[] }>
  try {
    const obj = JSON.parse(raw)
    const arr = Array.isArray(obj)
      ? obj
      : (Object.values(obj).find(Array.isArray) as typeof parsed)
    parsed = arr ?? []
  } catch {
    throw new Error(`Groq returned invalid JSON: ${raw.slice(0, 200)}`)
  }

  const sentKeys = new Set(offeringsForAI.map((o: any) => o.key))
  const byKey = new Map(
    eligibleOfferings
      .filter((o: any) => sentKeys.has(`${o.code_etablissement}|${o.code_filiere}`))
      .map((o: any) => [`${o.code_etablissement}|${o.code_filiere}`, o]),
  )

  const rawResults = parsed
    .slice(0, 15)
    .map((r) => {
      const offering = byKey.get(r.key)
      if (!offering) return null
      return {
        offering,
        score: Math.max(50, Math.min(97, Math.round(r.match_score))),
        reasons: (r.reasons ?? []).slice(0, 3) as string[],
      }
    })
    .filter((x): x is NonNullable<typeof x> => x !== null)

  // Post-Groq dedup — by compound (specialty|university) key
  const postDomainCount = new Map<string, number>()
  const seenCampusPost = new Set<string>()
  const results: typeof rawResults = []
  rawResults.sort((a, b) => b.score - a.score)
  for (const r of rawResults) {
    const dk = ((r.offering as any).code_filiere?.[0] ?? '').toUpperCase()
    const campusKey = `${(r.offering as any).code_filiere}|${(r.offering as any).code_etablissement}`
    if (seenCampusPost.has(campusKey)) continue
    const intScore = domainInterestScore(dk, data.interests)
    const maxPerDomain = intScore > 0 ? 3 : 2
    const cur = postDomainCount.get(dk) ?? 0
    if (cur >= maxPerDomain) continue
    results.push(r)
    postDomainCount.set(dk, cur + 1)
    seenCampusPost.add(campusKey)
    if (results.length >= 10) break
  }

  return results
}

// ─── DETERMINISTIC FALLBACK ──────────────────────────────────────────────────
function deterministicTop5(
  eligible: Array<Offering & { evaluation: ReturnType<typeof evaluateOffering> }>,
  data: {
    bacGrade: number
    interests: string[]
    strengths: Record<string, number>
    workEnv: string
    priorities: string[]
  },
): Array<{
  offering: Offering & { evaluation: ReturnType<typeof evaluateOffering> }
  score: number
  reasons: string[]
}> {
  const sg = data.bacGrade

  const safeEligible = eligible.filter((o) => isCandidateOffering(o, sg))
  const workingEligible = safeEligible.length >= 3 ? safeEligible : eligible

  const scored = workingEligible.map((o: any) => {
    const dk = (o.code_filiere?.[0] ?? '').toUpperCase()
    const intScore = domainInterestScore(dk, data.interests)
    const mrg = toFiniteNumber(o.evaluation.margin)
    const gmScore = gradeMatchScore(toFiniteNumber(o.evaluation.thresholdUsed), sg)
    const elite = isEliteBypass(o, (o as any).__raw)
    const base = intScore * 6 + Math.max(0, gmScore) * 3 + (elite ? 18 : 0)
    const composite = base - marginPenalty(mrg, elite)
    return { o, dk, intScore, composite, mrg, gmScore, isElite: elite }
  })

  scored.sort((a, b) => b.composite - a.composite)

  // Rule D.2 — compound campus dedup
  const perDomain = new Map<string, number>()
  const seenCampus = new Set<string>()
  const out: typeof scored = []
  for (const s of scored) {
    const campusKey = `${(s.o as any).code_filiere}|${(s.o as any).code_etablissement}`
    if (seenCampus.has(campusKey)) continue
    const n = perDomain.get(s.dk) ?? 0
    const maxForDomain = s.isElite ? 3 : 2
    if (n >= maxForDomain) continue
    out.push(s)
    perDomain.set(s.dk, n + 1)
    seenCampus.add(campusKey)
    if (out.length >= 5) break
  }

  return out.map(({ o, intScore, mrg, isElite }) => {
    const dk = (o as any).code_filiere?.[0]?.toUpperCase() ?? ''
    const domainName = DOMAIN_AR[dk] ?? ''
    const thr = toFiniteNumber((o as any).evaluation.thresholdUsed)
    const prio = (o as any).evaluation.admissionPriority
    const reasons: string[] = []

    if (isElite) {
      reasons.push(`مؤسسة نخبوية — معدلك ${data.bacGrade.toFixed(2)} يؤهلك للتنافس على هذا التخصص.`)
    }
    if (intScore > 0) {
      const matchedInterests = data.interests
        .filter((i) => (INTEREST_TO_DOMAINS[i] ?? []).includes(dk))
        .map((i) => ({
          sciences: 'العلوم', tech: 'التكنولوجيا', engineering: 'الهندسة',
          medicine: 'الطب', business: 'الأعمال', law: 'القانون',
          education: 'التعليم', sports: 'الرياضة', env: 'البيئة',
          languages: 'اللغات', politics: 'السياسة', arts: 'الفن',
        }[i] ?? i))
      if (matchedInterests.length > 0) {
        reasons.push(`يتوافق مع اهتمامك بـ${matchedInterests.join('، ')} في مجال ${domainName}.`)
      }
    }
    reasons.push(
      prio === 1
        ? `مقبول بالأولوية الأولى — الحد الأدنى ${thr?.toFixed(2) ?? '—'}.`
        : `معدلك ${data.bacGrade.toFixed(2)} يتخطى الحد الأدنى (${thr?.toFixed(2) ?? '—'}).`,
    )
    if (reasons.length < 2) {
      reasons.push(`تخصص في مجال ${domainName} يناسب مستواك الأكاديمي.`)
    }

    const gmS = gradeMatchScore(thr, data.bacGrade)
    const penalty = marginPenalty(mrg, isElite)
    const ms = Math.min(
      93,
      Math.max(50, 50 + intScore * 4 + Math.max(0, gmS) * 2 + (isElite ? 10 : 0) - penalty),
    )
    return { offering: o, score: Math.round(ms), reasons: reasons.slice(0, 3) }
  })
}

// ─── PROFILE ──────────────────────────────────────────────────────────────────

export async function getStudentProfile() {
  const userId = await getUserId()
  const profiles = await db
    .select()
    .from(studentProfiles)
    .where(eq(studentProfiles.userId, userId))
    .limit(1)
  return profiles[0] || null
}

export async function createOrUpdateProfile(data: {
  bacSeries: string
  bacScore?: number
  wilaya: string
  preferredLanguage?: string
}) {
  const userId = await getUserId()
  const existing = await getStudentProfile()

  if (existing) {
    await db
      .update(studentProfiles)
      .set({
        bacSeries: data.bacSeries,
        bacScore: data.bacScore?.toString(),
        wilaya: data.wilaya,
        preferredLanguage: data.preferredLanguage || 'ar',
        updatedAt: new Date(),
      })
      .where(eq(studentProfiles.id, existing.id))
  } else {
    await db.insert(studentProfiles).values({
      userId,
      bacSeries: data.bacSeries,
      bacScore: data.bacScore?.toString(),
      wilaya: data.wilaya,
      preferredLanguage: data.preferredLanguage || 'ar',
    })
  }
  revalidatePath('/dashboard')
  revalidatePath('/settings')
}

// ─── RATE LIMITING ────────────────────────────────────────────────────────────

const UNLIMITED_EMAILS = ['mezianeakram757@gmail.com', 'YOUR_TEST_EMAIL_HERE']

export async function canRunAssessment(): Promise<{
  allowed: boolean
  hoursLeft: number
  attemptsUsed: number
  attemptsLeft: number
}> {
  const MAX_PER_DAY = 2
  const session = await auth()
  if (session?.user?.email && UNLIMITED_EMAILS.includes(session.user.email)) {
    return { allowed: true, hoursLeft: 0, attemptsUsed: 0, attemptsLeft: 99 }
  }
  const profile = await getStudentProfile()
  if (!profile?.lastAssessmentAt) {
    return { allowed: true, hoursLeft: 0, attemptsUsed: 0, attemptsLeft: MAX_PER_DAY }
  }
  const hoursSinceLast = (Date.now() - new Date(profile.lastAssessmentAt).getTime()) / 3_600_000
  if (hoursSinceLast >= 24) {
    return { allowed: true, hoursLeft: 0, attemptsUsed: 0, attemptsLeft: MAX_PER_DAY }
  }
  const used = profile.assessmentCount ?? 1
  const left = Math.max(0, MAX_PER_DAY - used)
  return {
    allowed: left > 0,
    hoursLeft: left > 0 ? 0 : Math.ceil(24 - hoursSinceLast),
    attemptsUsed: used,
    attemptsLeft: left,
  }
}

// ─── FULL ASSESSMENT SAVE + AI ────────────────────────────────────────────────

export async function saveFullAssessment(data: {
  interests: string[]
  strengths: Record<string, number>
  workEnv: string
  priorities: string[]
  bacSeries: string
  bacGrade: number
  wilayas: string[]
}) {
  const userId = await getUserId()
  const profile = await getStudentProfile()

  const answerEntries = [
    { questionId: 'interests', answer: JSON.stringify(data.interests), category: 'interests' },
    { questionId: 'strengths', answer: JSON.stringify(data.strengths), category: 'strengths' },
    { questionId: 'work_env', answer: data.workEnv, category: 'environment' },
    { questionId: 'priorities', answer: JSON.stringify(data.priorities), category: 'priorities' },
    { questionId: 'bac_series', answer: data.bacSeries, category: 'academic' },
    { questionId: 'bac_grade', answer: data.bacGrade.toString(), category: 'academic' },
    { questionId: 'wilayas', answer: JSON.stringify(data.wilayas), category: 'academic' },
  ]

  await db.delete(assessmentResponses).where(eq(assessmentResponses.userId, userId))
  for (const entry of answerEntries) {
    await db.insert(assessmentResponses).values({
      userId,
      questionId: entry.questionId,
      answer: entry.answer,
      category: entry.category,
    })
  }

  const normalizedSeries = normalizeSeries(data.bacSeries)
  const grades: BacGrades = { moyenne: data.bacGrade }

  console.log('🔍 [student.ts v4] saveFullAssessment:', {
    bacGrade: data.bacGrade,
    bacSeries: normalizedSeries,
    interests: data.interests,
    maxMargin: maxAllowedMargin(data.bacGrade),
    highAchiever: data.bacGrade >= HIGH_ACHIEVER_GRADE,
  })

  const wilaya = data.wilayas?.[0]
  const eligibleOfferings = rankAdmissibleOfferings(
    ALL_OFFERINGS as unknown as Offering[],
    normalizedSeries,
    grades,
    { wilaya, limit: 5000 },
  )

  const finalEligible =
    eligibleOfferings.length > 0
      ? eligibleOfferings
      : rankAdmissibleOfferings(ALL_OFFERINGS as unknown as Offering[], normalizedSeries, grades, { limit: 5000 })

  type ScoredResult = {
    offering: Offering & { evaluation: ReturnType<typeof evaluateOffering> }
    score: number
    reasons: string[]
  }

  let top5: ScoredResult[] = []
  let usedAI = false

  if (process.env.GROQ_API_KEY && finalEligible.length > 0) {
    try {
      top5 = await getGroqRecommendations(
        {
          bacSeries: normalizedSeries,
          bacGrade: data.bacGrade,
          interests: data.interests,
          strengths: data.strengths,
          workEnv: data.workEnv,
          priorities: data.priorities,
        },
        finalEligible,
      )
      usedAI = true
    } catch (e) {
      console.warn('⚠️ Groq unavailable, using deterministic fallback:', e)
    }
  }

  if (!usedAI || top5.length === 0) {
    const strictFiltered = finalEligible.filter((o: any) =>
      isCandidateOffering(o, data.bacGrade),
    )
    const poolForFallback = strictFiltered.length >= 1 ? strictFiltered : finalEligible
    top5 = deterministicTop5(poolForFallback, {
      bacGrade: data.bacGrade,
      interests: data.interests,
      strengths: data.strengths,
      workEnv: data.workEnv,
      priorities: data.priorities,
    })
  }

  // Rule D.2 — dedup by compound campus key (NOT by specialty alone)
  const seenCampus = new Map<string, typeof top5[number]>()
  for (const r of top5) {
    const o: any = r.offering
    const campusKey = `${o.code_filiere}|${o.code_etablissement}`
    const existing = seenCampus.get(campusKey)
    if (!existing || r.score > existing.score) seenCampus.set(campusKey, r)
  }
  const dedupedTop5 = Array.from(seenCampus.values())
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)

  await db.delete(recommendations).where(eq(recommendations.userId, userId))

  for (let i = 0; i < dedupedTop5.length; i++) {
    const r = dedupedTop5[i]
    const o: any = r.offering
    const domainKey = (o.code_filiere?.[0] ?? '').toUpperCase()
    const specItem = SPECIALTIES_CATALOGUE.find((s) => s.codes.includes(o.code_filiere))
    const nameAr = specItem?.nameAr ?? o.filiere
    const nameFr = specItem?.nameFr ?? o.filiere
    const uniItem = UNIVERSITIES_CATALOGUE.find((u) => u.code === o.code_etablissement)
    const etabFr = uniItem?.nameFr ?? o.etablissement
    const etabAr = uniItem?.nameAr ?? o.etablissement

    const payload = JSON.stringify({
      rank: i + 1,
      // Rule D.2 — compound key surfaces in stored UI payload
      uiKey: `${o.code_filiere}|${o.code_etablissement}`,
      specId: o.code_filiere,
      nameAr,
      nameFr,
      // Rule D.1 — single string when fr==ar (case-insensitive)
      displayName: displayBilingual(nameFr, nameAr),
      etablissementDisplay: displayBilingual(etabFr, etabAr),
      fieldAr: DOMAIN_AR[domainKey] ?? '',
      fieldFr: DOMAIN_FR[domainKey] ?? '',
      domain: domainKey,
      etablissement: o.etablissement,
      code_etablissement: o.code_etablissement,
      durationYears: specItem?.durationYears ?? DOMAIN_DURATION[domainKey] ?? 3,
      minGrade: toFiniteNumber(o.evaluation.thresholdUsed),
      careerPaths: specItem?.careerPaths ?? DOMAIN_CAREERS[domainKey] ?? [],
      descriptionAr: specItem?.descriptionAr ?? `تخصص في مجال ${DOMAIN_AR[domainKey] ?? nameFr}`,
      admissionPriority: o.evaluation.admissionPriority,
      studentScore: Number(o.evaluation.studentScore.toFixed(2)),
      margin: o.evaluation.margin != null ? Number(o.evaluation.margin.toFixed(2)) : null,
      reasons: r.reasons,
      usedClaude: usedAI,
    })

    await db.insert(recommendations).values({
      userId,
      matchScore: r.score.toString(),
      reasoningAr: payload,
    })
  }

  await db
    .update(studentProfiles)
    .set({
      assessmentCompleted: true,
      bacSeries: data.bacSeries,
      bacScore: data.bacGrade.toString(),
      lastAssessmentAt: new Date(),
      assessmentCount: (profile?.assessmentCount ?? 0) >= 1 ? 2 : 1,
      updatedAt: new Date(),
    })
    .where(eq(studentProfiles.userId, userId))

  await db
    .update(studentProfiles)
    .set({ cachedRecommendations: null, recommendationsCachedAt: null })
    .where(eq(studentProfiles.userId, userId))

  revalidatePath('/dashboard')
  revalidatePath('/results')
}

// ─── RESET ASSESSMENT ─────────────────────────────────────────────────────────

export async function resetAssessment() {
  const userId = await getUserId()
  await db.delete(recommendations).where(eq(recommendations.userId, userId))
  await db
    .update(studentProfiles)
    .set({
      assessmentCompleted: false,
      cachedRecommendations: null,
      recommendationsCachedAt: null,
      updatedAt: new Date(),
    })
    .where(eq(studentProfiles.userId, userId))
}

// ─── GET RECOMMENDATIONS ──────────────────────────────────────────────────────

// FIX: Defined explicitly (instead of deriving via Awaited<ReturnType<typeof getUserRecommendations>>)
// to break the circular type reference — getUserRecommendations() casts the cached JSON to
// RecommendationItem[], so a type derived from its own return type creates a cycle (TS2456),
// and without an explicit annotation TS also can't infer the return type (TS7023).
export interface RecommendationItem {
  id: number
  matchScore: number
  rank: number
  uiKey: string
  specId: string
  nameAr: string
  nameFr: string
  displayName: string
  etablissementDisplay: string
  fieldAr: string
  fieldFr: string
  domain: string
  etablissement: string
  code_etablissement: string
  durationYears: number
  minGrade: number | null
  careerPaths: string[]
  descriptionAr: string
  admissionPriority: number | null
  studentScore: number
  margin: number | null
  reasons: string[]
  usedML: boolean
  createdAt: Date
}

export async function getUserRecommendations(): Promise<RecommendationItem[]> {
  const userId = await getUserId()

  const profile = await getStudentProfile()
  if (profile?.cachedRecommendations && profile.recommendationsCachedAt) {
    const cacheAgeMs = Date.now() - new Date(profile.recommendationsCachedAt).getTime()
    const ONE_WEEK = 7 * 24 * 60 * 60 * 1000
    if (cacheAgeMs < ONE_WEEK) {
      try {
        return JSON.parse(profile.cachedRecommendations) as RecommendationItem[]
      } catch {
        // cache corrupt → fall through
      }
    }
  }

  const recs = await db
    .select()
    .from(recommendations)
    .where(eq(recommendations.userId, userId))
    .orderBy(desc(recommendations.matchScore))

  const parsed = recs
    .map((r) => {
      try {
        const p = JSON.parse(r.reasoningAr || '{}') as {
          rank?: number
          uiKey?: string
          specId?: string
          nameAr?: string
          nameFr?: string
          displayName?: string
          etablissementDisplay?: string
          fieldAr?: string
          fieldFr?: string
          domain?: string
          durationYears?: number
          minGrade?: number | null
          careerPaths?: string[]
          descriptionAr?: string
          reasons?: string[]
          usedClaude?: boolean
          etablissement?: string
          code_etablissement?: string
          admissionPriority?: number
          studentScore?: number
          margin?: number | null
        }
        const nameAr = p.nameAr ?? ''
        const nameFr = p.nameFr ?? ''
        return {
          id: r.id,
          matchScore: parseFloat(r.matchScore || '0'),
          rank: p.rank ?? 0,
          // Rule D.2 — preserve unique campus key, fallback to compound form
          uiKey: p.uiKey ?? `${p.specId ?? ''}|${p.code_etablissement ?? ''}`,
          specId: p.specId ?? '',
          nameAr,
          nameFr,
          // Rule D.1 — collapse identical fr/ar at read time too
          displayName: p.displayName ?? displayBilingual(nameFr, nameAr),
          etablissementDisplay: p.etablissementDisplay ?? p.etablissement ?? '',
          fieldAr: p.fieldAr ?? '',
          fieldFr: p.fieldFr ?? '',
          domain: p.domain ?? '',
          etablissement: p.etablissement ?? '',
          code_etablissement: p.code_etablissement ?? '',
          durationYears: p.durationYears ?? 0,
          minGrade: p.minGrade ?? null,
          careerPaths: (p.careerPaths ?? []) as string[],
          descriptionAr: p.descriptionAr ?? '',
          admissionPriority: p.admissionPriority ?? null,
          studentScore: p.studentScore ?? 0,
          margin: p.margin ?? null,
          reasons: (p.reasons ?? []) as string[],
          usedML: p.usedClaude ?? false,
          createdAt: r.createdAt,
        }
      } catch {
        return null
      }
    })
    .filter((r): r is NonNullable<typeof r> => r !== null)

  // Rule D.2 — dedup by compound (specialty|university), not by specialty alone
  const seenIds = new Map<string, typeof parsed[number]>()
  for (const r of parsed) {
    const k = r.uiKey || `${r.specId}|${r.code_etablissement}` || r.nameFr
    const ex = seenIds.get(k)
    if (!ex || r.matchScore > ex.matchScore) seenIds.set(k, r)
  }
  const deduped = Array.from(seenIds.values())
    .sort((a, b) => b.matchScore - a.matchScore)
    .map((r, i) => ({ ...r, rank: i + 1 }))

  if (profile && deduped.length > 0) {
    await db
      .update(studentProfiles)
      .set({ cachedRecommendations: JSON.stringify(deduped), recommendationsCachedAt: new Date() })
      .where(eq(studentProfiles.userId, userId))
  }

  return deduped
}

// ─── GET ASSESSMENT ANSWERS ───────────────────────────────────────────────────

export async function getAssessmentAnswers() {
  const userId = await getUserId()
  const rows = await db
    .select()
    .from(assessmentResponses)
    .where(eq(assessmentResponses.userId, userId))

  const map: Record<string, string> = {}
  for (const r of rows) map[r.questionId] = r.answer

  return {
    interests: map.interests ? (JSON.parse(map.interests) as string[]) : [],
    strengths: map.strengths ? (JSON.parse(map.strengths) as Record<string, number>) : {},
    workEnv: map.work_env ?? '',
    priorities: map.priorities ? (JSON.parse(map.priorities) as string[]) : [],
    bacSeries: map.bac_series ?? '',
    bacGrade: map.bac_grade ? parseFloat(map.bac_grade) : 0,
    wilayas: map.wilayas ? (JSON.parse(map.wilayas) as string[]) : [],
  }
}

// ─── COMBINED FETCH ───────────────────────────────────────────────────────────

export async function getStudentProfileWithRecs() {
  const [profile, recs] = await Promise.all([
    getStudentProfile(),
    getUserRecommendations(),
  ])
  return { profile, recs }
}

// ─── PUBLIC CATALOGUES ────────────────────────────────────────────────────────

export async function getSpecialtiesCatalogue() {
  return SPECIALTIES_CATALOGUE.map((s) => ({
    id: s.id,
    codes: s.codes,
    nameAr: s.nameAr,
    nameFr: s.nameFr,
    displayName: s.displayName,
    fieldAr: s.fieldAr,
    fieldFr: s.fieldFr,
    domain: s.domain,
    minGrade: s.minGrade,
    universitiesCount: s.universitiesCount,
    durationYears: s.durationYears,
    careerPaths: s.careerPaths,
    descriptionAr: s.descriptionAr,
    requiredSeries: s.requiredSeries,
  }))
}

export async function getUniversitiesCatalogue() {
  return UNIVERSITIES_CATALOGUE
}

// ─── LEGACY HELPERS ───────────────────────────────────────────────────────────

export async function saveAssessmentResponse(
  questionId: string,
  answer: string,
  category: string,
) {
  const userId = await getUserId()
  const existing = await db
    .select()
    .from(assessmentResponses)
    .where(
      and(
        eq(assessmentResponses.userId, userId),
        eq(assessmentResponses.questionId, questionId),
      ),
    )
    .limit(1)

  if (existing.length > 0) {
    await db
      .update(assessmentResponses)
      .set({ answer, category })
      .where(eq(assessmentResponses.id, existing[0].id))
  } else {
    await db
      .insert(assessmentResponses)
      .values({ userId, questionId, answer, category })
  }
}

export async function completeAssessment() {
  const userId = await getUserId()
  await db
    .update(studentProfiles)
    .set({ assessmentCompleted: true, updatedAt: new Date() })
    .where(eq(studentProfiles.userId, userId))
  revalidatePath('/dashboard')
}

export async function signOutServer() {
  await nextSignOut({ redirectTo: '/sign-in' })
}

// ─── LEGACY ALIAS ─────────────────────────────────────────────────────────────

export async function getRecommendations() {
  return getUserRecommendations()
}

// ─── SAVED SPECIALIZATIONS ────────────────────────────────────────────────────

export async function saveSpecialization(specializationId: number, notes?: string) {
  const userId = await getUserId()
  const existing = await db
    .select()
    .from(savedSpecializations)
    .where(
      and(
        eq(savedSpecializations.userId, userId),
        eq(savedSpecializations.specializationId, specializationId),
      ),
    )
    .limit(1)

  if (existing.length === 0) {
    await db.insert(savedSpecializations).values({ userId, specializationId, notes })
  }
  revalidatePath('/dashboard')
  revalidatePath('/saved')
}

export async function removeSavedSpecialization(specializationId: number) {
  const userId = await getUserId()
  await db
    .delete(savedSpecializations)
    .where(
      and(
        eq(savedSpecializations.userId, userId),
        eq(savedSpecializations.specializationId, specializationId),
      ),
    )
  revalidatePath('/dashboard')
  revalidatePath('/saved')
}

export async function getSavedSpecializations() {
  const userId = await getUserId()
  return db
    .select()
    .from(savedSpecializations)
    .where(eq(savedSpecializations.userId, userId))
    .orderBy(desc(savedSpecializations.createdAt))
}

export async function getAllSpecializations() {
  return db.select().from(specializations).orderBy(specializations.nameAr)
}

// ─── XP ───────────────────────────────────────────────────────────────────────

export async function addXP(points: number) {
  const userId = await getUserId()
  const profile = await getStudentProfile()
  if (!profile) return

  const newXP = (profile.xpPoints || 0) + points
  const newLevel = Math.floor(newXP / 100) + 1

  await db
    .update(studentProfiles)
    .set({ xpPoints: newXP, level: newLevel, updatedAt: new Date() })
    .where(eq(studentProfiles.userId, userId))

  revalidatePath('/dashboard')
}