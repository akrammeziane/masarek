import Link from 'next/link'
import { CheckCircle, XCircle, Mail } from 'lucide-react'

interface Props {
  searchParams: Promise<{ success?: string; error?: string }>
}

const Logo = () => (
  <div className="flex items-center justify-center gap-2 mb-8">
    <svg width="36" height="36" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="40" height="40" rx="10" fill="#006233"/>
      <path d="M8 28 C8 28 10 20 16 20 C19 20 20 22 20 24 C20 26 18 27 16 27 C14 27 13 26 13 24" stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
      <path d="M20 24 L32 12" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M28 12 L32 12 L32 16" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
    <div>
      <span className="font-bold text-[#0B2340] text-lg">مساركَ</span>
      <span className="text-xs text-[#006233] block leading-none">Masarek.dz</span>
    </div>
  </div>
)

export default async function VerifyEmailPage({ searchParams }: Props) {
  const params = await searchParams
  const isSuccess = params.success === '1'
  const error = params.error

  return (
    <div className="min-h-screen bg-[#F4F6F9] flex items-center justify-center px-4" dir="rtl">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-[#E2E8F0] overflow-hidden">

        <div className="flex h-1.5">
          <div className="flex-1 bg-[#006233]" />
          <div className="flex-1 bg-white border-t border-[#E2E8F0]" />
          <div className="flex-1 bg-[#D21034]" />
        </div>

        <div className="p-8 text-center">
          <Logo />

          {/* ── Success ── */}
          {isSuccess && (
            <>
              <div className="w-20 h-20 rounded-full bg-[#006233]/10 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-10 h-10 text-[#006233]" />
              </div>
              <h1 className="text-xl font-bold text-[#0B2340] mb-2">تم التحقق بنجاح! 🎉</h1>
              <p className="text-gray-500 text-sm mb-6">
                تم تأكيد بريدك الإلكتروني. يمكنك الآن تسجيل الدخول والبدء في استخدام مساركَ.
              </p>
              <Link
                href="/sign-in"
                className="inline-block w-full bg-[#006233] hover:bg-[#004d28] text-white font-semibold py-3 px-6 rounded-xl transition-colors"
              >
                تسجيل الدخول الآن
              </Link>
            </>
          )}

          {/* ── Pending (just registered, waiting for user to check email) ── */}
          {!isSuccess && !error && (
            <>
              <div className="w-20 h-20 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-4">
                <Mail className="w-10 h-10 text-blue-500" />
              </div>
              <h1 className="text-xl font-bold text-[#0B2340] mb-2">تحقق من بريدك الإلكتروني</h1>
              <p className="text-gray-500 text-sm mb-2">
                أرسلنا لك رابط التأكيد. افتح بريدك وانقر على الزر للتحقق من حسابك.
              </p>
              <p className="text-xs text-gray-400 mb-6">
                ⏱ الرابط صالح لمدة 24 ساعة. تحقق من مجلد <strong>Spam</strong> إذا لم تجده.
              </p>
              <Link href="/sign-in" className="text-[#006233] text-sm font-medium hover:underline">
                العودة لتسجيل الدخول
              </Link>
            </>
          )}

          {/* ── Invalid / Expired ── */}
          {error === 'invalid' && (
            <>
              <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
                <XCircle className="w-10 h-10 text-[#D21034]" />
              </div>
              <h1 className="text-xl font-bold text-[#0B2340] mb-2">الرابط غير صالح أو منتهي</h1>
              <p className="text-gray-500 text-sm mb-6">
                هذا الرابط منتهي الصلاحية أو تم استخدامه مسبقاً. يرجى إنشاء حساب جديد.
              </p>
              <Link
                href="/sign-up"
                className="inline-block w-full bg-[#006233] hover:bg-[#004d28] text-white font-semibold py-3 px-6 rounded-xl transition-colors text-center"
              >
                إنشاء حساب جديد
              </Link>
            </>
          )}

          {/* ── Missing token ── */}
          {error === 'missing' && (
            <>
              <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
                <XCircle className="w-10 h-10 text-[#D21034]" />
              </div>
              <h1 className="text-xl font-bold text-[#0B2340] mb-2">رابط غير مكتمل</h1>
              <p className="text-gray-500 text-sm mb-6">
                الرابط الذي استخدمته غير مكتمل. يرجى النقر على الرابط في البريد الإلكتروني مباشرة.
              </p>
              <Link href="/sign-in" className="text-[#006233] text-sm font-medium hover:underline">
                العودة لتسجيل الدخول
              </Link>
            </>
          )}

          {/* ── Server error ── */}
          {error === 'server' && (
            <>
              <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
                <XCircle className="w-10 h-10 text-[#D21034]" />
              </div>
              <h1 className="text-xl font-bold text-[#0B2340] mb-2">حدث خطأ</h1>
              <p className="text-gray-500 text-sm mb-6">
                حدث خطأ أثناء التحقق. يرجى المحاولة مجدداً.
              </p>
              <Link href="/sign-in" className="text-[#006233] text-sm font-medium hover:underline">
                العودة لتسجيل الدخول
              </Link>
            </>
          )}

        </div>
      </div>
    </div>
  )
}
