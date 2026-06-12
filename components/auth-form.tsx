'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { signIn, signUp } from '@/lib/auth-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Eye, EyeOff, Loader2, CheckCircle, BookOpen, MapPin, ArrowRight } from 'lucide-react'

interface AuthFormProps { mode: 'sign-in' | 'sign-up' }

const WILAYAS = [
  'أدرار','الشلف','الأغواط','أم البواقي','باتنة','بجاية','بسكرة','بشار','البليدة','البويرة',
  'تمنراست','تبسة','تلمسان','تيارت','تيزي وزو','الجزائر','الجلفة','جيجل','سطيف','سعيدة',
  'سكيكدة','سيدي بلعباس','عنابة','قالمة','قسنطينة','المدية','مستغانم','المسيلة','معسكر','ورقلة',
  'وهران','البيض','إليزي','برج بوعريريج','بومرداس','الطارف','تندوف','تيسمسيلت','الوادي','خنشلة',
  'سوق أهراس','تيبازة','ميلة','عين الدفلى','النعامة','عين تيموشنت','غرداية','غليزان',
]

const BAC_SERIES = [
  { value: 'sciences-exp',  label: 'علوم تجريبية' },
  { value: 'math',          label: 'رياضيات' },
  { value: 'tech-math',     label: 'تقني رياضي' },
  { value: 'letters-philo', label: 'آداب وفلسفة' },
  { value: 'languages',     label: 'لغات أجنبية' },
  { value: 'gestion-eco',   label: 'تسيير واقتصاد' },
]

const CURRENT_YEAR = new Date().getFullYear()

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

