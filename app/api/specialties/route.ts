
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { specializations } from '@/lib/db/schema'
import { eq, gte, sql } from 'drizzle-orm'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const domain   = searchParams.get('domain')
  const minGrade = searchParams.get('min_grade')

  // FIX: Removed .limit(100) cap — fetch ALL specialties from the DB.
  // Deduplication is enforced by selecting distinct on `code` (the primary key /
  // unique constraint), so no row can appear twice.
  const rows = await db
    .selectDistinct()
    .from(specializations)
    .orderBy(specializations.code)

  // Secondary in-memory dedup guard keyed on `code`, in case the DB somehow
  // contains duplicated rows from a botched seed run.
  const seen = new Set<string>()
  const results = rows.filter((r) => {
    if (seen.has(r.code)) return false
    seen.add(r.code)
    return true
  })

  return NextResponse.json(results)
}
