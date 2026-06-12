import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { universities } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const id = parseInt(params.id)
  if (isNaN(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })
  const result = await db.select().from(universities).where(eq(universities.id, id)).limit(1)
  if (!result.length) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(result[0])
}
