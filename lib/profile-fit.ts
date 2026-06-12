/**
 * Masarek — Deterministic profile-fit scorer.
 *
 * 100% rule-based: given a student profile + the list of admissible
 * offerings produced by lib/scoring.ts, this returns a ranked Top-N
 * where every score is reproducible and explainable.
 *
 * Groq is used ONLY (and optionally) to phrase 3 Arabic justification
 * sentences per result — never to rank, never to decide eligibility.
 */

import type {
  Offering,
  Eligibility,
  BacSeries,
} from './scoring'

// ── Domain keys (first letter of code_filiere) ───────────────────────────────
export type DomainKey =
  | 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G'
  | 'H' | 'I' | 'J' | 'K' | 'L' | 'M' | 'N' | 'P'

// ── Arabic labels (for templated reasons) ────────────────────────────────────
export const DOMAIN_AR: Record<DomainKey, string> = {
  A: 'العلوم والتكنولوجيا',
  B: 'علوم المادة',
  C: 'الرياضيات والإعلام الآلي',
  D: 'علوم الطبيعة والحياة',
  E: 'علوم الأرض',
  F: 'العلوم الاقتصادية والتسيير',
  G: 'الحقوق والعلوم السياسية',
  H: 'اللغات والترجمة',
  I: 'العلوم الإنسانية والاجتماعية',
  J: 'النشاطات البدنية والرياضية',
  K: 'الفنون',
  L: 'الآداب العربية',
  M: 'الآداب',
  N: 'العمارة والعمران',
  P: 'العلوم الطبية',
}

const INTEREST_AR: Record<string, string> = {
  sciences: 'العلوم', tech: 'التكنولوجيا', engineering: 'الهندسة',
  medicine: 'الطب', business: 'الأعمال', law: 'القانون',
  education: 'التعليم', sports: 'الرياضة', env: 'البيئة',
  languages: 'اللغات', politics: 'السياسة', arts: 'الفن',
}

const STRENGTH_AR: Record<string, string> = {
  logic: 'التحليل المنطقي', creativity: 'الإبداع', comms: 'التواصل',
  leadership: 'القيادة', math: 'الرياضيات', writing: 'الكتابة',
  problem: 'حل المشكلات', org: 'التنظيم',
}

const WORK_ENV_AR: Record<string, string> = {
  office: 'العمل المكتبي والتقني',
  field:  'العمل الميداني',
  people: 'العمل مع الناس',
  lab:    'البحث والمختبر',
}

// ── Interest → domains affinity ──────────────────────────────────────────────
const INTEREST_DOMAINS: Record<string, DomainKey[]> = {
  sciences:    ['B', 'C', 'D', 'E', 'P'],
  tech:        ['A', 'C', 'N'],
  engineering: ['A', 'N', 'B'],
  medicine:    ['P', 'D'],
  business:    ['F'],
  law:         ['G'],
  education:   ['I', 'L', 'M', 'H'],
  sports:      ['J'],
  env:         ['D', 'E'],
  languages:   ['H', 'M', 'L'],
  politics:    ['G', 'I'],
  arts:        ['K', 'M', 'N'],
}

// ── Required strengths per domain (with weights) ─────────────────────────────
// Sum of weights per domain ≈ 5 so the normalised score is comparable.
const DOMAIN_STRENGTHS: Record<DomainKey, Partial<Record<string, number>>> = {
  A: { logic: 1.5, math: 1.5, problem: 1.5, org: 0.5 },
  B: { logic: 1.5, math: 1.5, problem: 1.5, writing: 0.5 },
  C: { logic: 1.8, math: 1.8, problem: 1.0, creativity: 0.4 },
  D: { logic: 1.2, problem: 1.3, writing: 1.0, org: 0.5, math: 1.0 },
  E: { logic: 1.3, problem: 1.4, org: 1.0, math: 1.3 },
  F: { math: 1.3, logic: 1.2, org: 1.0, comms: 1.0, leadership: 0.5 },
  G: { writing: 1.4, comms: 1.4, logic: 1.2, org: 1.0 },
  H: { writing: 1.6, comms: 1.6, creativity: 1.0, org: 0.8 },
  I: { writing: 1.4, comms: 1.4, creativity: 1.0, logic: 1.2 },
  J: { leadership: 1.6, comms: 1.4, problem: 1.0, org: 1.0 },
  K: { creativity: 2.0, writing: 1.0, comms: 1.0, org: 1.0 },
  L: { writing: 1.8, creativity: 1.2, comms: 1.2, logic: 0.8 },
  M: { writing: 1.8, creativity: 1.2, comms: 1.2, logic: 0.8 },
  N: { creativity: 1.6, math: 1.2, logic: 1.0, problem: 1.2 },
  P: { logic: 1.5, math: 1.2, problem: 1.5, comms: 0.8 },
}

