'use client'

import { useState } from 'react'
import Link from 'next/link'
import { signOut } from '@/lib/auth-client'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Brain, Compass, Settings, LogOut, ChevronLeft, ChevronRight,
  LayoutDashboard, Building2, TrendingUp, RefreshCw, X, Menu,
} from 'lucide-react'

function MasarekLogo({ size = 38 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="40" height="40" rx="10" fill="#006233"/>
      <path d="M8 28 C8 28 10 20 16 20 C19 20 20 22 20 24 C20 26 18 27 16 27 C14 27 13 26 13 24" stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
      <path d="M20 24 L32 12" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M28 12 L32 12 L32 16" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

const BAC_SERIES_LABELS: Record<string, string> = {
  'sciences-exp': 'علوم تجريبية', 'math': 'رياضيات', 'tech-math': 'تقني رياضي',
  'letters-philo': 'آداب وفلسفة', 'languages': 'لغات أجنبية', 'gestion-eco': 'تسيير واقتصاد',
}

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: 'لوحة التحكم',    href: '/dashboard' },
  { icon: Brain,           label: 'اختبار التوجيه', href: '/assessment' },
  { icon: TrendingUp,      label: 'نتائجي',          href: '/results' },
  { icon: Compass,         label: 'التخصصات',        href: '/explorer?from=dashboard' },
  { icon: Building2,       label: 'الجامعات',        href: '/universities?from=dashboard' },
  { icon: Settings,        label: 'الإعدادات',       href: '/settings' },
]

interface Recommendation {
  id: number; matchScore: number; rank: number; nameAr: string
  nameFr: string; fieldAr: string; careerPaths: string[]; createdAt: Date
}

interface DashboardContentProps {
  user: { id: string; name: string; email: string; image?: string | null }
  profile: {
    bacSeries: string | null; bacScore: string | null; wilaya: string | null
    assessmentCompleted: boolean | null; xpPoints: number | null; level: number | null
  } | null
  recommendations: Recommendation[]
}

