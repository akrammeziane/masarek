'use client'

/**
 * دالة تسجيل الدخول المحسّنة لـ NextAuth v5
 */
import { signOutServer } from '@/app/actions/student'
export async function signIn(
  provider: string, 
  options?: { email?: string; password?: string; callbackUrl?: string }
) {
  const { signIn: nextSignIn } = await import('next-auth/react')
  
  try {
    // نستخدم الـ Credentials ونقوم بتمرير الإيميل والباسورد
    const result = await nextSignIn(provider, {
      email: options?.email,
      password: options?.password,
      redirect: false, // ⚠️ نوقف الـ redirect التلقائي لمنع تضارب الـ Router واختفاء الأخطاء
      callbackUrl: options?.callbackUrl || '/dashboard',
    })

    // التحقق إذا كان هناك خطأ في تسجيل الدخول
    if (result?.error) {
      return { error: result.error }
    }

    // إذا تم تسجيل الدخول بنجاح، نقوم بالتوجيه الآمن ونحدث الصفحة بالكامل
    window.location.href = options?.callbackUrl || '/dashboard'
    return { success: true }

  } catch (error: any) {
    return { error: error.message || 'حدث خطأ غير متوقع' }
  }
}

/**
 * دالة تسجيل الخروج المحسّنة والآمنة
 */
export async function signOut() {
  try {
    // استدعاء دالة السيرفر لحذف الكوكيز فوراً وتدمير الجلسة بشكل نهائي
    await signOutServer()
  } catch (error) {
    console.error("Sign Out Error:", error)
  }
  // Redirect to sign-in page after sign out (server action handles session destroy)
  window.location.href = '/sign-in'
}

/**
 * دالة إنشاء حساب جديد (تبقى كما هي لعملها الممتاز)
 */
export async function signUp(data: {
  email: string
  password: string
  name: string
  wilaya?: string
  bacSeries?: string
  bacGrade?: number
}) {
  const res = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  return res.json()
}