// ── Work-env → domains ───────────────────────────────────────────────────────
const WORK_ENV_DOMAINS: Record<string, DomainKey[]> = {
  office: ['C', 'F', 'G', 'H', 'K', 'M', 'L', 'I'],
  field:  ['A', 'D', 'E', 'J', 'N'],
  people: ['G', 'I', 'J', 'P', 'H', 'F'],
  lab:    ['B', 'C', 'D', 'E', 'P'],
}

// ── Priority (top-3, weighted by rank) → domains ─────────────────────────────
const PRIORITY_DOMAINS: Record<string, DomainKey[]> = {
  'الراتب المرتفع':        ['P', 'A', 'C', 'N', 'F'],
  'الاستقرار الوظيفي':    ['G', 'I', 'F', 'P', 'A', 'C'],
  'التأثير في المجتمع':   ['P', 'G', 'I', 'J', 'M', 'L'],
  'الإبداع والابتكار':    ['K', 'M', 'L', 'N', 'C', 'H'],
  'السفر والتنقل':         ['H', 'F', 'A', 'J'],
  'العمل الحر':            ['K', 'F', 'A', 'N', 'C'],
}

// ─────────────────────────────────────────────────────────────────────────────
export interface StudentProfile {
  bacSeries:  BacSeries
  bacGrade:   number
  interests:  string[]                       // e.g. ['tech', 'sciences']
  strengths:  Record<string, number>         // 1-5
  workEnv:    string                         // 'office' | 'field' | 'people' | 'lab'
  priorities: string[]                       // ranked, top-3 used
}

export interface FitBreakdown {
  base: number
  interest: number
  strength: number
  workEnv:  number
  priority: number
  margin:   number
  penalty:  number
  total:    number
  signals:  {
    matchedInterests:  string[]
    matchedStrengths:  string[]
    workEnvMatch:      boolean
    matchedPriorities: string[]
  }
}

