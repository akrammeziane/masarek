'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createOrUpdateProfile } from '@/app/actions/student'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { GraduationCap, ChevronLeft, Loader2, MapPin, BookOpen, Award } from 'lucide-react'

const bacSeries = [
  { value: 'sciences-exp', labelAr: 'علوم تجريبية', labelFr: 'Sciences Expérimentales' },
  { value: 'math', labelAr: 'رياضيات', labelFr: 'Mathématiques' },
  { value: 'tech-math', labelAr: 'تقني رياضي', labelFr: 'Technique Mathématiques' },
  { value: 'letters-philo', labelAr: 'آداب وفلسفة', labelFr: 'Lettres et Philosophie' },
  { value: 'languages', labelAr: 'لغات أجنبية', labelFr: 'Langues Étrangères' },
  { value: 'gestion-eco', labelAr: 'تسيير واقتصاد', labelFr: 'Gestion et Économie' },
]

const wilayas = [
  'أدرار', 'الشلف', 'الأغواط', 'أم البواقي', 'باتنة', 'بجاية', 'بسكرة', 'بشار',
  'البليدة', 'البويرة', 'تمنراست', 'تبسة', 'تلمسان', 'تيارت', 'تيزي وزو', 'الجزائر',
  'الجلفة', 'جيجل', 'سطيف', 'سعيدة', 'سكيكدة', 'سيدي بلعباس', 'عنابة', 'قالمة',
  'قسنطينة', 'المدية', 'مستغانم', 'المسيلة', 'معسكر', 'ورقلة', 'وهران', 'البيض',
  'إليزي', 'برج بوعريريج', 'بومرداس', 'الطارف', 'تندوف', 'تيسمسيلت', 'الوادي',
  'خنشلة', 'سوق أهراس', 'تيبازة', 'ميلة', 'عين الدفلى', 'النعامة', 'عين تيموشنت',
  'غرداية', 'غليزان', 'تيميمون', 'برج باجي مختار', 'أولاد جلال', 'بني عباس',
  'عين صالح', 'عين قزام', 'تقرت', 'جانت', 'المغير', 'المنيعة'
]

interface OnboardingFormProps {
  userName: string
}

export function OnboardingForm({ userName }: OnboardingFormProps) {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    bacSeries: '',
    bacScore: '',
    wilaya: '',
  })

  const handleSubmit = async () => {
    setLoading(true)
    try {
      await createOrUpdateProfile({
        bacSeries: formData.bacSeries,
        bacScore: formData.bacScore ? parseFloat(formData.bacScore) : undefined,
        wilaya: formData.wilaya,
      })
      router.push('/dashboard')
      router.refresh()
    } catch (error) {
      console.error('[v0] Onboarding error:', error)
      setLoading(false)
    }
  }

  const canProceed = () => {
    if (step === 1) return formData.bacSeries !== ''
    if (step === 2) return formData.wilaya !== ''
    return true
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 gradient-hero">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center">
              <GraduationCap className="w-8 h-8 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl">مرحبًا {userName}!</CardTitle>
          <CardDescription>
            أخبرنا عن نفسك لنقدم لك توصيات مخصصة
          </CardDescription>
        </CardHeader>

        <CardContent>
          {/* Progress */}
          <div className="flex items-center gap-2 mb-8">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`flex-1 h-2 rounded-full transition-colors ${
                  s <= step ? 'bg-primary' : 'bg-muted'
                }`}
              />
            ))}
          </div>

          {/* Step 1: Bac Series */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">شعبة البكالوريا</h3>
                  <p className="text-sm text-muted-foreground">اختر شعبتك في البكالوريا</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label>الشعبة</Label>
                <Select
                  value={formData.bacSeries}
                  onValueChange={(value) => setFormData({ ...formData, bacSeries: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر شعبتك" />
                  </SelectTrigger>
                  <SelectContent>
                    {bacSeries.map((series) => (
                      <SelectItem key={series.value} value={series.value}>
                        {series.labelAr}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={() => setStep(2)}
                disabled={!canProceed()}
                className="w-full gap-2"
              >
                <span>التالي</span>
                <ChevronLeft className="w-4 h-4" />
              </Button>
            </div>
          )}

          {/* Step 2: Location */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <h3 className="font-semibold">الولاية</h3>
                  <p className="text-sm text-muted-foreground">اختر ولايتك</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label>الولاية</Label>
                <Select
                  value={formData.wilaya}
                  onValueChange={(value) => setFormData({ ...formData, wilaya: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر ولايتك" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {wilayas.map((wilaya) => (
                      <SelectItem key={wilaya} value={wilaya}>
                        {wilaya}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                  السابق
                </Button>
                <Button
                  onClick={() => setStep(3)}
                  disabled={!canProceed()}
                  className="flex-1 gap-2"
                >
                  <span>التالي</span>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Score (Optional) */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
                  <Award className="w-5 h-5 text-success" />
                </div>
                <div>
                  <h3 className="font-semibold">معدل البكالوريا (اختياري)</h3>
                  <p className="text-sm text-muted-foreground">
                    أدخل معدلك للحصول على توصيات أدق
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="score">المعدل</Label>
                <Input
                  id="score"
                  type="number"
                  step="0.01"
                  min="0"
                  max="20"
                  placeholder="مثال: 15.50"
                  value={formData.bacScore}
                  onChange={(e) => setFormData({ ...formData, bacScore: e.target.value })}
                  dir="ltr"
                  className="text-left"
                />
                <p className="text-xs text-muted-foreground">
                  يمكنك تخطي هذه الخطوة إذا لم تحصل على نتائجك بعد
                </p>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(2)} className="flex-1">
                  السابق
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex-1 gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      جاري الحفظ...
                    </>
                  ) : (
                    <>
                      <span>ابدأ رحلتك</span>
                      <ChevronLeft className="w-4 h-4" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
