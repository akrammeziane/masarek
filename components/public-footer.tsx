import Link from 'next/link'
import { GraduationCap, Mail, Globe } from 'lucide-react'

function MasarekLogo({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="40" height="40" rx="10" fill="#006233"/>
      <path d="M8 28 C8 28 10 20 16 20 C19 20 20 22 20 24 C20 26 18 27 16 27 C14 27 13 26 13 24" stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
      <path d="M20 24 L32 12" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M28 12 L32 12 L32 16" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

const QUICK_LINKS = [
  { href: '/',                label: 'الرئيسية' },
  { href: '/explorer',        label: 'استكشاف التخصصات' },
  { href: '/universities',    label: 'الجامعات الجزائرية' },
  { href: '/#how-it-works',  label: 'كيف يعمل مساركَ؟' },
]

const AUTH_LINKS = [
  { href: '/sign-up',  label: 'إنشاء حساب مجاني' },
  { href: '/sign-in',  label: 'تسجيل الدخول' },
  { href: '/sign-in',  label: 'ابدأ اختبار التوجيه' },
]

const DOMAINS = [
  'العلوم والتكنولوجيا', 'العلوم الطبية', 'العلوم القانونية',
  'الآداب واللغات', 'العلوم الاقتصادية', 'العلوم الرياضية',
]

export function PublicFooter() {
  return (
    <footer className="bg-[#0B2340] text-white" dir="rtl">

      {/* ── Top strip: stats ── */}
      <div className="bg-[#006233]/20 border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex flex-wrap justify-center gap-8 text-sm text-white/80">
            {[
              { n: '48+',  l: 'جامعة جزائرية' },
              { n: '250+', l: 'تخصص متاح' },
              { n: '12',   l: 'مجال دراسي' },
              { n: '100%', l: 'مجاني تماماً' },
            ].map(({ n, l }) => (
              <div key={l} className="flex items-center gap-2">
                <span className="font-bold text-[#C8A84B] text-lg">{n}</span>
                <span>{l}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Main grid ── */}
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid md:grid-cols-4 gap-8 mb-10">

          {/* Col 1: Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2.5 mb-4">
              <MasarekLogo size={38} />
              <div>
                <span className="text-xl font-bold block leading-none">مساركَ</span>
                <span className="text-xs text-white/40 block leading-none mt-0.5">Masarek.dz</span>
              </div>
            </div>
            <p className="text-white/60 text-sm leading-relaxed mb-4">
              منصة ذكية لتوجيه طلاب البكالوريا الجزائريين نحو التخصص الجامعي الأنسب بمساعدة الذكاء الاصطناعي.
            </p>
            {/* Algerian flag colors strip */}
            <div className="flex h-1.5 rounded-full overflow-hidden w-24">
              <div className="flex-1 bg-[#006233]" />
              <div className="flex-1 bg-white" />
              <div className="flex-1 bg-[#D21034]" />
            </div>
            {/* <p className="text-white/30 text-xs mt-3 leading-relaxed">
              مشروع تخرج — جامعة البويرة
            </p> */}
          </div>

          {/* Col 2: Quick links */}
          <div>
            <h4 className="font-bold text-white/90 mb-4 text-sm uppercase tracking-wide">روابط سريعة</h4>
            <ul className="space-y-2.5">
              {QUICK_LINKS.map(({ href, label }) => (
                <li key={label}>
                  <Link href={href} className="text-white/55 text-sm hover:text-white transition-colors hover:-translate-x-0.5 inline-block">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 3: Auth links */}
          <div>
            <h4 className="font-bold text-white/90 mb-4 text-sm uppercase tracking-wide">للطلاب</h4>
            <ul className="space-y-2.5">
              {AUTH_LINKS.map(({ href, label }) => (
                <li key={label}>
                  <Link href={href} className="text-white/55 text-sm hover:text-white transition-colors inline-block">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>

            <h4 className="font-bold text-white/90 mb-3 mt-6 text-sm uppercase tracking-wide">المجالات</h4>
            <ul className="space-y-1.5">
              {DOMAINS.map((d) => (
                <li key={d}>
                  <span className="text-white/40 text-xs">{d}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 4: Contact */}
          <div>
            <h4 className="font-bold text-white/90 mb-4 text-sm uppercase tracking-wide">تواصل معنا</h4>
            <ul className="space-y-3">
              <li>
                <a href="mailto:contact@masarek.dz"
                  className="flex items-center gap-2 text-white/55 text-sm hover:text-white transition-colors">
                  <Mail className="w-4 h-4 shrink-0 text-[#C8A84B]" /> contact@masarek.dz
                </a>
              </li>
              <li>
                <a href="https://masarek.dz"
                  className="flex items-center gap-2 text-white/55 text-sm hover:text-white transition-colors">
                  <Globe className="w-4 h-4 shrink-0 text-[#C8A84B]" /> masarek.dz
                </a>
              </li>
              {/* <li>
                <a href="#" className="flex items-center gap-2 text-white/55 text-sm hover:text-white transition-colors">
                  <svg className="w-4 h-4 shrink-0 text-[#C8A84B] fill-current" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                  <span>Twitter / X</span>
                </a>
              </li>
              <li>
                <a href="#" className="flex items-center gap-2 text-white/55 text-sm hover:text-white transition-colors">
                  <svg className="w-4 h-4 shrink-0 text-[#C8A84B] fill-current" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
                  </svg>
                  <span>Facebook</span>
                </a>
              </li> */}
            </ul>

            {/* CTA */}
            <div className="mt-6 p-4 bg-[#006233]/20 border border-[#006233]/30 rounded-xl">
              <p className="text-white/80 text-xs mb-2 font-medium">ابدأ الآن — مجاناً تماماً</p>
              <Link href="/sign-up">
                <span className="inline-block bg-[#006233] hover:bg-[#004d28] text-white text-xs px-4 py-2 rounded-lg transition-colors font-medium cursor-pointer">
                  إنشاء حساب
                </span>
              </Link>
            </div>
          </div>
        </div>

        {/* ── Bottom bar ── */}
        <div className="border-t border-white/10 pt-6 flex flex-col md:flex-row items-center justify-between gap-3">
          <p className="text-white/35 text-xs">
            © 2026 مساركَ — جميع الحقوق محفوظة
          </p>
          <p className="text-white/25 text-xs text-center">
            هذه المنصة غير رسمية وتعمل بشكل مستقل عن وزارة التعليم العالي والبحث العلمي
          </p>
          <div className="flex items-center gap-1.5 text-white/35 text-xs">
            <GraduationCap className="w-3.5 h-3.5" />
            <span>صُنع في الجزائر 🇩🇿</span>
          </div>
        </div>
      </div>
    </footer>
  )
}