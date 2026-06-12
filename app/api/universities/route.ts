
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { universities } from '@/lib/db/schema'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const wilaya = searchParams.get('wilaya')
  const type   = searchParams.get('type')

  // FIX: Removed .limit(200) hard cap — fetch ALL universities (269 official).
  // selectDistinct on `code` (unique key) prevents any duplicate rows surfacing.
  const rows = await db
    .selectDistinct()
    .from(universities)
    .orderBy(universities.code)

  // Secondary in-memory dedup guard keyed on `code`
  const seen = new Set<string>()
  const results = rows.filter((r) => {
    if (seen.has(r.code)) return false
    seen.add(r.code)
    return true
  })

  return NextResponse.json(results)
}
