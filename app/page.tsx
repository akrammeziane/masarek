'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { PublicNavbar } from '@/components/public-navbar'
import { PublicFooter } from '@/components/public-footer'
import {
  GraduationCap, Brain, Building2, TrendingUp, Star, MapPin,
  Shield, BookOpen, CheckCircle, ArrowLeft, Sparkles
} from 'lucide-react'

// ─── DATA ──────────────────────────────────────────────────────────────────

const features = [
  { icon: Brain,      color: 'green', titleAr: 'توصية بالذكاء الاصطناعي',  descAr: 'نموذج ذكاء اصطناعي يحلل ملفك الكامل ويوصي بالتخصص الأنسب' },
  { icon: Building2,  color: 'navy',  titleAr: 'قاعدة بيانات الجامعات',   descAr: 'جميع الجامعات الجزائرية ومعلوماتها التفصيلية في مكان واحد' },
  { icon: TrendingUp, color: 'gold',  titleAr: 'مسارات مهنية واضحة',       descAr: 'تعرّف على الوظائف المتاحة وآفاق التوظيف بعد كل تخصص' },
  { icon: Star,       color: 'red',   titleAr: 'توافق شخصيتك',             descAr: 'مطابقة ميولك وقدراتك مع التخصص الأنسب لك شخصيًا' },
  { icon: MapPin,     color: 'green', titleAr: 'التوزيع الجغرافي',          descAr: 'ابحث عن الجامعة الأقرب إليك بحسب الولاية' },
  { icon: Shield,     color: 'navy',  titleAr: 'معتمد ومحدّث',              descAr: 'معلومات مأخوذة من وزارة التعليم العالي والبحث العلمي' },
]

const iconColorMap: Record<string, string> = {
  green: 'bg-[#006233]/10 text-[#006233]',
  navy:  'bg-[#0B2340]/10 text-[#0B2340]',
  gold:  'bg-[#C8A84B]/10 text-[#C8A84B]',
  red:   'bg-[#D21034]/10 text-[#D21034]',
}

const domains = [
  { nameAr: 'العلوم', nameFr: 'Sciences',          count: 48, color: '#006233', emoji: '🔬' },
  { nameAr: 'التقنية والهندسة', nameFr: 'Tech & Ingénierie', count: 72, color: '#0B2340', emoji: '⚙️' },
  { nameAr: 'الطب والصحة', nameFr: 'Médecine',      count: 24, color: '#D21034', emoji: '🏥' },
  { nameAr: 'الحقوق', nameFr: 'Droit & Sci. Pol.', count: 18, color: '#C8A84B', emoji: '⚖️' },
  { nameAr: 'الآداب والفنون', nameFr: 'Lettres & Arts', count: 30, color: '#7C3AED', emoji: '🎨' },
  { nameAr: 'العلوم الاجتماعية', nameFr: 'Sciences Soc.', count: 22, color: '#0D9488', emoji: '🤝' },
  { nameAr: 'الاقتصاد', nameFr: 'Économie',         count: 28, color: '#EA7A0B', emoji: '📊' },
]

const universities = [
  'USTHB', 'Alger 1', 'Constantine 1', 'ENS Kouba', 'ESI', 'Annaba', 'Oran 1', 'Tlemcen',
  'Sétif 1', 'Batna 1', 'Blida 1', 'Béjaïa', 'Tizi Ouzou', 'Sidi Bel Abbès'
]

const testimonials = [
  { initials: 'أ.م', nameAr: 'أمين مهاوي', wilaya: 'الجزائر', specialty: 'هندسة المعلوماتية — USTHB', quote: 'مساركَ ساعدني على اكتشاف شغفي بالذكاء الاصطناعي وأنا في المرحلة الثانوية. التوصيات كانت دقيقة جدًا!', stars: 5 },
  { initials: 'ن.ب', nameAr: 'نور بلقاسم', wilaya: 'وهران', specialty: 'طب الأسنان — جامعة وهران', quote: 'كنت حائرة بين الطب والهندسة، فساعدني الاختبار على اتخاذ القرار الصحيح بثقة.', stars: 5 },
  { initials: 'ي.ك', nameAr: 'يوسف كرار', wilaya: 'قسنطينة', specialty: 'الحقوق — جامعة قسنطينة 1', quote: 'المنصة احترافية ومصممة خصيصًا للجزائريين. وجدت التخصص والجامعة الأقرب لي في دقائق.', stars: 5 },
]

