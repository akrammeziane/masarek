import { NextRequest, NextResponse } from 'next/server'
import dns from 'dns/promises'

export async function GET(req: NextRequest) {
  const domain = req.nextUrl.searchParams.get('domain')?.toLowerCase().trim()

  if (!domain || domain.length < 3 || !domain.includes('.')) {
    return NextResponse.json({ valid: false }, { status: 200 })
  }

  // Block known disposable domains
  const disposable = [
    'mailinator.com','guerrillamail.com','tempmail.com','throwaway.email',
    'yopmail.com','sharklasers.com','10minutemail.com','trashmail.com',
    'maildrop.cc','dispostable.com','fakeinbox.com','spamgourmet.com',
  ]
  if (disposable.includes(domain)) {
    return NextResponse.json({ valid: false }, { status: 200 })
  }

  try {
    // Try MX records first (proper email domain check)
    const mx = await dns.resolveMx(domain)
    if (mx && mx.length > 0) {
      return NextResponse.json({ valid: true }, { status: 200 })
    }
  } catch {
    // No MX → try A record (some small domains use A record only)
    try {
      const a = await dns.resolve4(domain)
      if (a && a.length > 0) {
        return NextResponse.json({ valid: true }, { status: 200 })
      }
    } catch {
      // Domain does not exist at all
      return NextResponse.json({ valid: false }, { status: 200 })
    }
  }

  return NextResponse.json({ valid: false }, { status: 200 })
}
