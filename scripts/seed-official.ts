/**
 * Seeds the DB with the official MESRS BAC 2025 catalog.
 *
 *   pnpm tsx scripts/seed-official.ts
 *
 * Idempotent: uses ON CONFLICT DO UPDATE on `code`.
 *
 * Input JSON shapes (deduplicated, snake_case):
 *   universities.json -> { code, name_fr, annex_location, wilaya }
 *   specialties.json  -> { code, name_fr }
 *   offerings.json    -> { university_code, specialty_code,
 *                          min_priority_1, min_priority_2, min_priority_3,
 *                          restriction }
 *
 * 2025 fixes:
 *   • Cleans OCR-duplicated phrases ("Environnement et du Developpement de
 *     Environnement et du Developpement" → "Environnement et du Developpement").
 *   • Strips internal MESRS flags (FB SP / FB INF / FB TC / FB LMD) from labels.
 *   • Balances unclosed parentheses (e.g. "Automatique (A Distance" →
 *     "Automatique (À distance)").
 *   • Title-cases French labels for display, accents preserved.
 *   • Universities with ZERO offerings are skipped (removes phantom rows
 *     like extra ENS annexes that don't actually recruit in 2025).
 */
import { db } from '../lib/db'
import { universities, specializations, offerings } from '../lib/db/schema'
import UNIS from '../lib/data/universities.json'
import SPECS from '../lib/data/specialties.json'
import OFFS from '../lib/data/offerings.json'
import { sql } from 'drizzle-orm'

// ─── Raw JSON types ───────────────────────────────────────────────────────────
type UniRaw = {
  code: string
  name_fr: string
  annex_location?: string | null
  wilaya: string | null
}
type SpecRaw = { code: string; name_fr: string }
type OffRaw = {
  university_code: string
  specialty_code: string
  min_priority_1: number | null
  min_priority_2: number | null
  min_priority_3: number | null
  restriction?: string | null
}

// ─── Name cleaners (shared with app/actions/student.ts) ───────────────────────
function dedupAdjacent(text: string): string {
  let prev: string
  let out = text
  do {
    prev = out
    // collapse "X Y Z X Y Z" (2-6 word phrases repeated back-to-back)
    out = out.replace(/\b((?:[\p{L}\d]+\W+){1,6}[\p{L}\d]+)\W+\1\b/giu, '$1')
  } while (out !== prev)
  return out
}

function balanceParens(text: string): string {
  const opens  = (text.match(/\(/g) ?? []).length
  const closes = (text.match(/\)/g) ?? []).length
  if (opens > closes) return text + ')'.repeat(opens - closes)
  if (closes > opens) return '('.repeat(closes - opens) + text
  return text
}

function stripFlags(text: string): string {
  let s = text
    .replace(/^\s*FB\s+(SP|INF|TC|LMD)\s+/i, '')
    .replace(/\b(a|à)\s+distance\b/gi, 'À distance')
  return s.trim()
}