// ─── COMPONENTS ─────────────────────────────────────────────────────────────

function StarRating({ count }: { count: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: count }).map((_, i) => (
        <Star key={i} className="w-4 h-4 fill-[#C8A84B] text-[#C8A84B]" />
      ))}
    </div>
  )
}

// ─── PAGE ────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#F4F6F9] font-sans" dir="rtl">

      {/* ── NAVBAR ── fixed variant for landing page so hero slides under it */}
      <PublicNavbar variant="fixed" />

      {/* ── HERO ───────────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center pt-16 overflow-hidden bg-[#0B2340]">
        {/* Algerian map silhouette */}
        <div className="absolute inset-0 opacity-5 pointer-events-none">
          <svg viewBox="0 0 800 600" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
            <path d="M100,50 L250,30 L400,60 L500,40 L650,80 L700,200 L680,350 L600,450 L550,550 L400,570 L300,530 L200,480 L120,380 L80,250 Z" fill="#006233"/>
          </svg>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 py-20 w-full">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: text */}
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#C8A84B] bg-[#C8A84B]/10 text-[#C8A84B] text-sm mb-6">
                🎓 <span>التوجيه الجامعي بالذكاء الاصطناعي</span>
              </div>

              <h1 className="text-5xl md:text-6xl font-bold text-white leading-tight mb-4" style={{ fontFamily: 'Noto Sans Arabic, sans-serif' }}>
                اكتشف تخصصك المثالي في الجامعات الجزائرية
              </h1>
              <p className="text-xl text-white/70 mb-8">
                منصة ذكية تحلل ميولك وقدراتك لتوجيهك نحو أفضل التخصصات والجامعات المناسبة لك
              </p>

              <div className="flex flex-col sm:flex-row gap-3 mb-10">
                <Link href="/sign-up">
                  <Button className="group relative bg-gradient-to-l from-[#006233] to-[#004d28] text-white h-14 px-10 text-lg font-bold w-full sm:w-auto rounded-xl shadow-lg shadow-[#006233]/20 hover:shadow-xl hover:shadow-[#006233]/30 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 flex items-center justify-center gap-3 overflow-hidden">
                    {/* تأثير توهج خفيف في الخلفية عند التمرير */}
                    <div className="absolute inset-0 w-1/2 h-full bg-white/10 skew-x-[-25deg] -translate-x-full group-hover:translate-x-[250%] transition-transform duration-1000 ease-out" />
                    
                    <span>ابدأ اختبار التوجيه المجاني</span>
                    
                    {/* أيقونة السهم التي تتحرك ديناميكياً جهة اليمين/اليسار لتناسب اللغة العربية */}
                    <ArrowLeft className="w-5 h-5 transform group-hover:-translate-x-1.5 transition-transform duration-300" />
                  </Button>
              </Link>
                <Link href="/explorer">
                  <Button className="h-14 px-8 text-lg font-semibold w-full sm:w-auto border-2 border-white text-white bg-white/10 hover:bg-white hover:text-[#0B2340] transition-all duration-200">
                    استكشف التخصصات
                  </Button>
                </Link>
              </div>

              {/* 3 stat cards */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { icon: Building2, value: '45+', label: 'جامعة جزائرية', color: '#006233' },
                  { icon: BookOpen,  value: '250+', label: 'تخصص متاح',    color: '#C8A84B' },
                  { icon: Brain,     value: 'دقيقتين', label: 'للحصول على توصيتك', color: '#D21034' },
                ].map((s) => (
                  <div key={s.label} className="backdrop-blur-md bg-white/10 border border-white/20 rounded-xl p-3 text-center">
                    <s.icon className="w-6 h-6 mx-auto mb-1" style={{ color: s.color }} />
                    <div className="text-white font-bold text-lg leading-none">{s.value}</div>
                    <div className="text-white/60 text-xs mt-1">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: animated illustration */}
            <div className="hidden lg:flex items-center justify-center">
              <div className="relative w-80 h-80">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-24 h-24 rounded-full bg-[#006233] flex items-center justify-center shadow-lg shadow-[#006233]/40">
                    <GraduationCap className="w-12 h-12 text-white" />
                  </div>
                </div>
                {['هندسة', 'طب', 'قانون', 'آداب', 'اقتصاد'].map((s, i) => {
                  const angle = (i / 5) * 2 * Math.PI - Math.PI / 2
                  const r = 120
                  const x = 50 + (r / 160) * 50 * Math.cos(angle)
                  const y = 50 + (r / 160) * 50 * Math.sin(angle)
                  return (
                    <div
                      key={s}
                      style={{ position: 'absolute', left: `${x}%`, top: `${y}%`, transform: 'translate(-50%,-50%)' }}
                      className="bg-white/15 backdrop-blur-md border border-white/25 rounded-lg px-3 py-1.5 text-white text-xs font-medium shadow-md"
                    >
                      {s}
                    </div>
                  )
                })}
                <div className="absolute inset-0 rounded-full border-2 border-[#006233]/30 animate-ping" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS STRIP ─────────────────────────────────────────────────── */}
      <section className="relative py-20 overflow-hidden bg-[#0B2340]">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#006233]/20 rounded-full blur-3xl -translate-y-1/2" />
          <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-[#C8A84B]/10 rounded-full blur-3xl translate-y-1/2" />
          <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        </div>

        <div className="relative max-w-5xl mx-auto px-4">
          {/* <div className="text-center mb-12">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#006233]/30 text-[#80e0a0] text-xs font-semibold tracking-widest uppercase border border-[#006233]/40">
              ✦ بالأرقام
            </span>
          </div> */}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {[
              { value: '253', label: 'جامعة', sublabel: 'عبر كامل التراب الوطني', icon: '🏛️', color: '#006233' },
              { value: '276', label: 'تخصص', sublabel: 'في جميع المجالات', icon: '📚', color: '#C8A84B' },
              { value: '12', label: 'مجال دراسي', sublabel: 'من العلوم إلى الفنون', icon: '🎓', color: '#D21034' },
              { value: '94%', label: 'دقة التوصية', sublabel: 'بفضل الذكاء الاصطناعي', icon: '🤖', color: '#7C3AED' },
            ].map((s, i) => (
              <div
                key={s.label}
                className="relative group rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-6 text-center hover:bg-white/10 hover:border-white/20 transition-all duration-300 hover:-translate-y-1"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div
                  className="absolute top-0 inset-x-0 h-px rounded-full opacity-60"
                  style={{ background: `linear-gradient(90deg, transparent, ${s.color}, transparent)` }}
                />
                <div className="text-3xl mb-3 leading-none">{s.icon}</div>
                <div className="text-5xl font-black leading-none mb-1 tabular-nums" style={{ color: s.color, textShadow: `0 0 30px ${s.color}60` }}>
                  {s.value}
                </div>
                <div className="text-white font-semibold text-sm mt-2">{s.label}</div>
                <div className="text-white/40 text-xs mt-1 leading-tight">{s.sublabel}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ────────────────────────────────────────────────────── */}
      <section className="py-24 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <span className="inline-block px-4 py-1.5 rounded-full bg-[#C8A84B]/10 text-[#C8A84B] text-sm font-medium mb-3">مميزات المنصة</span>
            <h2 className="text-4xl font-bold text-[#0B2340] mb-3">لماذا مساركَ؟</h2>
            <p className="text-gray-500">كل ما تحتاجه لاتخاذ القرار الصحيح</p>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {features.map((f) => (
              <Card key={f.titleAr} className="border border-[#E2E8F0] rounded-xl shadow-sm hover:-translate-y-1 hover:border-[#006233]/40 transition-all duration-200 group">
                <CardContent className="p-6">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${iconColorMap[f.color]} group-hover:scale-110 transition-transform`}>
                    <f.icon className="w-6 h-6" />
                  </div>
                  <div className="h-full border-r-4 border-[#006233] pr-3">
                    <h3 className="text-[#0B2340] font-bold text-base mb-1">{f.titleAr}</h3>
                    <p className="text-gray-500 text-sm leading-relaxed">{f.descAr}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ────────────────────────────────────────────────── */}
      <section id="how-it-works" className="py-24 px-4 bg-[#F4F6F9]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-4xl font-bold text-[#0B2340] mb-3">كيف يعمل مساركَ؟</h2>
          </div>
          <div className="relative">
            <div className="hidden md:block absolute top-10 right-[16.67%] left-[16.67%] h-px border-t-2 border-dashed border-[#006233]/30" />
            <div className="grid md:grid-cols-3 gap-10">
              {[
                { num: '01', color: '#006233', titleAr: 'أجب على أسئلة شخصية', descAr: 'ميولك، قدراتك، شعبة وعلامة بكالوريتك، وولايتك' },
                { num: '02', color: '#C8A84B', titleAr: 'يحلل الذكاء الاصطناعي ملفك', descAr: 'نموذج ذكاء اصطناعي يقارن ملفك بـ 312 تخصص جامعي جزائري' },
                { num: '03', color: '#0B2340', titleAr: 'استقبل توصياتك المخصصة', descAr: 'قائمة التخصصات الأنسب لك مع التفاصيل الكاملة والجامعات المتاحة' },
              ].map((step) => (
                <div key={step.num} className="text-center relative">
                  <div
                    className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5 text-white text-2xl font-bold shadow-lg"
                    style={{ backgroundColor: step.color }}
                  >
                    {step.num}
                  </div>
                  <h3 className="text-[#0B2340] font-bold text-lg mb-2">{step.titleAr}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{step.descAr}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── DOMAINS SHOWCASE ────────────────────────────────────────────── */}
      <section className="py-16 px-4 bg-white overflow-hidden">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-[#0B2340] mb-8 text-center">المجالات الدراسية</h2>
          <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory" style={{ scrollbarWidth: 'none' }}>
            {domains.map((d) => (
              <div
                key={d.nameAr}
                className="snap-start shrink-0 w-44 rounded-2xl p-5 text-white cursor-pointer hover:scale-105 transition-transform shadow-md"
                style={{ backgroundColor: d.color }}
              >
                <div className="text-4xl mb-3">{d.emoji}</div>
                <div className="font-bold text-sm leading-tight mb-1">{d.nameAr}</div>
                <div className="text-white/70 text-xs mb-3">{d.nameFr}</div>
                <span className="inline-block bg-white/20 rounded-full px-2 py-0.5 text-xs">{d.count} تخصص</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURED UNIVERSITIES ───────────────────────────────────────── */}
      <section className="py-16 px-4 bg-[#F4F6F9]">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-[#0B2340] mb-8 text-center">الجامعات المشاركة</h2>
          <div className="flex flex-wrap gap-3 justify-center">
            {universities.map((u) => (
              <div
                key={u}
                className="px-5 py-3 rounded-xl bg-white border border-[#E2E8F0] text-[#0B2340] font-bold text-sm grayscale hover:grayscale-0 hover:border-[#006233] hover:text-[#006233] transition-all shadow-sm cursor-pointer"
              >
                {u}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ────────────────────────────────────────────────── */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-[#0B2340] mb-10 text-center">ماذا يقول طلابنا؟</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <Card key={t.nameAr} className="border border-[#E2E8F0] rounded-xl shadow-sm p-6">
                <CardContent className="p-0">
                  <StarRating count={t.stars} />
                  <p className="text-[#0B2340] mt-4 mb-5 text-sm leading-relaxed">"{t.quote}"</p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#006233] text-white flex items-center justify-center font-bold text-sm">
                      {t.initials}
                    </div>
                    <div>
                      <div className="font-bold text-[#0B2340] text-sm">{t.nameAr}</div>
                      <div className="text-xs text-gray-400">{t.wilaya} · {t.specialty}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ───────────────────────────────────────────────────── */}
      <section className="relative py-28 px-4 overflow-hidden bg-gradient-to-br from-[#0B2340] via-[#004d28] to-[#006233]">
      
      {/* 1. تأثير الشبكة والأضواء الخلفية العصرية */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:32px_32px]" />
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-[#006233] rounded-full blur-[120px] opacity-50 pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-[#0B2340] rounded-full blur-[120px] opacity-60 pointer-events-none" />

      {/* 2. حاوية المحتوى الرئيسية مع تأثير الزجاج الناعم */}
      <div className="relative max-w-4xl mx-auto">
        <div className="bg-white/[0.03] backdrop-blur-md border border-white/10 rounded-3xl p-8 md:p-16 text-center shadow-2xl shadow-black/20">
          
          {/* شارة علوية صغيرة ومحفزة */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/10 text-white text-sm mb-6 font-medium tracking-wide animate-pulse">
            <Sparkles className="w-4 h-4 text-[#C8A84B]" />
            <span>مدعوم بالذكاء الاصطناعي</span>
          </div>

          {/* العنوان الرئيسي بخط مريح ومتناسق */}
          <h2 className="text-3xl md:text-5xl font-black text-white mb-4 tracking-tight leading-tight font-sans">
            جاهز لاكتشاف مسارك الجامعي؟
          </h2>
          
          {/* الوصف الفرعي بوضوح عالي */}
          <p className="text-white/80 mb-10 text-base md:text-xl max-w-xl mx-auto font-normal leading-relaxed">
            أكمل اختبارك المجاني واكتشف تخصصك المثالي في أقل من <span className="text-[#C8A84B] font-bold">دقيقتين</span>
          </p>

          {/* 3. الزر الرئيسي بتأثيرات حركية فاخرة (Hover Effects) */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/sign-up" className="w-full sm:w-auto">
              <Button
                size="lg"
                className="group relative h-14 px-10 text-lg font-bold rounded-xl bg-white text-[#0B2340] hover:bg-gradient-to-l hover:from-[#C8A84B] hover:to-[#b39237] hover:text-white border-0 shadow-lg shadow-black/25 hover:shadow-xl hover:shadow-[#C8A84B]/20 hover:-translate-y-1 active:translate-y-0 transition-all duration-300 w-full sm:w-auto flex items-center justify-center gap-3 overflow-hidden"
              >
                {/* تأثير لمعان البريق عند تمرير الماوس */}
                <div className="absolute inset-0 w-1/2 h-full bg-white/20 skew-x-[-25deg] -translate-x-full group-hover:translate-x-[300%] transition-transform duration-1000 ease-out" />
                
                <span>ابدأ اختبار التوجيه المجاني</span>
                <ArrowLeft className="w-5 h-5 transform group-hover:-translate-x-1.5 transition-transform duration-300" />
              </Button>
            </Link>
          </div>

          {/* 4. نص التأكيد السفلي بشكل احترافي مريح */}
          <div className="text-white/60 text-sm mt-8 flex items-center justify-center gap-2 bg-white/[0.04] w-fit mx-auto px-4 py-2 rounded-lg border border-white/5">
            <CheckCircle className="w-4 h-4 text-[#C8A84B]" />
            <span>مجاني تمامًا — لا يتطلب بطاقة ائتمان للبدء</span>
          </div>

        </div>
      </div>
    </section>

      {/* ── FOOTER ── */}
      <PublicFooter />

    </div>
  )
}