/** Computes a profile-fit score (0-100) for a single domain. */
export function scoreDomain(
  domain: DomainKey,
  profile: StudentProfile,
  evaluation: Eligibility,
): FitBreakdown {
  // 1) Interest fit (0-30) — proportional to how many of the student's interests
  //    target this domain; first match weighted highest.
  const matchedInterests: string[] = []
  let interest = 0
  for (const i of profile.interests) {
    if ((INTEREST_DOMAINS[i] ?? []).includes(domain)) {
      matchedInterests.push(i)
    }
  }
  if (matchedInterests.length > 0) {
    interest = Math.min(30, 18 + 8 * Math.log2(matchedInterests.length + 1))
  }

  // 2) Strength fit (0-25) — weighted dot product between student strengths
  //    (1-5 each) and the domain's required-strength vector.
  const reqs = DOMAIN_STRENGTHS[domain] ?? {}
  const totalW = Object.values(reqs).reduce((a, b) => a + (b ?? 0), 0) || 1
  let acc = 0
  const matchedStrengths: string[] = []
  for (const [k, w] of Object.entries(reqs)) {
    const lvl = profile.strengths[k] ?? 0
    if (w == null) continue
    acc += (lvl / 5) * w
    if (lvl >= 4) matchedStrengths.push(k)
  }
  const strength = Math.round((acc / totalW) * 25)

  // 3) Work-env fit (0-8)
  const workEnvMatch = (WORK_ENV_DOMAINS[profile.workEnv] ?? []).includes(domain)
  const workEnv = workEnvMatch ? 8 : 0

  // 4) Priority fit (0-12) — top-3 priorities, weighted 6/4/2
  const matchedPriorities: string[] = []
  let priority = 0
  const weights = [6, 4, 2]
  for (let i = 0; i < Math.min(3, profile.priorities.length); i++) {
    const p = profile.priorities[i]
    if ((PRIORITY_DOMAINS[p] ?? []).includes(domain)) {
      priority += weights[i]
      matchedPriorities.push(p)
    }
  }

  // 5) Margin bonus (0-5) — slight reward for comfortable admission.
  //    Capped so it never dominates fit.
  const m = evaluation.margin ?? 0
  const margin = Math.min(5, Math.max(0, m * 0.6))

  // 6) Penalty — student is overqualified AND this domain matches no interest.
  //    Prevents recommending trivial specialties to strong students.
  let penalty = 0
  if (m > 4 && matchedInterests.length === 0) penalty -= 12
  if (profile.bacGrade >= 16 && (evaluation.thresholdUsed ?? 99) < 12 && matchedInterests.length === 0) penalty -= 8

  const base = 25
  const total = Math.max(0, Math.min(100,
    Math.round(base + interest + strength + workEnv + priority + margin + penalty)
  ))

  return {
    base, interest, strength, workEnv, priority, margin, penalty, total,
    signals: { matchedInterests, matchedStrengths, workEnvMatch, matchedPriorities },
  }
}

// ── Domain-level deduplication ───────────────────────────────────────────────
// We want a diverse Top-5: at most ONE offering per domain (e.g. one A, one C…).
export function rankByProfileFit(
  eligible: Array<Offering & { evaluation: Eligibility }>,
  profile: StudentProfile,
  limit = 10,
): Array<{
  offering: Offering & { evaluation: Eligibility }
  domain:   DomainKey
  score:    number
  fit:      FitBreakdown
}> {
  // Score every offering
  const scored = eligible.map((o) => {
    const domain = (o.code_filiere[0] ?? 'A').toUpperCase() as DomainKey
    const fit = scoreDomain(domain, profile, o.evaluation)
    return { offering: o, domain, score: fit.total, fit }
  })

  // Best offering per (domain + filiere name) — keep diversity
  const bestPerSpec = new Map<string, typeof scored[number]>()
  for (const s of scored) {
    const key = `${s.domain}|${(s.offering as any).filiere ?? s.offering.code_filiere}`
    const prev = bestPerSpec.get(key)
    if (!prev || s.score > prev.score) bestPerSpec.set(key, s)
  }

  // Sort by score desc, then by margin desc as tiebreaker
  const sorted = Array.from(bestPerSpec.values()).sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score
    return (b.offering.evaluation.margin ?? 0) - (a.offering.evaluation.margin ?? 0)
  })

  // Enforce at most 2 per domain in the Top-N (one is too restrictive when the
  // student is hyper-focused; two keeps variety).
  const perDomain = new Map<DomainKey, number>()
  const out: typeof sorted = []
  for (const s of sorted) {
    const n = perDomain.get(s.domain) ?? 0
    if (n >= 2) continue
    out.push(s)
    perDomain.set(s.domain, n + 1)
    if (out.length >= limit) break
  }
  return out
}

