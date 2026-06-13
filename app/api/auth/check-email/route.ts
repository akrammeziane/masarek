import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const domain = req.nextUrl.searchParams.get('domain')?.toLowerCase().trim()

  if (!domain || domain.length < 3 || !domain.includes('.')) {
    return NextResponse.json({ valid: false }, { status: 200 })
  }

  const disposable = [
    'mailinator.com','guerrillamail.com','tempmail.com','throwaway.email',
    'yopmail.com','sharklasers.com','10minutemail.com','trashmail.com',
    'maildrop.cc','dispostable.com','fakeinbox.com','spamgourmet.com',
  ]

  if (disposable.includes(domain)) {
    return NextResponse.json({ valid: false }, { status: 200 })
  }

  return NextResponse.json({ valid: true }, { status: 200 })
}