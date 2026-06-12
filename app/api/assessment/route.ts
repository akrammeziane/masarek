/**
 * POST /api/assessment
 *
 * Real-data pipeline (no Python service required):
 *   1. Validate student profile + grades.
 *   2. Pre-filter the official offerings catalog with the deterministic
 *      scoring engine (`lib/scoring.ts`). This guarantees correctness
 *      relative to the MESRS minimum averages — the AI is never asked
 *      to *decide* admissibility, only to rank and explain.
 *   3. Send the short-list to Groq (LLaMA-3.1) for ranking + bilingual
 *      explanations, using the student's interests/strengths.
 *   4. Persist top recommendations.
 *
 * Accuracy: admissibility is deterministic (100% match to the PDF).
 * Ranking quality depends on the LLM; the AI sees ≤ 25 already-eligible
 * options so it cannot hallucinate ineligible specialties.
 */

import { NextRequest, NextResponse } from 'next/server'
import Groq from 'groq-sdk'
import { db } from '@/lib/db'
import { recommendations } from '@/lib/db/schema'
import {
  rankAdmissibleOfferings,
  type BacSeries,
  type BacGrades,
  type Offering,
} from '@/lib/scoring'
import OFFERINGS from '@/lib/data/offerings.json'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

const SYSTEM_PROMPT = `Tu es un conseiller d'orientation pour les bacheliers algériens (BAC 2025).
On te fournit:
  • Le profil de l'élève (série, moyenne, wilaya, intérêts, points forts, environnement de travail souhaité).
  • Une liste DÉJÀ FILTRÉE de spécialités auxquelles l'élève est admissible
    selon les moyennes minimales officielles du MESRS.
Ta mission:
  1. Re-classer ces options du meilleur match au moins bon, en tenant compte des intérêts.
  2. Pour chaque option du Top, écrire UNE phrase de justification en arabe ET une en français.
Réponds UNIQUEMENT en JSON valide (pas de markdown, pas de texte autour), schéma:
  { "ranked": [ { "code_etablissement": string, "code_filiere": string,
                  "match_score": number /* 0-100 */,
                  "reason_ar": string, "reason_fr": string } ] }
N'invente JAMAIS de code: utilise uniquement ceux fournis.`

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      userId,
      bac_series,         // BacSeries
      bac_grade,          // number — moyenne générale
      bac_notes,          // optional Record<Subject, number>
      interests = [],     // string[]
      strengths = [],     // string[]
      work_env,           // string
      priorities = [],    // string[]
      wilaya,             // optional string
    } = body as {
      userId: string
      bac_series: BacSeries
      bac_grade: number
      bac_notes?: BacGrades['notes']
      interests?: string[]
      strengths?: string[]
      work_env?: string
      priorities?: string[]
      wilaya?: string
    }

    if (!userId || !bac_series || typeof bac_grade !== 'number') {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // 1) Deterministic eligibility filter against the 4 719 official offerings.
    const grades: BacGrades = { moyenne: bac_grade, notes: bac_notes }
    const eligible = rankAdmissibleOfferings(
      OFFERINGS as Offering[],
      bac_series,
      grades,
      { wilaya, limit: 25 },
    )

    if (eligible.length === 0) {
      return NextResponse.json({
        recommendations: [],
        message:
          "Aucune spécialité n'atteint le seuil officiel avec la moyenne fournie. " +
          "Réessaye sans filtre wilaya, ou ajuste la moyenne.",
      })
    }

    // 2) Ask Groq to re-rank + explain.
    const userPrompt = JSON.stringify({
      student: { bac_series, bac_grade, wilaya, interests, strengths, work_env, priorities },
      eligible_options: eligible.map(e => ({
        code_etablissement: e.code_etablissement,
        etablissement: e.etablissement,
        code_filiere: e.code_filiere,
        filiere: e.filiere,
        admission_priority: e.evaluation.admissionPriority,
        threshold: e.evaluation.thresholdUsed,
        student_pondered_score: Number(e.evaluation.studentScore.toFixed(2)),
        margin: e.evaluation.margin != null ? Number(e.evaluation.margin.toFixed(2)) : null,
      })),
    })

    let llmOut: { ranked: Array<{
      code_etablissement: string
      code_filiere: string
      match_score: number
      reason_ar: string
      reason_fr: string
    }> } = { ranked: [] }

    try {
      const completion = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        temperature: 0.2,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user',   content: userPrompt },
        ],
      })
      llmOut = JSON.parse(completion.choices[0]?.message?.content ?? '{"ranked":[]}')
    } catch (e) {
      console.error('[assessment] Groq failed, using deterministic fallback:', e)
      // Fallback: pure deterministic ranking with templated reasons.
      llmOut.ranked = eligible.map(e => ({
        code_etablissement: e.code_etablissement,
        code_filiere: e.code_filiere,
        match_score: Math.min(100, Math.round(80 + (e.evaluation.margin ?? 0) * 4)),
        reason_ar: `أنت مؤهل لهذه الشعبة في ${e.etablissement} (الأولوية ${e.evaluation.admissionPriority}).`,
        reason_fr: `Tu es admissible à cette filière à ${e.etablissement} (priorité ${e.evaluation.admissionPriority}).`,
      }))
    }

    // 3) Merge LLM ranking with deterministic data (LLM never owns numbers).
    const byKey = new Map(eligible.map(e => [`${e.code_etablissement}|${e.code_filiere}`, e]))
    const merged = llmOut.ranked
      .map(r => {
        const src = byKey.get(`${r.code_etablissement}|${r.code_filiere}`)
        if (!src) return null
        return {
          code_etablissement: src.code_etablissement,
          etablissement: src.etablissement,
          code_filiere: src.code_filiere,
          filiere: src.filiere,
          admission_priority: src.evaluation.admissionPriority,
          threshold: src.evaluation.thresholdUsed,
          student_score: Number(src.evaluation.studentScore.toFixed(2)),
          margin: src.evaluation.margin != null ? Number(src.evaluation.margin.toFixed(2)) : null,
          match_score: Math.max(0, Math.min(100, Math.round(r.match_score))),
          reason_ar: r.reason_ar,
          reason_fr: r.reason_fr,
        }
      })
      .filter((x): x is NonNullable<typeof x> => x !== null)

    // 4) Persist top results.
    for (const rec of merged.slice(0, 10)) {
      await db.insert(recommendations).values({
        userId,
        matchScore: rec.match_score.toString(),
        reasoningAr: rec.reason_ar,
        reasoningFr: rec.reason_fr,
      })
    }

    return NextResponse.json({ recommendations: merged }, { status: 201 })
  } catch (err) {
    console.error('[assessment] fatal:', err)
    return NextResponse.json({ error: 'Failed to process assessment' }, { status: 500 })
  }
}
