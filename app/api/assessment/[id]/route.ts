import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { recommendations } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const recs = await db.select().from(recommendations).where(eq(recommendations.userId, params.id))
  return NextResponse.json(recs)
}