// ── Deterministic Arabic reasons (always reliable fallback) ──────────────────
export function buildReasons(
  domain: DomainKey,
  fit: FitBreakdown,
  evaluation: Eligibility,
  profile: StudentProfile,
): string[] {
  const reasons: string[] = []

  if (fit.signals.matchedInterests.length > 0) {
    const labels = fit.signals.matchedInterests.map((i) => INTEREST_AR[i] ?? i).join('، ')
    reasons.push(`يتوافق مع اهتمامك بـ${labels} ضمن مجال ${DOMAIN_AR[domain]}.`)
  }

  if (fit.signals.matchedStrengths.length > 0) {
    const labels = fit.signals.matchedStrengths.slice(0, 3)
      .map((s) => STRENGTH_AR[s] ?? s).join('، ')
    reasons.push(`يستفيد من نقاط قوتك في ${labels}.`)
  } else if (fit.strength >= 15) {
    reasons.push(`قدراتك العامة تتناسب مع متطلبات ${DOMAIN_AR[domain]}.`)
  }

  if (fit.signals.workEnvMatch) {
    reasons.push(`بيئة العمل في هذا التخصص (${WORK_ENV_AR[profile.workEnv]}) هي ما تفضله.`)
  }

  if (fit.signals.matchedPriorities.length > 0) {
    reasons.push(`يلبي أولويتك المهنية: ${fit.signals.matchedPriorities[0]}.`)
  }

  if (evaluation.admissionPriority === 1) {
    reasons.push(`أنت مؤهل بالأولوية الأولى (الحد الأدنى ${evaluation.thresholdUsed?.toFixed(2) ?? '—'}).`)
  } else if (evaluation.admissionPriority) {
    reasons.push(`أنت مؤهل بالأولوية ${evaluation.admissionPriority} (الحد الأدنى ${evaluation.thresholdUsed?.toFixed(2) ?? '—'}).`)
  }

  // Always return at least 2, max 3
  while (reasons.length < 2) {
    reasons.push(`معدلك ${profile.bacGrade.toFixed(2)} يتجاوز الحد المطلوب لهذا التخصص.`)
    break
  }
  return reasons.slice(0, 3)
}

// ── Groq prose polishing (OPTIONAL — ranking never depends on it) ────────────
export async function polishReasonsWithGroq(
  items: Array<{
    code_filiere: string
    filiere: string
    domain: DomainKey
    deterministicReasons: string[]
    matchedInterests:  string[]
    matchedStrengths:  string[]
    matchedPriorities: string[]
  }>,
  profile: StudentProfile,
): Promise<Record<string, string[]> | null> {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) return null

  const system = `أنت محرر عربي محترف. وظيفتك إعادة صياغة الأسباب الجاهزة لكل تخصص بأسلوب طبيعي وشخصي،
دون تغيير المعنى ودون اختراع أي معلومة جديدة.
- 3 جمل قصيرة لكل تخصص، كل جملة < 18 كلمة.
- اربط كل جملة بمعطى حقيقي من ملف الطالب (اهتمام، قدرة، أولوية، أو معدل).
- JSON فقط بالشكل التالي بدون أي نص خارجه:
{"items":[{"code_filiere":"...","reasons":["...","...","..."]}]}`

  const user = JSON.stringify({
    student: {
      series: profile.bacSeries,
      grade:  profile.bacGrade,
      interests:  profile.interests,
      top_strengths: Object.entries(profile.strengths)
        .sort((a, b) => b[1] - a[1]).slice(0, 4).map(([k, v]) => `${k}=${v}/5`),
      work_env:   profile.workEnv,
      priorities: profile.priorities.slice(0, 3),
    },
    specialties: items.map((it) => ({
      code_filiere: it.code_filiere,
      filiere:      it.filiere,
      domain_ar:    DOMAIN_AR[it.domain],
      signals: {
        interests:  it.matchedInterests,
        strengths:  it.matchedStrengths,
        priorities: it.matchedPriorities,
      },
      seed_reasons: it.deterministicReasons,
    })),
  })

  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        temperature: 0.3,
        max_tokens: 900,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: system },
          { role: 'user',   content: user },
        ],
      }),
    })
    if (!res.ok) return null
    const data = await res.json()
    const raw = data?.choices?.[0]?.message?.content ?? '{}'
    const parsed = JSON.parse(raw) as { items?: Array<{ code_filiere: string; reasons: string[] }> }
    if (!parsed.items) return null
    const out: Record<string, string[]> = {}
    for (const it of parsed.items) {
      if (it.code_filiere && Array.isArray(it.reasons) && it.reasons.length >= 2) {
        out[it.code_filiere] = it.reasons.slice(0, 3).map((s) => String(s).trim()).filter(Boolean)
      }
    }
    return out
  } catch (e) {
    console.warn('[profile-fit] Groq polish failed — using deterministic reasons:', e)
    return null
  }
}