const SMALL_FR = new Set([
  'de','des','du','la','le','les','et','en','d','l','a','au','aux',
  'sur','pour','par','ou','un','une','à',
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

export function cleanName(raw: string | null | undefined): string {
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

// ─── Derivations ──────────────────────────────────────────────────────────────
function deriveUniversityType(code: string): string {
  const c = (code?.[0] ?? '').toUpperCase()
  switch (c) {
    case 'U': return 'UNIV'
    case 'C': return 'CENTRE'
    case 'E':
    case 'S':
    case 'B':
    case 'P': return 'ECOLE'
    default:  return 'AUTRE'
  }
}

const DOMAIN_FR: Record<string, string> = {
  A: 'Sciences et Technologie',
  B: 'Sciences de la Matière',
  C: 'Mathématiques et Informatique',
  D: 'Sciences de la Nature et de la Vie',
  E: 'Sciences de la Terre',
  F: 'Sciences Économiques, Commerciales et de Gestion',
  G: 'Droit et Sciences Politiques',
  H: 'Langues et Traduction',
  I: 'Sciences Humaines et Sociales',
  J: 'Activités Physiques et Sportives',
  K: 'Arts',
  L: 'Lettres Arabes',
  M: 'Lettres',
  N: 'Architecture et Urbanisme',
  P: 'Sciences Médicales',
}
function deriveDomainFr(specialtyCode: string): string {
  const c = (specialtyCode?.[0] ?? '').toUpperCase()
  return DOMAIN_FR[c] ?? 'Autre'
}

async function main() {
  // Build a set of university codes that actually appear in offerings
  // — this is how we filter phantom/orphan universities.
  const activeUniCodes = new Set<string>(
    (OFFS as OffRaw[]).map(o => o.university_code).filter(Boolean),
  )

  // ── Universities ────────────────────────────────────────────────────────────
  const unisAll = UNIS as UniRaw[]
  const unis = unisAll.filter(u => activeUniCodes.has(u.code))
  const skippedUnis = unisAll.length - unis.length
  console.log(`Seeding ${unis.length} universities (skipped ${skippedUnis} with 0 offerings)…`)

  let uDone = 0
  for (const u of unis) {
    const type   = deriveUniversityType(u.code)
    const wilaya = u.wilaya ?? 'NATIONAL'
    const nameFr = cleanName(u.name_fr) || u.name_fr
    await db.insert(universities).values({
      code: u.code, nameFr, wilaya, type,
    }).onConflictDoUpdate({
      target: universities.code,
      set: { nameFr, wilaya, type },
    })
    uDone++
    if (uDone % 25 === 0 || uDone === unis.length) {
      console.log(`  universities: ${uDone}/${unis.length}`)
    }
  }

  // ── Specialties ─────────────────────────────────────────────────────────────
  // Insert one row per code (DB schema requires unique code), but use the
  // cleaned French name so Explorer/AI see real names. The app layer further
  // groups by canonical name for display.
  const specs = SPECS as SpecRaw[]
  console.log(`Seeding ${specs.length} specialties…`)
  let sDone = 0, sSkipped = 0
  for (const s of specs) {
    const cleaned = cleanName(s.name_fr)
    if (isGarbageName(cleaned)) { sSkipped++; continue }
    const fieldFr = deriveDomainFr(s.code)
    await db.insert(specializations).values({
      code: s.code, nameFr: cleaned, fieldFr,
    }).onConflictDoUpdate({
      target: specializations.code,
      set: { nameFr: cleaned, fieldFr },
    })
    sDone++
    if (sDone % 50 === 0 || sDone === specs.length) {
      console.log(`  specialties: ${sDone}/${specs.length}`)
    }
  }
  if (sSkipped) console.log(`  (skipped ${sSkipped} garbage names)`)

  // ── Offerings (wipe + batch insert) ─────────────────────────────────────────
  console.log('Wiping previous offerings for 2025…')
  await db.execute(sql`DELETE FROM offerings WHERE year = 2025`)

  const offs  = (OFFS as OffRaw[]).filter(o => activeUniCodes.has(o.university_code))
  const total = offs.length
  console.log(`Inserting ${total} offerings…`)
  const BATCH = 500
  let inserted = 0
  for (let i = 0; i < total; i += BATCH) {
    const slice = offs.slice(i, i + BATCH)
    await db.insert(offerings).values(
      slice.map(o => ({
        universityCode: o.university_code,
        specialtyCode:  o.specialty_code,
        minPriority1: o.min_priority_1 != null ? o.min_priority_1.toString() : null,
        minPriority2: o.min_priority_2 != null ? o.min_priority_2.toString() : null,
        minPriority3: o.min_priority_3 != null ? o.min_priority_3.toString() : null,
        restriction: o.restriction ?? null,
        year: 2025,
      })),
    )
    inserted += slice.length
    console.log(`  Batch inserted ${inserted}/${total}`)
  }

  console.log('✅ Done.')
}

main().catch(e => { console.error(e); process.exit(1) })