export function DashboardContent({ user, profile, recommendations }: DashboardContentProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleSignOut = async () => { await signOut() }

  const profileFields = profile
    ? [!!profile.bacSeries, !!profile.bacScore, !!profile.wilaya, !!profile.assessmentCompleted]
    : [false, false, false, false]
  const profileCompleteness = Math.round((profileFields.filter(Boolean).length / profileFields.length) * 100)

  const today = new Date().toLocaleDateString('ar-DZ', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })

  const topRec = recommendations[0] ?? null
  const assessmentDate = topRec?.createdAt
    ? new Date(topRec.createdAt).toLocaleDateString('ar-DZ', { year: 'numeric', month: 'short', day: 'numeric' })
    : null

  return (
    <div className="flex min-h-screen bg-[#F4F6F9]" dir="rtl">

      {/* ── MOBILE OVERLAY ── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── SIDEBAR ── */}
      <aside className={`
        fixed md:relative z-40 md:z-auto
        ${sidebarOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}
        right-0 top-0 h-full
        w-64 md:w-60
        bg-[#0B2340] text-white flex flex-col
        transition-transform duration-300
      `}>
        {/* Close button mobile */}
        <button
          onClick={() => setSidebarOpen(false)}
          className="absolute left-3 top-3 md:hidden w-8 h-8 bg-white/10 rounded-full flex items-center justify-center"
        >
          <X className="w-4 h-4 text-white" />
        </button>

        <div className="p-4 flex items-center gap-2 border-b border-white/10 mt-2 md:mt-0">
          <MasarekLogo size={36} />
          <div>
            <span className="font-bold text-lg leading-none">مساركَ</span>
            <span className="text-xs text-white/50 block leading-none">Masarek.dz</span>
          </div>
        </div>

        <div className="p-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <Avatar className="w-9 h-9 shrink-0">
              <AvatarFallback className="bg-[#006233] text-white text-sm font-bold">{user.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="font-semibold text-sm truncate">{user.name}</div>
              {profile?.wilaya && (
                <Badge className="mt-0.5 text-xs bg-[#006233]/30 text-[#80e0a0] border-0 px-1.5 py-0">{profile.wilaya}</Badge>
              )}
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setSidebarOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/10 transition-colors group"
            >
              <item.icon className="w-4 h-4 shrink-0 text-white/70 group-hover:text-white" />
              <span className="text-sm text-white/80 group-hover:text-white">{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="p-3 border-t border-white/10">
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-red-500/20 text-white/60 hover:text-[#D21034] transition-colors w-full"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            <span className="text-sm">تسجيل الخروج</span>
          </button>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <main className="flex-1 overflow-auto min-w-0">
        {/* Header */}
        <header className="bg-white border-b border-[#E2E8F0] px-4 py-3 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-3">
            {/* Hamburger — mobile only */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100"
            >
              <Menu className="w-5 h-5 text-gray-600" />
            </button>
            <div className="text-xs text-gray-500 hidden sm:block">{today}</div>
          </div>
          <div className="flex items-center gap-2">
            <MasarekLogo size={28} />
            <Avatar className="w-8 h-8">
              <AvatarFallback className="bg-[#006233] text-white text-xs font-bold">{user.name.charAt(0)}</AvatarFallback>
            </Avatar>
          </div>
        </header>

        <div className="p-4 md:p-6 space-y-5 max-w-5xl">
          {/* Welcome */}
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-[#0B2340]">مرحباً {user.name}! 👋</h1>
            <p className="text-gray-500 text-sm mt-1">هذا هو ملخص وضعك الأكاديمي</p>
          </div>

          {/* No profile */}
          {!profile && (
            <div className="rounded-xl p-6 bg-white border-2 border-dashed border-[#C8A84B]/40 text-center">
              <Settings className="w-10 h-10 text-[#C8A84B]/60 mx-auto mb-3" />
              <h3 className="font-bold text-[#0B2340] mb-1">لم يتم إعداد ملفك الشخصي بعد</h3>
              <p className="text-gray-500 text-sm mb-4">أضف معلوماتك الأكاديمية حتى نتمكن من تقديم توصيات مناسبة لك</p>
              <Link href="/settings">
                <button className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-[#006233] text-white hover:bg-[#004d28] transition-all">
                  <Settings className="w-4 h-4" /> أكمل ملفك الشخصي
                </button>
              </Link>
            </div>
          )}

          {/* Profile completeness */}
          {profile && (
            <Card className="border-[#E2E8F0]">
              <CardContent className="p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-[#0B2340]">اكتمال الملف الشخصي</span>
                  <span className="text-sm font-bold text-[#006233]">{profileCompleteness}%</span>
                </div>
                <Progress value={profileCompleteness} className="h-2.5" />
                {profileCompleteness < 100 && (
                  <p className="text-xs text-gray-400 mt-2">
                    {!profile.assessmentCompleted ? 'أكمل اختبار التوجيه للحصول على توصيات مخصصة' : 'ملفك مكتمل بشكل جيد'}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Stats */}
          {profile && (
            <div className="grid grid-cols-2 gap-3">
              {[
                {
                  label: 'معدل البكالوريا',
                  value: profile.bacScore ? `${parseFloat(profile.bacScore).toFixed(2)}/20` : '—',
                  color: '#C8A84B',
                },
                {
                  label: 'الشعبة',
                  value: profile.bacSeries ? (BAC_SERIES_LABELS[profile.bacSeries] ?? profile.bacSeries) : '—',
                  color: '#006233',
                },
                {
                  label: 'التوصيات المتاحة',
                  value: recommendations.length > 0 ? `${recommendations.length} تخصص` : '0',
                  color: '#0B2340',
                },
                {
                  label: 'آخر اختبار',
                  value: assessmentDate ?? '—',
                  color: '#D21034',
                },
              ].map((s) => (
                <Card key={s.label} className="border-[#E2E8F0] overflow-hidden">
                  <div className="h-1" style={{ backgroundColor: s.color }} />
                  <CardContent className="p-3">
                    <div className="text-sm font-bold leading-tight break-words" style={{ color: s.color }}>{s.value}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* AI Banner */}
          {profile && (
            profile.assessmentCompleted && topRec ? (
              <div className="rounded-xl p-4 md:p-6 text-white" style={{ background: 'linear-gradient(135deg, #006233, #004d28)' }}>
                {/* Mobile: stacked, Desktop: row */}
                <div className="flex flex-col gap-4">
                  {/* Top row: circle + text */}
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full border-4 border-white/30 flex flex-col items-center justify-center shrink-0">
                      <div className="text-xl font-bold">{Math.round(topRec.matchScore)}%</div>
                      <div className="text-white/70 text-xs">توافق</div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-white/60 mb-1">التخصص الأنسب لك بحسب الذكاء الاصطناعي</div>
                      <div className="text-base font-bold leading-snug">{topRec.nameAr}</div>
                      {topRec.nameFr && topRec.nameFr !== topRec.nameAr && (
                        <div className="text-white/60 text-xs mt-0.5">{topRec.nameFr}</div>
                      )}
                    </div>
                  </div>
                  {/* Career paths */}
                  <div className="flex gap-2 flex-wrap">
                    {topRec.careerPaths.slice(0, 3).map(p => (
                      <span key={p} className="bg-white/15 text-white text-xs px-2.5 py-1 rounded-full">{p}</span>
                    ))}
                  </div>
                  {/* Button full width on mobile */}
                  <Link href="/results">
                    <Button className="w-full md:w-auto bg-white text-[#006233] hover:bg-white/90 font-semibold text-sm">
                      عرض التقرير
                    </Button>
                  </Link>
                </div>
              </div>
            ) : !profile.assessmentCompleted ? (
              <div className="rounded-xl p-6 bg-white border-2 border-dashed border-[#006233]/30 text-center">
                <Brain className="w-10 h-10 text-[#006233]/40 mx-auto mb-3" />
                <h3 className="font-bold text-[#0B2340] mb-1">لم تُكمل اختبار التوجيه بعد</h3>
                <p className="text-gray-500 text-sm mb-4">أجب على 5 أسئلة بسيطة وسيقترح الذكاء الاصطناعي أفضل التخصصات لك</p>
                <Link href="/assessment">
                  <button className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-[#006233] text-white hover:bg-[#004d28] transition-all">
                    <Brain className="w-4 h-4" /> ابدأ اختبار التوجيه
                  </button>
                </Link>
              </div>
            ) : null
          )}

          {/* Recommendations table */}
          {recommendations.length > 0 && (
            <Card className="border-[#E2E8F0]">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-[#0B2340] text-sm">آخر توصيات الذكاء الاصطناعي</h3>
                  <Link href="/results">
                    <Button variant="ghost" size="sm" className="text-[#006233] text-xs gap-1">
                      عرض الكل <ChevronLeft className="w-3 h-3" />
                    </Button>
                  </Link>
                </div>
                <div className="space-y-2">
                  {recommendations.slice(0, 5).map((r) => (
                    <div key={r.id} className="flex items-center gap-3 py-2 border-b border-[#F4F6F9] last:border-0">
                      <span className="text-gray-400 font-bold text-xs w-6 shrink-0">#{r.rank}</span>
                      <span className="flex-1 font-medium text-[#0B2340] text-sm truncate">{r.nameAr}</span>
                      <span className="bg-[#006233]/10 text-[#006233] text-xs font-bold px-2 py-0.5 rounded-full shrink-0">
                        {Math.round(r.matchScore)}%
                      </span>
                      <Link href="/results" className="shrink-0">
                        <Button variant="ghost" size="sm" className="text-[#006233] text-xs h-7 px-2">عرض</Button>
                      </Link>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quick actions */}
          <div className="grid grid-cols-2 gap-3">
            {[
              {
                icon: profile?.assessmentCompleted ? RefreshCw : Brain,
                label: profile?.assessmentCompleted ? 'إعادة الاختبار' : 'ابدأ الاختبار',
                href: profile?.assessmentCompleted ? '/assessment?reset=1' : '/assessment',
                color: '#006233',
              },
              { icon: Compass,   label: 'استكشف التخصصات', href: '/explorer?from=dashboard',     color: '#0B2340' },
              { icon: Building2, label: 'ابحث عن جامعة',   href: '/universities?from=dashboard', color: '#C8A84B' },
              { icon: Settings,  label: 'الإعدادات',        href: '/settings',                   color: '#D21034' },
            ].map((a) => (
              <Link key={a.label} href={a.href}>
                <Card className="border-[#E2E8F0] hover:-translate-y-1 hover:border-[#006233]/30 transition-all cursor-pointer h-full">
                  <CardContent className="p-4 flex flex-col items-center text-center gap-2">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: a.color + '15' }}>
                      <a.icon className="w-5 h-5" style={{ color: a.color }} />
                    </div>
                    <span className="text-xs font-medium text-[#0B2340] leading-tight">{a.label}</span>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          {/* Bottom padding for mobile */}
          <div className="h-4" />
        </div>
      </main>
    </div>
  )
}
