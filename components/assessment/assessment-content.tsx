
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { saveFullAssessment, addXP } from '@/app/actions/student'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import {
  GraduationCap, ChevronLeft, ChevronRight,
  Loader2, Brain, CheckCircle, AlertCircle, LayoutDashboard,
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

interface AssessmentContentProps {
  profile: { bacSeries: string | null; bacScore?: string | null }
  canRetake?: boolean
  hoursLeft?: number
  attemptsLeft?: number   // FIX: attempts remaining in rolling 24h window
  attemptsUsed?: number   // FIX: attempts used in rolling 24h window
}

const STEP_LABELS = [
  'الميول والاهتمامات',
  'القدرات والمهارات',
  'البيئة المفضلة',
  'الأولويات المهنية',
  'المعلومات الأكاديمية',
]

const INTERESTS = [
  { value: 'sciences',   label: 'العلوم',      emoji: '🔬' },
  { value: 'tech',       label: 'التكنولوجيا', emoji: '💻' },
  { value: 'medicine',   label: 'الطب',         emoji: '🏥' },
  { value: 'arts',       label: 'الفن',         emoji: '🎨' },
  { value: 'business',   label: 'الأعمال',      emoji: '💼' },
  { value: 'law',        label: 'القانون',      emoji: '⚖️' },
  { value: 'education',  label: 'التعليم',      emoji: '📚' },
  { value: 'sports',     label: 'الرياضة',      emoji: '⚽' },
  { value: 'env',        label: 'البيئة',       emoji: '🌿' },
  { value: 'languages',  label: 'اللغات',       emoji: '🌐' },
  { value: 'politics',   label: 'السياسة',      emoji: '🏛️' },
  { value: 'engineering',label: 'الهندسة',      emoji: '⚙️' },
]

const STRENGTHS = [
  { key: 'logic',      label: 'التحليل المنطقي', emoji: '🧠' },
  { key: 'creativity', label: 'الإبداع',          emoji: '🎨' },
  { key: 'comms',      label: 'التواصل',          emoji: '🗣️' },
  { key: 'leadership', label: 'قيادة الفريق',     emoji: '👥' },
  { key: 'math',       label: 'الرياضيات',        emoji: '📐' },
  { key: 'writing',    label: 'الكتابة',          emoji: '✍️' },
  { key: 'problem',    label: 'حل المشكلات',      emoji: '💡' },
  { key: 'org',        label: 'التنظيم',          emoji: '📋' },
]

const WORK_ENVS = [
  { value: 'office', label: 'مكتب وتكنولوجيا', icon: '💻', desc: 'عمل تقني في بيئة منظمة' },
  { value: 'field',  label: 'ميدان وحركة',     icon: '🏗️', desc: 'مواقع وعمل ميداني متنقل' },
  { value: 'people', label: 'مع الناس',         icon: '👥', desc: 'تواصل وخدمة الآخرين' },
  { value: 'lab',    label: 'بحث ومختبر',      icon: '🔬', desc: 'تجارب علمية وأبحاث' },
]

const PRIORITIES = [
  'الراتب المرتفع', 'الاستقرار الوظيفي', 'التأثير في المجتمع',
  'الإبداع والابتكار', 'السفر والتنقل', 'العمل الحر',
]

const BAC_SERIES = [
  { value: 'sciences-exp',  label: 'علوم تجريبية' },
  { value: 'math',          label: 'رياضيات' },
  { value: 'tech-math',     label: 'تقني رياضي' },
  { value: 'letters-philo', label: 'آداب وفلسفة' },
  { value: 'languages',     label: 'لغات أجنبية' },
  { value: 'gestion-eco',   label: 'تسيير واقتصاد' },
]

const ALL_WILAYAS = [
  'الجزائر','وهران','قسنطينة','عنابة','باتنة','سطيف','تيزي وزو','بجاية',
  'تلمسان','ورقلة','بسكرة','المدية','البليدة','سكيكدة','جيجل','بومرداس',
  'تبسة','برج بوعريريج','المسيلة','البويرة','خنشلة','سوق أهراس',
  'ميلة','غليزان','مستغانم','تيبازة','سيدي بلعباس','معسكر',
]

const ANALYZE_MSGS = [
  'جارٍ تحليل ملفك الشخصي...',
  'مقارنة التخصصات المتاحة...',
  'تقييم مدى التوافق...',
  'إعداد توصياتك الشخصية...',
]

export function AssessmentContent({ profile, canRetake = true, hoursLeft = 0, attemptsLeft = 2, attemptsUsed = 0 }: AssessmentContentProps) {
  const router = useRouter()
  const [step, setStep]             = useState(1)
  const [loading, setLoading]       = useState(false)
  const [analyzing, setAnalyzing]   = useState(false)
  const [analyzeMsg, setAnalyzeMsg] = useState(0)
  const [stepError, setStepError]   = useState('')

  // Step 1
  const [selectedInterests, setSelectedInterests] = useState<string[]>([])
  // Step 2
  const [strengths, setStrengths] = useState<Record<string, number>>({})
  // Step 3
  const [workEnv, setWorkEnv] = useState('')
  // Step 4
  const [rankedPriorities, setRankedPriorities] = useState([...PRIORITIES])
  // Step 5
  const [bacSeries, setBacSeries] = useState(profile.bacSeries || '')
  const [bacGrade, setBacGrade]   = useState(profile.bacScore ? parseFloat(profile.bacScore) : 14)
  const [selectedWilayas, setSelectedWilayas] = useState<string[]>([])

  const toggleInterest = (v: string) => {
    setStepError('')
    setSelectedInterests(prev =>
      prev.includes(v) ? prev.filter(x => x !== v) : [...prev, v]
    )
  }
  const setStrength = (key: string, val: number) => setStrengths(prev => ({ ...prev, [key]: val }))

  const movePriority = (i: number, dir: -1 | 1) => {
    const arr = [...rankedPriorities]
    const j = i + dir
    if (j < 0 || j >= arr.length) return
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
    setRankedPriorities(arr)
  }

  const toggleWilaya = (w: string) => setSelectedWilayas(prev =>
    prev.includes(w) ? prev.filter(x => x !== w) : [...prev, w]
  )

  // ── Validation per step ──────────────────────────────────────────────────
  function validateStep(s: number): string {
    if (s === 1 && selectedInterests.length === 0)
      return 'يرجى اختيار مجال واهتمام واحد على الأقل قبل المتابعة.'
    if (s === 2) {
      const rated = Object.keys(strengths).length
      if (rated < 4)
        return `يرجى تقييم ${4 - rated} مهارة إضافية على الأقل (قيّمت ${rated}/8).`
    }
    if (s === 3 && !workEnv)
      return 'يرجى اختيار بيئة العمل المناسبة لك قبل المتابعة.'
    if (s === 5 && !bacSeries)
      return 'يرجى اختيار شعبة البكالوريا قبل الحصول على التوصيات.'
    if (s === 5 && (bacGrade < 0 || bacGrade > 20))
      return 'معدل البكالوريا يجب أن يكون بين 0 و 20.'
    return ''
  }

  function handleNext() {
    const err = validateStep(step)
    if (err) { setStepError(err); return }
    setStepError('')
    setStep(s => s + 1)
  }

  async function handleSubmit() {
    const err = validateStep(5)
    if (err) { setStepError(err); return }
    setStepError('')
    setLoading(true)
    setAnalyzing(true)

    // Rotate messages
    let msgIdx = 0
    const interval = setInterval(() => {
      msgIdx = (msgIdx + 1) % ANALYZE_MSGS.length
      setAnalyzeMsg(msgIdx)
    }, 1100)

    try {
      await saveFullAssessment({
        interests: selectedInterests,
        strengths,
        workEnv,
        priorities: rankedPriorities,
        bacSeries,
        bacGrade,
        wilayas: selectedWilayas,
      })
      await addXP(50)
      clearInterval(interval)
      router.push('/results')
      router.refresh()
    } catch (e) {
      clearInterval(interval)
      setLoading(false)
      setAnalyzing(false)
      setStepError('حدث خطأ أثناء حفظ البيانات. يرجى المحاولة مجدداً.')
    }
  }

  if (!canRetake) {
    return (
      <div className="min-h-screen bg-[#F4F6F9] flex items-center justify-center" dir="rtl">
        <div className="text-center px-6 max-w-md">
          <div className="w-20 h-20 rounded-full bg-[#D21034]/10 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-10 h-10 text-[#D21034]" />
          </div>
          <h2 className="text-xl font-bold text-[#0B2340] mb-2">لقد استنفذت محاولاتك اليومية</h2>
          {/* FIX: show 2-per-24h policy and exact hours remaining */}
          <p className="text-gray-500 mb-2">
            يُسمح بـ <span className="font-semibold text-[#0B2340]">اختبارين (2)</span> كل 24 ساعة للحصول على نتائج دقيقة.
          </p>
          <p className="text-gray-500 mb-2">
            لقد أجريت <span className="font-semibold text-[#D21034]">2 / 2</span> اختبارات خلال النافذة الحالية.
          </p>
          <p className="text-[#006233] font-semibold mb-6">
            ⏱ يمكنك إعادة الاختبار بعد: {hoursLeft} ساعة
          </p>
          <Link href="/results">
            <Button className="bg-[#006233] hover:bg-[#004d28] text-white">
              عرض نتائجي الحالية
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  if (analyzing) {
    return (
      <div className="min-h-screen bg-[#F4F6F9] flex items-center justify-center" dir="rtl">
        <div className="text-center px-4">
          <div className="relative w-28 h-28 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full bg-[#006233]/20 animate-ping" />
            <div className="relative w-28 h-28 rounded-full bg-[#006233] flex items-center justify-center shadow-lg">
              <Brain className="w-14 h-14 text-white" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-[#0B2340] mb-2">الذكاء الاصطناعي يعمل...</h2>
          <p className="text-[#006233] font-medium text-lg mb-6">{ANALYZE_MSGS[analyzeMsg]}</p>
          <div className="w-72 mx-auto space-y-2">
            <Progress value={((analyzeMsg + 1) / ANALYZE_MSGS.length) * 100} className="h-2.5" />
            <p className="text-xs text-gray-400">يتم تحليل {INTERESTS.length * 3}+ عامل تتعلق بملفك</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F4F6F9]" dir="rtl">
      {/* Header */}
      <header className="bg-white border-b border-[#E2E8F0] sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2">
            <MasarekLogo size={36} />
            <div>
              <span className="font-bold text-[#0B2340] text-lg" style={{ fontFamily: 'Noto Sans Arabic, sans-serif' }}>مساركَ</span>
              <span className="text-xs text-[#006233] block leading-none">Masarek.dz</span>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/dashboard">
              <button className="
                inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold
                border border-[#E2E8F0] text-gray-500
                hover:border-[#006233] hover:text-[#006233]
                transition-all duration-200
              ">
                <LayoutDashboard className="w-3.5 h-3.5" />
                لوحة التحكم
              </button>
            </Link>
            <Badge className="bg-[#006233]/10 text-[#006233] border-0">خطوة {step} من 5</Badge>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Progress */}
        <div className="flex gap-1 mb-2">
          {STEP_LABELS.map((l, i) => (
            <div key={l} className={`flex-1 h-1.5 rounded-full transition-colors ${i + 1 <= step ? 'bg-[#006233]' : 'bg-[#E2E8F0]'}`} />
          ))}
        </div>
        <div className="flex justify-between mb-6">
          {STEP_LABELS.map((l, i) => (
            <span key={l} className={`text-xs ${i + 1 === step ? 'text-[#006233] font-semibold' : 'text-gray-400'}`}>{l}</span>
          ))}
        </div>

        {/* Step error banner */}
        {stepError && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 mb-4 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {stepError}
          </div>
        )}

        {/* ── STEP 1: Interests ── */}
        {step === 1 && (
          <div>
            <h2 className="text-xl font-bold text-[#0B2340] mb-1">ما هي المجالات التي تثير اهتمامك؟</h2>
            <p className="text-gray-500 text-sm mb-1">اختر ما يناسبك <span className="text-[#006233] font-medium">(مجال واحد على الأقل)</span></p>
            <p className="text-xs text-gray-400 mb-5">يؤثر هذا مباشرة على دقة التوصيات</p>
            <div className="grid grid-cols-3 gap-3">
              {INTERESTS.map((it) => {
                const selected = selectedInterests.includes(it.value)
                return (
                  <button
                    key={it.value}
                    onClick={() => toggleInterest(it.value)}
                    className={`relative p-4 rounded-xl border-2 text-center transition-all ${
                      selected
                        ? 'border-[#006233] bg-[#006233]/5 shadow-sm'
                        : 'border-[#E2E8F0] bg-white hover:border-[#006233]/40'
                    }`}
                  >
                    {selected && <CheckCircle className="absolute top-2 left-2 w-4 h-4 text-[#006233]" />}
                    <div className="text-2xl mb-1">{it.emoji}</div>
                    <div className={`text-xs font-medium ${selected ? 'text-[#006233]' : 'text-[#0B2340]'}`}>{it.label}</div>
                  </button>
                )
              })}
            </div>
            {selectedInterests.length > 0 && (
              <p className="mt-3 text-xs text-[#006233] font-medium text-center">
                ✓ اخترت {selectedInterests.length} مجال
              </p>
            )}
          </div>
        )}

        {/* ── STEP 2: Strengths ── */}
        {step === 2 && (
          <div>
            <h2 className="text-xl font-bold text-[#0B2340] mb-1">قيّم قدراتك ومهاراتك</h2>
            <p className="text-gray-500 text-sm mb-1">أعطِ كل مهارة تقييمًا من 1 (ضعيف) إلى 5 (ممتاز)</p>
            <p className="text-xs text-[#D21034] mb-5">* يجب تقييم 4 مهارات على الأقل</p>
            <div className="space-y-4">
              {STRENGTHS.map((s) => {
                const val = strengths[s.key]
                const rated = val !== undefined
                return (
                  <div key={s.key} className={`rounded-xl border p-4 transition-colors ${rated ? 'bg-white border-[#006233]/30' : 'bg-white border-[#E2E8F0]'}`}>
                    <div className="flex justify-between items-center mb-3">
                      <span className={`font-medium text-sm ${rated ? 'text-[#0B2340]' : 'text-gray-500'}`}>{s.emoji} {s.label}</span>
                      <span className={`font-bold text-sm ${rated ? 'text-[#006233]' : 'text-gray-300'}`}>
                        {rated ? `${val}/5` : '—/5'}
                      </span>
                    </div>
                    <input
                      type="range" min={1} max={5} step={1}
                      value={val ?? 3}
                      onChange={e => { setStrength(s.key, +e.target.value); setStepError('') }}
                      onMouseDown={() => { if (!rated) setStrength(s.key, 3) }}
                      onTouchStart={() => { if (!rated) setStrength(s.key, 3) }}
                      className="w-full accent-[#006233]"
                    />
                    <div className="flex justify-between text-xs text-gray-400 mt-1">
                      <span>ضعيف (1)</span><span>متوسط (3)</span><span>ممتاز (5)</span>
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="mt-3 flex justify-center gap-2">
              {STRENGTHS.map(s => (
                <div key={s.key} className={`w-2 h-2 rounded-full ${strengths[s.key] !== undefined ? 'bg-[#006233]' : 'bg-[#E2E8F0]'}`} />
              ))}
            </div>
            <p className="text-center text-xs text-gray-400 mt-1">
              {Object.keys(strengths).length}/8 مهارات مُقيَّمة
            </p>
          </div>
        )}

        {/* ── STEP 3: Work Environment ── */}
        {step === 3 && (
          <div>
            <h2 className="text-xl font-bold text-[#0B2340] mb-1">ما هي بيئة العمل المفضلة لديك؟</h2>
            <p className="text-gray-500 text-sm mb-5">اختر بيئة <span className="text-[#006233] font-medium">واحدة</span> تناسبك أكثر</p>
            <div className="grid grid-cols-2 gap-4">
              {WORK_ENVS.map((env) => (
                <button
                  key={env.value}
                  onClick={() => { setWorkEnv(env.value); setStepError('') }}
                  className={`p-5 rounded-xl border-2 text-center transition-all ${
                    workEnv === env.value
                      ? 'border-[#006233] bg-[#006233]/5 shadow-sm'
                      : 'border-[#E2E8F0] bg-white hover:border-[#006233]/40'
                  }`}
                >
                  <div className="text-4xl mb-3">{env.icon}</div>
                  <div className={`font-bold text-sm mb-1 ${workEnv === env.value ? 'text-[#006233]' : 'text-[#0B2340]'}`}>{env.label}</div>
                  <div className="text-xs text-gray-400">{env.desc}</div>
                  {workEnv === env.value && (
                    <CheckCircle className="w-4 h-4 text-[#006233] mx-auto mt-2" />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── STEP 4: Career Priorities ── */}
        {step === 4 && (
          <div>
            <h2 className="text-xl font-bold text-[#0B2340] mb-1">رتّب أولوياتك المهنية</h2>
            <p className="text-gray-500 text-sm mb-5">
              رتّب العناصر من <span className="text-[#006233] font-medium">الأهم (1)</span> إلى الأقل أهمية (6) باستخدام الأسهم
            </p>
            <div className="space-y-2">
              {rankedPriorities.map((p, i) => (
                <div key={p} className={`flex items-center gap-3 rounded-xl px-4 py-3 border transition-colors ${
                  i === 0 ? 'bg-[#006233]/5 border-[#006233]/30' : 'bg-white border-[#E2E8F0]'
                }`}>
                  <span className={`w-7 h-7 rounded-full text-white text-xs font-bold flex items-center justify-center shrink-0 ${
                    i === 0 ? 'bg-[#006233]' : i === 1 ? 'bg-[#C8A84B]' : 'bg-[#0B2340]/60'
                  }`}>{i + 1}</span>
                  <span className="flex-1 font-medium text-[#0B2340] text-sm">{p}</span>
                  {i === 0 && <span className="text-xs text-[#006233] font-medium">الأهم</span>}
                  <div className="flex gap-1">
                    <button onClick={() => movePriority(i, -1)} disabled={i === 0}
                      className="w-7 h-7 rounded-lg border border-[#E2E8F0] flex items-center justify-center disabled:opacity-30 hover:bg-[#F4F6F9]">
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => movePriority(i, 1)} disabled={i === rankedPriorities.length - 1}
                      className="w-7 h-7 rounded-lg border border-[#E2E8F0] flex items-center justify-center disabled:opacity-30 hover:bg-[#F4F6F9]">
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── STEP 5: Academic Info ── */}
        {step === 5 && (
          <div>
            <h2 className="text-xl font-bold text-[#0B2340] mb-1">المعلومات الأكاديمية</h2>
            <p className="text-gray-500 text-sm mb-5">
              {profile.bacSeries
                ? 'مُعبَّأة تلقائيًا من ملفك — يمكنك تعديلها إذا تغيرت'
                : 'أدخل معلوماتك الأكاديمية لإتمام الاختبار'}
            </p>
            <div className="space-y-5">
              {/* Bac Series */}
              <div>
                <label className="text-sm font-semibold text-[#0B2340] block mb-2">
                  شعبة البكالوريا <span className="text-[#D21034]">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {BAC_SERIES.map(s => (
                    <button key={s.value} onClick={() => { setBacSeries(s.value); setStepError('') }}
                      className={`px-3 py-2.5 rounded-lg border text-xs font-medium transition-colors ${
                        bacSeries === s.value
                          ? 'bg-[#006233] text-white border-[#006233] shadow-sm'
                          : 'border-[#E2E8F0] text-[#0B2340] hover:border-[#006233] bg-white'
                      }`}>
                      {s.label}
                    </button>
                  ))}
                </div>
                {!bacSeries && (
                  <p className="text-xs text-gray-400 mt-1.5">⬆ اختر شعبتك</p>
                )}
              </div>

              {/* Bac Grade */}
              <div className="bg-white border border-[#E2E8F0] rounded-xl p-4">
                <div className="flex justify-between items-center mb-1">
                  <label className="text-sm font-semibold text-[#0B2340]">
                    معدل البكالوريا <span className="text-[#D21034]">*</span>
                  </label>
                  <span className="text-[#006233] font-bold text-xl">{bacGrade.toFixed(2)}<span className="text-sm font-normal text-gray-400">/20</span></span>
                </div>
                {profile.bacScore && (
                  <p className="text-xs text-gray-400 mb-3">
                    المُدخَل عند التسجيل: <span className="text-[#006233] font-semibold">{profile.bacScore}/20</span> — يمكنك تعديله
                  </p>
                )}
                <input
                  type="range" min={0} max={20} step={0.25} value={bacGrade}
                  onChange={e => { setBacGrade(+e.target.value); setStepError('') }}
                  className="w-full accent-[#006233]"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>0 — راسب</span><span>10 — مقبول</span><span>20 — ممتاز</span>
                </div>
                <div className="mt-3 flex gap-1.5 flex-wrap">
                  {[10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20].map(v => (
                    <button key={v} onClick={() => setBacGrade(v)}
                      className={`text-xs px-2 py-1 rounded border transition-colors ${
                        Math.abs(bacGrade - v) < 0.5
                          ? 'bg-[#006233] text-white border-[#006233]'
                          : 'border-[#E2E8F0] text-gray-500 hover:border-[#006233]'
                      }`}>{v}</button>
                  ))}
                </div>
              </div>

              {/* Wilayas */}
              <div>
                <label className="text-sm font-semibold text-[#0B2340] block mb-2">الولايات المفضلة للدراسة <span className="text-gray-400 font-normal text-xs">(اختياري)</span></label>
                <div className="flex flex-wrap gap-2">
                  {ALL_WILAYAS.map(w => (
                    <button key={w} onClick={() => toggleWilaya(w)}
                      className={`px-3 py-1.5 rounded-full text-xs border transition-colors ${
                        selectedWilayas.includes(w)
                          ? 'bg-[#006233] text-white border-[#006233]'
                          : 'border-[#E2E8F0] text-[#0B2340] hover:border-[#006233] bg-white'
                      }`}>
                      {w}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between mt-8">
          <Button
            onClick={() => { setStep(s => s - 1); setStepError('') }}
            disabled={step === 1}
            variant="outline"
            className="gap-2 border-[#E2E8F0]"
          >
            <ChevronRight className="w-4 h-4" /> السابق
          </Button>

          {step < 5 ? (
            <Button onClick={handleNext} className="gap-2 bg-[#006233] hover:bg-[#004d28] text-white">
              التالي <ChevronLeft className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={loading}
              className="gap-2 bg-[#006233] hover:bg-[#004d28] text-white px-6"
            >
              {loading
                ? <><Loader2 className="w-4 h-4 animate-spin" /> جارٍ التحليل...</>
                : <><Brain className="w-4 h-4" /> الحصول على التوصيات</>
              }
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
