import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { studentProfiles, recommendations } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const userId = searchParams.get('userId')
  if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 })

  const [profile] = await db.select().from(studentProfiles).where(eq(studentProfiles.userId, userId)).limit(1)
  const recs = await db.select().from(recommendations).where(eq(recommendations.userId, userId))

  return NextResponse.json({ profile: profile || null, recommendations: recs })
}
