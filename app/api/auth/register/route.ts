import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { user, account, studentProfiles, verification } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

const RegisterSchema = z.object({
  name:       z.string().min(2),
  email:      z.string().email(),
  password:   z.string().min(8),
  nationalId: z.string().optional(),
  wilaya:     z.string().optional(),
  bacSeries:  z.string().optional(),
  bacGrade:   z.preprocess((val) => Number(val), z.number().min(0).max(20)).optional(),
})

async function sendVerificationEmail(email: string, name: string, token: string) {
  const appUrl = process.env.NEXTAUTH_URL || process.env.APP_URL || 'http://localhost:3000'
  const verifyUrl = `${appUrl}/api/auth/verify-email?token=${token}`

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM || 'Masarek <onboarding@resend.dev>',
      to: [email],
      subject: 'تأكيد بريدك الإلكتروني — مساركَ',
      html: `
        <!DOCTYPE html>
        <html dir="rtl" lang="ar">
        <head><meta charset="UTF-8" /></head>
        <body style="font-family: Arial, sans-serif; background: #F4F6F9; margin: 0; padding: 20px;">
          <div style="max-width: 520px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
            
            <div style="background: #0B2340; padding: 28px 32px; text-align: center;">
              
              <svg width="44" height="44" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" style="display:inline-block; vertical-align:middle; margin-left:10px;">
                <rect width="40" height="40" rx="10" fill="#006233"/>
                <path d="M8 28 C8 28 10 20 16 20 C19 20 20 22 20 24 C20 26 18 27 16 27 C14 27 13 26 13 24" stroke="white" stroke-width="2.5" stroke-linecap="round" fill="none"/>
                <path d="M20 24 L32 12" stroke="white" stroke-width="2.5" stroke-linecap="round"/>
                <path d="M28 12 L32 12 L32 16" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>

              <span style="color: white; font-size: 22px; font-weight: bold; vertical-align: middle;">مساركَ</span>
              <p style="color: #80e0a0; margin: 6px 0 0; font-size: 13px;">Masarek.dz</p>
            </div>

            <div style="padding: 32px;">
              <h2 style="color: #0B2340; margin: 0 0 12px; font-size: 20px;">مرحباً ${name} 👋</h2>
              <p style="color: #4A5568; line-height: 1.7; margin: 0 0 24px;">
                شكراً لتسجيلك في <strong>مساركَ</strong>. يرجى تأكيد بريدك الإلكتروني للوصول إلى حسابك.
              </p>

              <div style="text-align: center; margin: 28px 0;">
                <a href="${verifyUrl}" style="
                  display: inline-block;
                  background: #006233;
                  color: white;
                  padding: 14px 36px;
                  border-radius: 8px;
                  text-decoration: none;
                  font-size: 16px;
                  font-weight: bold;
                ">✅ تأكيد البريد الإلكتروني</a>
              </div>

              <p style="color: #718096; font-size: 13px; margin: 0 0 8px;">
                ⏱ هذا الرابط صالح لمدة <strong>24 ساعة</strong> فقط.
              </p>
              <p style="color: #718096; font-size: 13px; margin: 0;">
                إذا لم تقم بإنشاء هذا الحساب، يمكنك تجاهل هذا البريد.
              </p>

              <hr style="border: none; border-top: 1px solid #E2E8F0; margin: 24px 0;" />
              <p style="color: #A0AEC0; font-size: 12px; text-align: center; margin: 0;">
                إذا لم يعمل الزر، انسخ هذا الرابط في متصفحك:<br />
                <span style="color: #006233; font-size: 11px; word-break: break-all;">${verifyUrl}</span>
              </p>
            </div>

            <div style="background: #F4F6F9; padding: 16px 32px; text-align: center;">
              <div style="display: flex; justify-content: center; height: 4px; gap: 0;">
                <div style="flex: 1; background: #006233;"></div>
                <div style="flex: 1; background: white;"></div>
                <div style="flex: 1; background: #D21034;"></div>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Resend error: ${err}`)
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = RegisterSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: { message: 'البيانات المدخلة غير صالحة' } }, { status: 400 })
    }

    const { name, email, password, wilaya, bacSeries, bacGrade } = parsed.data

    // 1. Check duplicate email
    const existing = await db.select().from(user).where(eq(user.email, email)).limit(1)
    if (existing.length > 0) {
      return NextResponse.json({ error: { message: 'البريد الإلكتروني مستخدم بالفعل' } }, { status: 409 })
    }

    // 2. Hash password
    const passwordHash = await bcrypt.hash(password, 12)
    const userId = crypto.randomUUID()

    // 3. Insert user — emailVerified stays false until confirmed
    await db.insert(user).values({
      id: userId,
      name,
      email,
      emailVerified: false,
    })

    // 4. Insert credentials account
    await db.insert(account).values({
      id: crypto.randomUUID(),
      accountId: crypto.randomUUID(),
      providerId: 'credentials',
      userId,
      password: passwordHash,
    })

    // 5. Insert student profile
    await db.insert(studentProfiles).values({
      userId,
      wilaya: wilaya || null,
      bacSeries: bacSeries || null,
      bacScore: bacGrade ? bacGrade.toFixed(2) : null,
      assessmentCompleted: false,
      xpPoints: 0,
      level: 1,
    })

    // 6. Generate verification token (random 64-char hex) and store in DB
    const token = crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '')
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    // Delete any old tokens for this email first
    await db.delete(verification).where(eq(verification.identifier, email))

    await db.insert(verification).values({
      id: crypto.randomUUID(),
      identifier: email,
      value: token,
      expiresAt,
    })

    // 7. Send verification email — if it fails, roll back the account
    try {
      if (!process.env.RESEND_API_KEY) {
        console.warn('⚠️  RESEND_API_KEY is not set — skipping verification email.')
      } else {
        await sendVerificationEmail(email, name, token)
      }
    } catch (emailErr: any) {
      // Email failed — delete the account we just created so user can try again
      await db.delete(verification).where(eq(verification.identifier, email))
      await db.delete(studentProfiles).where(eq(studentProfiles.userId, userId))
      await db.delete(account).where(eq(account.userId, userId))
      await db.delete(user).where(eq(user.id, userId))

      const isResendDomainError = emailErr.message?.includes('verify a domain') || emailErr.message?.includes('testing emails')
      return NextResponse.json({
        error: {
          message: isResendDomainError
            ? 'لا يمكن إرسال بريد التأكيد إلى هذا العنوان. يرجى استخدام بريد إلكتروني حقيقي وصالح.'
            : 'فشل إرسال بريد التأكيد. يرجى التحقق من عنوان بريدك الإلكتروني والمحاولة مجدداً.',
        }
      }, { status: 422 })
    }

    return NextResponse.json({ success: true, requiresVerification: true }, { status: 201 })

  } catch (err: any) {
    console.error('Register Route Error:', err)
    return NextResponse.json({ error: { message: 'حدث خطأ داخلي في الخادم' } }, { status: 500 })
  }
}