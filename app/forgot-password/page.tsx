// app/forgot-password/page.tsx
// This page was missing — linked from sign-in but didn't exist (caused 404)

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

function MasarekLogo({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="40" height="40" rx="10" fill="#006233"/>
      <path d="M8 28 C8 28 10 20 16 20 C19 20 20 22 20 24 C20 26 18 27 16 27 C14 27 13 26 13 24" stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
      <path d="M20 24 L32 12" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M28 12 L32 12 L32 16" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen bg-[#F4F6F9] flex items-center justify-center px-4" dir="rtl">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-[#E2E8F0] overflow-hidden">
        {/* Flag stripe */}
        <div className="flex h-1.5">
          <div className="flex-1 bg-[#006233]" />
          <div className="flex-1 bg-white border-t border-[#E2E8F0]" />
          <div className="flex-1 bg-[#D21034]" />
        </div>

        <div className="p-8">
          {/* Logo */}
          <div className="flex items-center gap-2 mb-8">
            <MasarekLogo size={36} />
            <div>
              <span className="font-bold text-[#0B2340] text-lg block leading-none">مساركَ</span>
              <span className="text-xs text-[#006233]">Masarek.dz</span>
            </div>
          </div>

          <h1 className="text-2xl font-bold text-[#0B2340] mb-2">نسيت كلمة المرور؟</h1>
          <p className="text-gray-500 text-sm mb-8">
            ميزة إعادة تعيين كلمة المرور ستكون متاحة قريباً. في الوقت الحالي، يمكنك التواصل معنا عبر البريد الإلكتروني لإعادة تعيين كلمتك.
          </p>

          {/* Contact info */}
          <div className="bg-[#006233]/5 border border-[#006233]/20 rounded-xl p-5 mb-6">
            <p className="text-sm text-[#0B2340] font-semibold mb-2">للمساعدة، تواصل معنا:</p>
            <a
              href="mailto:mezianeakram757@gmail.com"
              className="text-[#006233] text-sm font-medium hover:underline block mb-1"
            >
              support@masarek.dz"
            </a>
            <p className="text-xs text-gray-400 mt-2">
              أرسل لنا إيميلك المسجّل وسنساعدك على استعادة حسابك خلال 24 ساعة.
            </p>
          </div>

          <Link
            href="/sign-in"
            className="inline-flex items-center gap-2 text-[#006233] text-sm font-medium hover:underline"
          >
            <ArrowRight className="w-4 h-4" />
            العودة لتسجيل الدخول
          </Link>
        </div>
      </div>
    </div>
  )
}