function LeftPanel() {
  return (
    <div className="hidden md:flex flex-col w-[40%] min-h-screen bg-[#0B2340] relative overflow-hidden">
      <div className="absolute inset-0 opacity-5">
        <svg viewBox="0 0 400 600" className="w-full h-full">
          <circle cx="200" cy="150" r="200" fill="#006233"/>
          <circle cx="50"  cy="500" r="150" fill="#D21034"/>
        </svg>
      </div>

      {/* Back to home — top left */}
      <div className="relative pt-6 px-8">
        <Link href="/" className="inline-flex items-center gap-2 text-white/60 hover:text-white text-sm transition-colors">
          <ArrowRight className="w-4 h-4" />
          العودة للرئيسية
        </Link>
      </div>

      <div className="relative flex flex-col flex-1 items-center justify-center px-10 py-8 text-white">
        {/* Logo */}
        <div className="mb-8 text-center">
          <Link href="/" className="inline-block">
            <MasarekLogo size={56} />
          </Link>
          <div className="text-3xl font-bold mb-1 mt-3" style={{ fontFamily: 'Noto Sans Arabic, sans-serif' }}>مساركَ</div>
          <div className="text-[#C8A84B] text-sm">Masarek.dz</div>
        </div>

        <p className="text-2xl font-bold text-center mb-10 leading-relaxed" style={{ fontFamily: 'Noto Sans Arabic, sans-serif' }}>
          اختر مسارك،<br />ابنِ مستقبلك
        </p>

        <div className="space-y-4 w-full max-w-xs">
          {[
            { icon: BookOpen, text: 'أكثر من 300 تخصص جامعـي جزائري' },
            { icon: MapPin,   text: 'ابحث عن أقرب جامعة في ولايتك' },
            { icon: CheckCircle, text: 'توصيات مجانية بالذكاء الاصطناعي' },
          ].map((b) => (
            <div key={b.text} className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                <b.icon className="w-4 h-4 text-[#C8A84B]" />
              </div>
              <span className="text-white/80 text-sm">{b.text}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex h-3 w-full">
        <div className="flex-1 bg-[#006233]" />
        <div className="flex-1 bg-white" />
        <div className="flex-1 bg-[#D21034]" />
      </div>
    </div>
  )
}

// ── Validation helpers ────────────────────────────────────────────────────

function validateEmail(email: string): string {
  if (!email) return 'البريد الإلكتروني مطلوب'
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!re.test(email)) return 'البريد الإلكتروني غير صالح'
  return ''
}

function validatePassword(password: string): string {
  if (!password) return 'كلمة المرور مطلوبة'
  if (password.length < 8) return 'كلمة المرور يجب أن تكون 8 أحرف على الأقل'
  return ''
}

function validateBacGrade(grade: string): string {
  const n = parseFloat(grade)
  if (!grade) return 'المعدل مطلوب'
  if (isNaN(n) || n < 0 || n > 20) return 'المعدل يجب أن يكون بين 0 و 20'
  return ''
}

function validateBacYear(year: string): string {
  const n = parseInt(year)
  if (!year) return 'سنة الحصول مطلوبة'
  if (isNaN(n) || n < 2000 || n > CURRENT_YEAR) return `السنة يجب أن تكون بين 2000 و ${CURRENT_YEAR}`
  return ''
}

// ── Component ─────────────────────────────────────────────────────────────

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter()
  const isSignUp = mode === 'sign-up'
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [emailSent, setEmailSent] = useState(false)
  const [registeredEmail, setRegisteredEmail] = useState('')

  // Form fields
  const [name, setName]           = useState('')
  const [wilaya, setWilaya]       = useState('')
  const [bacSeries, setBacSeries] = useState('')
  const [bacGrade, setBacGrade]   = useState('')
  const [bacYear, setBacYear]     = useState('')
  const [email, setEmail]         = useState('')
  const [password, setPassword]   = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const totalSteps = isSignUp ? 3 : 1
  const stepLabels = ['المعلومات الشخصية', 'المعلومات الأكاديمية', 'إنشاء الحساب']

  function setFieldError(field: string, msg: string) {
    setFieldErrors(prev => ({ ...prev, [field]: msg }))
  }

  function clearFieldError(field: string) {
    setFieldErrors(prev => ({ ...prev, [field]: '' }))
  }

  function validateStep1(): boolean {
    const errors: Record<string, string> = {}
    if (!name.trim() || name.trim().length < 3) errors.name = 'الاسم يجب أن يكون 3 أحرف على الأقل'
    if (!wilaya) errors.wilaya = 'يرجى اختيار الولاية'
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  function validateStep2(): boolean {
    const errors: Record<string, string> = {}
    if (!bacSeries) errors.bacSeries = 'يرجى اختيار شعبة البكالوريا'
    const gradeErr = validateBacGrade(bacGrade)
    if (gradeErr) errors.bacGrade = gradeErr
    const yearErr = validateBacYear(bacYear)
    if (yearErr) errors.bacYear = yearErr
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  function validateStep3(): boolean {
    const errors: Record<string, string> = {}
    const emailErr = validateEmail(email)
    if (emailErr) errors.email = emailErr
    const pwErr = validatePassword(password)
    if (pwErr) errors.password = pwErr
    if (!confirmPassword) errors.confirmPassword = 'يرجى تأكيد كلمة المرور'
    else if (password !== confirmPassword) errors.confirmPassword = 'كلمة المرور غير متطابقة'
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  function handleStep1Next() {
    if (validateStep1()) setStep(2)
  }

  function handleStep2Next() {
    if (validateStep2()) setStep(3)
  }

  async function handleSubmit() {
    setError('')
    if (isSignUp && !validateStep3()) return

    // sign-in validation
    if (!isSignUp) {
      const errors: Record<string, string> = {}
      const emailErr = validateEmail(email)
      if (emailErr) errors.email = emailErr
      if (!password) errors.password = 'كلمة المرور مطلوبة'
      setFieldErrors(errors)
      if (Object.keys(errors).length > 0) return
    }

    setLoading(true)
    try {
      if (isSignUp) {
        // ── Block known disposable/fake email domains only ──
        const emailDomain = email.split('@')[1]?.toLowerCase() ?? ''
        const disposableDomains = [
          'mailinator.com','guerrillamail.com','tempmail.com','throwaway.email',
          'yopmail.com','sharklasers.com','10minutemail.com','trashmail.com',
          'maildrop.cc','dispostable.com','fakeinbox.com','spamgourmet.com',
          'getairmail.com','trashmail.at','trashmail.io','getnada.com',
          'temp-mail.org','tempinbox.com','emailondeck.com','spamfree24.org',
        ]
        if (disposableDomains.includes(emailDomain)) {
          setFieldError('email', 'لا يمكن استخدام البريد الإلكتروني المؤقت')
          setLoading(false)
          return
        }

        // ── Basic domain structure check (must have a real TLD) ──
        const domainParts = emailDomain.split('.')
        const tld = domainParts[domainParts.length - 1]
        const domainName = domainParts[domainParts.length - 2] ?? ''
        if (domainParts.length < 2 || tld.length < 2 || domainName.length < 2) {
          setFieldError('email', 'البريد الإلكتروني غير صالح')
          setLoading(false)
          return
        }

        // Pass all profile data (wilaya, bacSeries, bacGrade) along with auth data
        const result = await signUp({
          email,
          password,
          name,
          wilaya,
          bacSeries,
          bacGrade: bacGrade ? parseFloat(bacGrade) : undefined,
        })
        if (result.error) {
          const msg = (result.error.message || '') as string
          if (msg.includes('مستخدم') || msg.includes('already') || result.error.status === 409) {
            setFieldError('email', 'هذا البريد الإلكتروني مسجل بالفعل')
          } else if (msg.includes('لا يمكن إرسال') || msg.includes('فشل إرسال')) {
            setFieldError('email', msg)
          } else {
            setError(msg || 'حدث خطأ أثناء إنشاء الحساب')
          }
          setLoading(false)
          return
        }
        // Sign-up success → show "check your email" screen
        setRegisteredEmail(email)
        setEmailSent(true)
        setLoading(false)
        return
      } else {
        const result = await signIn('credentials', { email, password, redirect: false })
        if (result?.error) {
          setError('البريد الإلكتروني أو كلمة المرور غير صحيحة، أو لم يتم تأكيد البريد الإلكتروني بعد')
          setLoading(false)
          return
        }
      }
      router.push('/dashboard')
      router.refresh()
    } catch {
      setError('حدث خطأ غير متوقع')
      setLoading(false)
    }
  }

  const FieldError = ({ field }: { field: string }) =>
    fieldErrors[field] ? (
      <p className="text-red-500 text-xs mt-1">{fieldErrors[field]}</p>
    ) : null

  // ── Email confirmation sent screen ────────────────────────────────────────
  if (emailSent) {
    return (
      <div className="min-h-screen bg-[#F4F6F9] flex items-center justify-center px-4" dir="rtl">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-[#E2E8F0] overflow-hidden">
          <div className="flex h-1.5">
            <div className="flex-1 bg-[#006233]" />
            <div className="flex-1 bg-white border-t border-[#E2E8F0]" />
            <div className="flex-1 bg-[#D21034]" />
          </div>
          <div className="p-8 text-center">
            <div className="flex items-center justify-center gap-2 mb-8">
              <MasarekLogo size={36} />
              <div>
                <span className="font-bold text-[#0B2340] text-lg">مساركَ</span>
                <span className="text-xs text-[#006233] block leading-none">Masarek.dz</span>
              </div>
            </div>
            <div className="w-20 h-20 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-[#0B2340] mb-2">تحقق من بريدك الإلكتروني 📬</h2>
            <p className="text-gray-500 text-sm mb-2">
              أرسلنا رابط التأكيد إلى
            </p>
            <p className="text-[#006233] font-semibold text-sm mb-4 bg-[#006233]/5 rounded-lg py-2 px-4 inline-block">
              {registeredEmail}
            </p>
            <p className="text-gray-400 text-xs mb-6">
              افتح بريدك الإلكتروني وانقر على زر التأكيد. الرابط صالح لمدة 24 ساعة.
              <br />تحقق من مجلد <strong>الرسائل غير المرغوب فيها (Spam)</strong> إذا لم تجد الرسالة.
            </p>
            <a href="/sign-in" className="text-[#006233] text-sm font-medium hover:underline">
              العودة لتسجيل الدخول
            </a>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen" dir="rtl">
      <LeftPanel />

      {/* RIGHT PANEL */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-10 bg-white">
        <div className="w-full max-w-md">

          {/* Mobile: logo + back to home */}
          <div className="md:hidden mb-6">
            <Link href="/" className="inline-flex items-center gap-1.5 text-gray-400 hover:text-[#006233] text-sm transition-colors mb-4">
              <ArrowRight className="w-4 h-4" />
              العودة للرئيسية
            </Link>
            <div className="flex items-center gap-2 justify-center">
              <MasarekLogo size={36} />
              <span className="text-xl font-bold text-[#0B2340]">مساركَ</span>
            </div>
          </div>

          <h1 className="text-2xl font-bold text-[#0B2340] mb-1">
            {isSignUp ? 'إنشاء حساب جديد' : 'تسجيل الدخول'}
          </h1>
          <p className="text-gray-500 text-sm mb-6">
            {isSignUp ? 'انضم إلى آلاف الطلاب الجزائريين' : 'أهلاً بعودتك إلى مساركَ'}
          </p>

          {/* Step indicator */}
          {isSignUp && (
            <div className="mb-8">
              <div className="flex justify-between mb-2">
                {stepLabels.map((l, i) => (
                  <span key={l} className={`text-xs ${i + 1 <= step ? 'text-[#006233] font-medium' : 'text-gray-400'}`}>{l}</span>
                ))}
              </div>
              <Progress value={(step / totalSteps) * 100} className="h-2" />
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-4">
              {error}
            </div>
          )}

          {/* ── SIGN IN ── */}
          {!isSignUp && (
            <div className="space-y-4">
              <div>
                <Label className="text-[#0B2340] text-sm font-medium mb-1.5 block">البريد الإلكتروني</Label>
                <Input
                  type="email"
                  placeholder="example@email.com"
                  value={email}
                  onChange={e => { setEmail(e.target.value); clearFieldError('email') }}
                  dir="ltr"
                  className={`border-[#E2E8F0] ${fieldErrors.email ? 'border-red-400' : ''}`}
                />
                <FieldError field="email" />
              </div>
              <div>
                <div className="flex justify-between mb-1.5">
                  <Label className="text-[#0B2340] text-sm font-medium">كلمة المرور</Label>
                  <Link href="/forgot-password" className="text-xs text-[#006233] hover:underline">نسيت كلمة المرور؟</Link>
                </div>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={e => { setPassword(e.target.value); clearFieldError('password') }}
                    dir="ltr"
                    className={`border-[#E2E8F0] pl-10 ${fieldErrors.password ? 'border-red-400' : ''}`}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <FieldError field="password" />
              </div>
              <Button onClick={handleSubmit} disabled={loading} className="w-full h-11 bg-[#006233] hover:bg-[#004d28] text-white font-semibold">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'تسجيل الدخول'}
              </Button>
              {/* Google sign-in removed */}
              <p className="text-center text-sm text-gray-500">
                ليس لديك حساب؟{' '}
                <Link href="/sign-up" className="text-[#006233] font-medium hover:underline">إنشاء حساب</Link>
              </p>
            </div>
          )}

          {/* ── SIGN UP Step 1: Personal Info ── */}
          {isSignUp && step === 1 && (
            <div className="space-y-4">
              <div>
                <Label className="text-[#0B2340] text-sm font-medium mb-1.5 block">الاسم الكامل (بالعربية)</Label>
                <Input
                  placeholder="أحمد بن محمد"
                  value={name}
                  onChange={e => { setName(e.target.value); clearFieldError('name') }}
                  className={`border-[#E2E8F0] ${fieldErrors.name ? 'border-red-400' : ''}`}
                />
                <FieldError field="name" />
              </div>
              <div>
                <Label className="text-[#0B2340] text-sm font-medium mb-1.5 block">الولاية</Label>
                <select
                  value={wilaya}
                  onChange={e => { setWilaya(e.target.value); clearFieldError('wilaya') }}
                  className={`w-full h-10 px-3 rounded-lg border text-sm bg-white text-[#0B2340] focus:outline-none focus:ring-2 focus:ring-[#006233] ${fieldErrors.wilaya ? 'border-red-400' : 'border-[#E2E8F0]'}`}
                >
                  <option value="">اختر الولاية</option>
                  {WILAYAS.map(w => <option key={w} value={w}>{w}</option>)}
                </select>
                <FieldError field="wilaya" />
              </div>
              <Button onClick={handleStep1Next} className="w-full h-11 bg-[#006233] hover:bg-[#004d28] text-white font-semibold">
                التالي
              </Button>
              <p className="text-center text-sm text-gray-500">
                لديك حساب؟{' '}
                <Link href="/sign-in" className="text-[#006233] font-medium hover:underline">تسجيل الدخول</Link>
              </p>
            </div>
          )}

          {/* ── SIGN UP Step 2: Academic Info ── */}
          {isSignUp && step === 2 && (
            <div className="space-y-4">
              <div>
                <Label className="text-[#0B2340] text-sm font-medium mb-1.5 block">شعبة البكالوريا</Label>
                <div className="grid grid-cols-2 gap-2">
                  {BAC_SERIES.map(s => (
                    <button
                      key={s.value}
                      onClick={() => { setBacSeries(s.value); clearFieldError('bacSeries') }}
                      className={`px-3 py-2.5 rounded-lg border text-sm font-medium transition-colors ${bacSeries === s.value ? 'bg-[#006233] text-white border-[#006233]' : 'border-[#E2E8F0] text-[#0B2340] hover:border-[#006233]'}`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
                <FieldError field="bacSeries" />
              </div>
              <div>
                <Label className="text-[#0B2340] text-sm font-medium mb-1.5 block">معدل البكالوريا (0 — 20)</Label>
                <Input
                  type="number"
                  min="0"
                  max="20"
                  step="0.01"
                  placeholder="15.50"
                  value={bacGrade}
                  onChange={e => { setBacGrade(e.target.value); clearFieldError('bacGrade') }}
                  dir="ltr"
                  className={`border-[#E2E8F0] ${fieldErrors.bacGrade ? 'border-red-400' : ''}`}
                />
                <FieldError field="bacGrade" />
              </div>
              <div>
                <Label className="text-[#0B2340] text-sm font-medium mb-1.5 block">سنة الحصول على البكالوريا</Label>
                <Input
                  type="number"
                  min="2000"
                  max={CURRENT_YEAR}
                  placeholder="2024"
                  value={bacYear}
                  onChange={e => { setBacYear(e.target.value); clearFieldError('bacYear') }}
                  dir="ltr"
                  className={`border-[#E2E8F0] ${fieldErrors.bacYear ? 'border-red-400' : ''}`}
                />
                <FieldError field="bacYear" />
              </div>
              <div className="flex gap-3">
                <Button onClick={() => setStep(1)} variant="outline" className="flex-1 h-11 border-[#E2E8F0]">السابق</Button>
                <Button onClick={handleStep2Next} className="flex-1 h-11 bg-[#006233] hover:bg-[#004d28] text-white font-semibold">التالي</Button>
              </div>
            </div>
          )}

          {/* ── SIGN UP Step 3: Account ── */}
          {isSignUp && step === 3 && (
            <div className="space-y-4">
              <div>
                <Label className="text-[#0B2340] text-sm font-medium mb-1.5 block">البريد الإلكتروني</Label>
                <Input
                  type="email"
                  placeholder="example@email.com"
                  value={email}
                  onChange={e => { setEmail(e.target.value); clearFieldError('email') }}
                  dir="ltr"
                  className={`border-[#E2E8F0] ${fieldErrors.email ? 'border-red-400' : ''}`}
                />
                <FieldError field="email" />
              </div>
              <div>
                <Label className="text-[#0B2340] text-sm font-medium mb-1.5 block">كلمة المرور (8 أحرف على الأقل)</Label>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={e => { setPassword(e.target.value); clearFieldError('password') }}
                    dir="ltr"
                    className={`border-[#E2E8F0] pl-10 ${fieldErrors.password ? 'border-red-400' : ''}`}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <FieldError field="password" />
              </div>
              <div>
                <Label className="text-[#0B2340] text-sm font-medium mb-1.5 block">تأكيد كلمة المرور</Label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={e => { setConfirmPassword(e.target.value); clearFieldError('confirmPassword') }}
                  dir="ltr"
                  className={`border-[#E2E8F0] ${fieldErrors.confirmPassword ? 'border-red-400' : ''}`}
                />
                <FieldError field="confirmPassword" />
              </div>
              <div className="flex gap-3">
                <Button onClick={() => setStep(2)} variant="outline" className="flex-1 h-11 border-[#E2E8F0]">السابق</Button>
                <Button onClick={handleSubmit} disabled={loading} className="flex-1 h-11 bg-[#006233] hover:bg-[#004d28] text-white font-semibold">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'إنشاء الحساب'}
                </Button>
              </div>
              <p className="text-center text-sm text-gray-500">
                لديك حساب؟{' '}
                <Link href="/sign-in" className="text-[#006233] font-medium hover:underline">تسجيل الدخول</Link>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
