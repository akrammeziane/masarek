
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { signOut } from '@/lib/auth-client'
import { createOrUpdateProfile, resetAssessment } from '@/app/actions/student'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  Settings, LogOut, ChevronLeft, ChevronRight, LayoutDashboard, Brain,
  Compass, Building2, TrendingUp, User, BookOpen, RefreshCw, Shield,
  CheckCircle, AlertTriangle, Loader2, MapPin, GraduationCap, X, Menu,
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

const BAC_SERIES_LIST = [
  { value: 'sciences-exp',  label: 'علوم تجريبية' },
  { value: 'math',          label: 'رياضيات' },
  { value: 'tech-math',     label: 'تقني رياضي' },
  { value: 'letters-philo', label: 'آداب وفلسفة' },
  { value: 'languages',     label: 'لغات أجنبية' },
  { value: 'gestion-eco',   label: 'تسيير واقتصاد' },
]

const BAC_SERIES_LABELS: Record<string, string> = {
  'sciences-exp': 'علوم تجريبية', 'math': 'رياضيات', 'tech-math': 'تقني رياضي',
  'letters-philo': 'آداب وفلسفة', 'languages': 'لغات أجنبية', 'gestion-eco': 'تسيير واقتصاد',
}

const ALL_WILAYAS = [
  'الجزائر','وهران','قسنطينة','عنابة','باتنة','سطيف','تيزي وزو','بجاية',
  'تلمسان','ورقلة','بسكرة','المدية','البليدة','سكيكدة','جيجل','بومرداس',
  'تبسة','برج بوعريريج','المسيلة','البويرة','خنشلة','سوق أهراس',
  'ميلة','غليزان','مستغانم','تيبازة','سيدي بلعباس','معسكر',
]

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: 'لوحة التحكم',    href: '/dashboard' },
  { icon: Brain,           label: 'اختبار التوجيه', href: '/assessment' },
  { icon: TrendingUp,      label: 'نتائجي',          href: '/results' },
  { icon: Compass,         label: 'التخصصات',        href: '/explorer?from=dashboard' },
  { icon: Building2,       label: 'الجامعات',        href: '/universities?from=dashboard' },
  { icon: Settings,        label: 'الإعدادات',       href: '/settings', active: true },
]

interface SettingsContentProps {
  user: { id: string; name: string; email: string; image?: string | null }
  profile: {
    bacSeries: string | null; bacScore: string | null; wilaya: string | null
    assessmentCompleted: boolean | null; xpPoints: number | null
  }
  // FIX: rate-limit props for controlling the retake button
  canRetake?: boolean
  hoursLeft?: number
  attemptsLeft?: number
  attemptsUsed?: number
}

type Tab = 'profile' | 'assessment' | 'account'

