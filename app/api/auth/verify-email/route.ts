import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { user, verification } from '@/lib/db/schema'
import { eq, and, gt } from 'drizzle-orm'

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')?.trim()

  if (!token) {
    return NextResponse.redirect(new URL('/verify-email?error=missing', req.url))
  }

  try {
    // Find valid, non-expired token
    const [record] = await db
      .select()
      .from(verification)
      .where(
        and(
          eq(verification.value, token),
          gt(verification.expiresAt, new Date()),
        )
      )
      .limit(1)

    if (!record) {
      return NextResponse.redirect(new URL('/verify-email?error=invalid', req.url))
    }

    // Mark user as verified
    await db
      .update(user)
      .set({ emailVerified: true })
      .where(eq(user.email, record.identifier))

    // Delete used token
    await db.delete(verification).where(eq(verification.id, record.id))

    return NextResponse.redirect(new URL('/verify-email?success=1', req.url))

  } catch (err) {
    console.error('Verify Email Error:', err)
    return NextResponse.redirect(new URL('/verify-email?error=server', req.url))
  }
}