export function SettingsContent({ user, profile, canRetake = true, hoursLeft = 0, attemptsLeft = 2, attemptsUsed = 0 }: SettingsContentProps) {
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<Tab>('profile')

  // Profile form state
  const [bacSeries, setBacSeries] = useState(profile.bacSeries ?? '')
  const [bacGrade, setBacGrade]   = useState(profile.bacScore ? parseFloat(profile.bacScore) : 14)
  const [wilaya, setWilaya]       = useState(profile.wilaya ?? '')
  const [saving, setSaving]       = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [saveError, setSaveError]     = useState('')

  // Reset assessment state
  const [confirmReset, setConfirmReset] = useState(false)
  const [resetting, setResetting]       = useState(false)

  async function handleSaveProfile() {
    if (!bacSeries) { setSaveError('يرجى اختيار الشعبة'); return }
    if (!wilaya)    { setSaveError('يرجى اختيار الولاية'); return }
    setSaving(true); setSaveError(''); setSaveSuccess(false)
    try {
      await createOrUpdateProfile({ bacSeries, bacScore: bacGrade, wilaya })
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch {
      setSaveError('حدث خطأ. يرجى المحاولة مجدداً.')
    } finally {
      setSaving(false)
    }
  }

  async function handleResetAssessment() {
    setResetting(true)
    try {
      await resetAssessment()
      setConfirmReset(false)
      router.push('/assessment')
    } catch {
      setResetting(false)
    }
  }

  const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'profile',    label: 'الملف الأكاديمي', icon: GraduationCap },
    { id: 'assessment', label: 'الاختبار',         icon: Brain },
    { id: 'account',    label: 'الحساب',           icon: User },
  ]

  return (
    <div className="flex min-h-screen bg-[#F4F6F9]" dir="rtl">

      {/* ── MOBILE OVERLAY ── */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* ── SIDEBAR ── */}
      <aside className={`
        fixed md:relative z-40 md:z-auto
        ${mobileSidebarOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}
        right-0 top-0 h-full md:h-screen md:sticky md:top-0
        w-60 ${sidebarOpen ? 'md:w-60' : 'md:w-16'}
        shrink-0 bg-[#0B2340] text-white flex flex-col transition-all duration-300
      `}>
        {/* Close button — mobile only */}
        <button
          onClick={() => setMobileSidebarOpen(false)}
          className="absolute left-3 top-3 md:hidden w-8 h-8 bg-white/10 rounded-full flex items-center justify-center"
        >
          <X className="w-4 h-4 text-white" />
        </button>

        {/* Collapse toggle — desktop only */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="hidden md:flex absolute -left-3 top-20 w-6 h-6 bg-[#006233] rounded-full items-center justify-center z-10 shadow-md"
        >
          {sidebarOpen ? <ChevronRight className="w-3 h-3 text-white" /> : <ChevronLeft className="w-3 h-3 text-white" />}
        </button>

        <div className="p-4 flex items-center gap-2 border-b border-white/10 mt-2 md:mt-0">
          <div className="shrink-0"><MasarekLogo size={36} /></div>
          {(sidebarOpen || mobileSidebarOpen) && (
            <div>
              <span className="font-bold text-lg leading-none">مساركَ</span>
              <span className="text-xs text-white/50 block leading-none">Masarek.dz</span>
            </div>
          )}
        </div>

        <div className={`p-4 border-b border-white/10 ${!sidebarOpen ? 'md:flex md:justify-center' : ''}`}>
          <div className={`flex items-center gap-3 ${!sidebarOpen ? 'md:justify-center' : ''}`}>
            <Avatar className="w-9 h-9 shrink-0">
              <AvatarFallback className="bg-[#006233] text-white text-sm font-bold">{user.name.charAt(0)}</AvatarFallback>
            </Avatar>
            {(sidebarOpen || mobileSidebarOpen) && (
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-sm truncate">{user.name}</div>
                {profile.wilaya && (
                  <Badge className="mt-0.5 text-xs bg-[#006233]/30 text-[#80e0a0] border-0 px-1.5 py-0">{profile.wilaya}</Badge>
                )}
              </div>
            )}
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors group ${
                item.active ? 'bg-white/15 text-white' : 'hover:bg-white/10 text-white/80'
              } ${!sidebarOpen ? 'md:justify-center' : ''}`}
            >
              <item.icon className="w-4 h-4 shrink-0" />
              {(sidebarOpen || mobileSidebarOpen) && <span className="text-sm">{item.label}</span>}
            </Link>
          ))}
        </nav>

        <div className="p-3 border-t border-white/10">
          <button
            onClick={() => signOut()}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-red-500/20 text-white/60 hover:text-[#D21034] transition-colors w-full ${!sidebarOpen ? 'md:justify-center' : ''}`}
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {(sidebarOpen || mobileSidebarOpen) && <span className="text-sm">تسجيل الخروج</span>}
          </button>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <main className="flex-1 overflow-auto min-w-0">
        <header className="bg-white border-b border-[#E2E8F0] px-4 md:px-6 py-3 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-3">
            {/* Hamburger — mobile only */}
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="md:hidden w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100"
            >
              <Menu className="w-5 h-5 text-gray-600" />
            </button>
            <div className="flex items-center gap-2">
              <Settings className="w-4 h-4 text-[#006233]" />
              <span className="font-semibold text-[#0B2340]">الإعدادات</span>
            </div>
          </div>
          <Avatar className="w-8 h-8">
            <AvatarFallback className="bg-[#006233] text-white text-xs font-bold">{user.name.charAt(0)}</AvatarFallback>
          </Avatar>
        </header>

        <div className="p-4 md:p-6 max-w-3xl">
          {/* Tabs */}
          <div className="flex gap-1 bg-white border border-[#E2E8F0] rounded-xl p-1 mb-6 w-fit">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === t.id
                    ? 'bg-[#006233] text-white shadow-sm'
                    : 'text-gray-600 hover:bg-[#F4F6F9]'
                }`}
              >
                <t.icon className="w-4 h-4" />
                {t.label}
              </button>
            ))}
          </div>

          {/* ── TAB: PROFILE ── */}
          {activeTab === 'profile' && (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-bold text-[#0B2340] mb-1">الملف الأكاديمي</h2>
                <p className="text-gray-500 text-sm">تحديث معلوماتك الأكاديمية يحسّن دقة توصيات الذكاء الاصطناعي</p>
              </div>

              {/* Read-only info */}
              <Card className="border-[#E2E8F0]">
                <CardContent className="p-5 space-y-3">
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">معلومات الحساب</h3>
                  <div className="flex items-center justify-between py-2 border-b border-[#F4F6F9]">
                    <span className="text-sm text-gray-500">الاسم الكامل</span>
                    <span className="font-medium text-[#0B2340]">{user.name}</span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm text-gray-500">البريد الإلكتروني</span>
                    <span className="font-medium text-[#0B2340]">{user.email}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Editable academic info */}
              <Card className="border-[#E2E8F0]">
                <CardContent className="p-5 space-y-5">
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">المعلومات الأكاديمية</h3>

                  {/* Bac Series */}
                  <div>
                    <label className="text-sm font-semibold text-[#0B2340] block mb-2">
                      شعبة البكالوريا <span className="text-[#D21034]">*</span>
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {BAC_SERIES_LIST.map(s => (
                        <button key={s.value} onClick={() => setBacSeries(s.value)}
                          className={`px-3 py-2.5 rounded-lg border text-xs font-medium transition-colors ${
                            bacSeries === s.value
                              ? 'bg-[#006233] text-white border-[#006233]'
                              : 'border-[#E2E8F0] text-[#0B2340] hover:border-[#006233] bg-white'
                          }`}>
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Bac Grade */}
                  <div className="bg-[#F4F6F9] rounded-xl p-4">
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-sm font-semibold text-[#0B2340]">معدل البكالوريا</label>
                      <span className="text-[#006233] font-bold text-xl">
                        {bacGrade.toFixed(2)}<span className="text-sm font-normal text-gray-400">/20</span>
                      </span>
                    </div>
                    <input
                      type="range" min={0} max={20} step={0.25} value={bacGrade}
                      onChange={e => setBacGrade(+e.target.value)}
                      className="w-full accent-[#006233]"
                    />
                    <div className="flex justify-between text-xs text-gray-400 mt-1">
                      <span>0</span><span>10</span><span>20</span>
                    </div>
                    <div className="flex gap-1.5 mt-3 flex-wrap">
                      {[10,11,12,13,14,15,16,17,18,19,20].map(v => (
                        <button key={v} onClick={() => setBacGrade(v)}
                          className={`text-xs px-2 py-1 rounded border transition-colors ${
                            Math.abs(bacGrade - v) < 0.5
                              ? 'bg-[#006233] text-white border-[#006233]'
                              : 'border-[#E2E8F0] text-gray-500 hover:border-[#006233] bg-white'
                          }`}>{v}</button>
                      ))}
                    </div>
                  </div>

                  {/* Wilaya */}
                  <div>
                    <label className="text-sm font-semibold text-[#0B2340] block mb-2 flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-[#006233]" /> الولاية <span className="text-[#D21034]">*</span>
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {ALL_WILAYAS.map(w => (
                        <button key={w} onClick={() => setWilaya(w)}
                          className={`px-3 py-1.5 rounded-full text-xs border transition-colors ${
                            wilaya === w
                              ? 'bg-[#006233] text-white border-[#006233]'
                              : 'border-[#E2E8F0] text-[#0B2340] hover:border-[#006233] bg-white'
                          }`}>
                          {w}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Feedback */}
                  {saveSuccess && (
                    <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-3 text-sm">
                      <CheckCircle className="w-4 h-4 shrink-0" /> تم حفظ التغييرات بنجاح
                    </div>
                  )}
                  {saveError && (
                    <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
                      <AlertTriangle className="w-4 h-4 shrink-0" /> {saveError}
                    </div>
                  )}

                  <Button
                    onClick={handleSaveProfile}
                    disabled={saving}
                    className="bg-[#006233] hover:bg-[#004d28] text-white gap-2"
                  >
                    {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> جارٍ الحفظ...</> : 'حفظ التغييرات'}
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}

          {/* ── TAB: ASSESSMENT ── */}
          {activeTab === 'assessment' && (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-bold text-[#0B2340] mb-1">إعدادات الاختبار</h2>
                <p className="text-gray-500 text-sm">إدارة اختبار التوجيه ونتائجه</p>
              </div>

              {/* Status card */}
              <Card className="border-[#E2E8F0]">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        profile.assessmentCompleted ? 'bg-[#006233]/10' : 'bg-gray-100'
                      }`}>
                        <Brain className={`w-5 h-5 ${profile.assessmentCompleted ? 'text-[#006233]' : 'text-gray-400'}`} />
                      </div>
                      <div>
                        <div className="font-semibold text-[#0B2340] text-sm">حالة الاختبار</div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          {profile.assessmentCompleted ? 'تم إكمال الاختبار بنجاح' : 'لم تُكمل الاختبار بعد'}
                        </div>
                      </div>
                    </div>
                    <Badge className={profile.assessmentCompleted ? 'bg-[#006233]/10 text-[#006233] border-0' : 'bg-gray-100 text-gray-500 border-0'}>
                      {profile.assessmentCompleted ? 'مكتمل ✓' : 'غير مكتمل'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Start / Retake */}
              <Card className="border-[#E2E8F0]">
                <CardContent className="p-5">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-[#006233]/10 flex items-center justify-center shrink-0">
                      <RefreshCw className="w-5 h-5 text-[#006233]" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-[#0B2340] text-sm">
                        {profile.assessmentCompleted ? 'إعادة اختبار التوجيه' : 'بدء اختبار التوجيه'}
                      </h3>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {profile.assessmentCompleted
                          ? 'ستُحذف نتائجك الحالية ويبدأ الاختبار من جديد مع معطيات جديدة'
                          : 'أجب على 5 أسئلة وسيقترح الذكاء الاصطناعي أفضل التخصصات لك'}
                      </p>
                    </div>
                  </div>

                  {/* FIX: retake button — blocked if rate limit hit */}
                  {profile.assessmentCompleted && !confirmReset && (
                    canRetake ? (
                      <Button
                        variant="outline"
                        onClick={() => setConfirmReset(true)}
                        className="border-[#D21034]/30 text-[#D21034] hover:bg-[#D21034]/5 gap-2"
                      >
                        <RefreshCw className="w-4 h-4" />
                        إعادة الاختبار ({attemptsLeft} محاولة متبقية)
                      </Button>
                    ) : (
                      <div className="rounded-xl bg-gray-50 border border-gray-200 px-4 py-3 text-sm text-gray-500">
                        ⏱ لقد استنفذت محاولاتك اليومية (2/2). يمكنك إعادة الاختبار بعد <strong>{hoursLeft} ساعة</strong>.
                      </div>
                    )
                  )}

                  {profile.assessmentCompleted && confirmReset && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-3">
                      <div className="flex items-center gap-2 text-red-700 text-sm font-medium">
                        <AlertTriangle className="w-4 h-4" /> تأكيد إعادة الاختبار
                      </div>
                      <p className="text-red-600 text-xs">سيتم إعادة ضبط حالة الاختبار وستبدأ من جديد. نتائجك السابقة محفوظة في قاعدة البيانات. هل أنت متأكد؟</p>
                      <div className="flex gap-2">
                        <Button
                          onClick={handleResetAssessment}
                          disabled={resetting}
                          className="bg-[#D21034] hover:bg-red-700 text-white text-sm gap-2"
                        >
                          {resetting ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> جارٍ الإعادة...</> : 'نعم، أعد الاختبار'}
                        </Button>
                        <Button variant="outline" onClick={() => setConfirmReset(false)} className="text-sm">إلغاء</Button>
                      </div>
                    </div>
                  )}

                  {!profile.assessmentCompleted && (
                    <Link href="/assessment">
                      <Button className="bg-[#006233] hover:bg-[#004d28] text-white gap-2">
                        <Brain className="w-4 h-4" /> ابدأ الاختبار الآن
                      </Button>
                    </Link>
                  )}
                </CardContent>
              </Card>

              {/* View results */}
              {profile.assessmentCompleted && (
                <Card className="border-[#E2E8F0]">
                  <CardContent className="p-5 flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-[#0B2340] text-sm">عرض نتائجي</h3>
                      <p className="text-xs text-gray-500 mt-0.5">تصفح توصيات الذكاء الاصطناعي</p>
                    </div>
                    <Link href="/results">
                      <Button size="sm" className="bg-[#006233] text-white hover:bg-[#004d28] gap-1.5">
                        عرض <ChevronLeft className="w-3.5 h-3.5" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* ── TAB: ACCOUNT ── */}
          {activeTab === 'account' && (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-bold text-[#0B2340] mb-1">إعدادات الحساب</h2>
                <p className="text-gray-500 text-sm">إدارة حسابك وخصوصيتك</p>
              </div>

              <Card className="border-[#E2E8F0]">
                <CardContent className="p-5 space-y-3">
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">معلومات الحساب</h3>
                  <div className="flex items-center gap-4 py-2">
                    <Avatar className="w-14 h-14">
                      <AvatarFallback className="bg-[#006233] text-white text-xl font-bold">{user.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-bold text-[#0B2340]">{user.name}</div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                      <Badge className="mt-1 bg-[#006233]/10 text-[#006233] border-0 text-xs">طالب مسجّل</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-[#E2E8F0]">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <Shield className="w-5 h-5 text-[#0B2340]" />
                    <h3 className="font-semibold text-[#0B2340] text-sm">الخصوصية والبيانات</h3>
                  </div>
                  <div className="space-y-3 text-sm text-gray-600">
                    <div className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-[#006233] mt-0.5 shrink-0" />
                      <span>بياناتك محمية ولا تُشارَك مع أطراف ثالثة</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-[#006233] mt-0.5 shrink-0" />
                      <span>إجاباتك تُستخدم فقط لتقديم التوصيات</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-[#006233] mt-0.5 shrink-0" />
                      <span>يمكنك حذف بياناتك في أي وقت</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-red-200 bg-red-50">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3 mb-2">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                    <h3 className="font-semibold text-red-700 text-sm">تسجيل الخروج</h3>
                  </div>
                  <p className="text-xs text-red-500 mb-4">سيتم إنهاء الجلسة الحالية وإعادة توجيهك لصفحة تسجيل الدخول</p>
                  <Button
                    variant="outline"
                    onClick={() => signOut()}
                    className="border-red-300 text-red-600 hover:bg-red-100 gap-2"
                  >
                    <LogOut className="w-4 h-4" /> تسجيل الخروج
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
