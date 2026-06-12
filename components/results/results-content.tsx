'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Brain, Target, Zap, Compass, ChevronLeft, ChevronDown, ChevronUp,
  BookOpen, Briefcase, Star, TrendingUp, LayoutDashboard, RefreshCw,
  CheckCircle, MapPin, Clock, ExternalLink,
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
  'sciences-exp':  'علوم تجريبية',
  'math':          'رياضيات',
  'tech-math':     'تقني رياضي',
  'letters-philo': 'آداب وفلسفة',
  'languages':     'لغات أجنبية',
  'gestion-eco':   'تسيير واقتصاد',
}

const INTERESTS_LABELS: Record<string, string> = {
  sciences: 'العلوم', tech: 'التكنولوجيا', medicine: 'الطب', arts: 'الفن',
  business: 'الأعمال', law: 'القانون', education: 'التعليم', sports: 'الرياضة',
  env: 'البيئة', languages: 'اللغات', politics: 'السياسة', engineering: 'الهندسة',
}

const WORK_ENV_LABELS: Record<string, string> = {
  office: 'مكتب وتكنولوجيا', field: 'ميدان وحركة', people: 'مع الناس', lab: 'بحث ومختبر',
}

interface Recommendation {
  id: number; matchScore: number; rank: number; specId: string
  nameAr: string; nameFr: string; fieldAr: string; domain: string
  etablissement?: string; code_etablissement?: string
  durationYears: number; minGrade: number | null; careerPaths: string[]
  descriptionAr: string; reasons: string[]; createdAt: Date
  admissionPriority?: number | null; studentScore?: number; margin?: number | null
}

interface Answers {
  interests: string[]; strengths: Record<string, number>
  workEnv: string; priorities: string[]
  bacSeries: string; bacGrade: number; wilayas: string[]
}

interface ResultsContentProps {
  profile: { bacSeries: string | null; bacScore: string | null }
  recommendations: Recommendation[]
  answers: Answers
  canRetake?: boolean
  hoursLeft?: number
  attemptsLeft?: number
  attemptsUsed?: number
}

function ScoreCircle({ score, size = 'lg', forceWhite = false }: { score: number; size?: 'sm' | 'lg'; forceWhite?: boolean }) {
  const color = forceWhite ? '#ffffff' : (score >= 75 ? '#006233' : score >= 55 ? '#C8A84B' : '#D21034')
  const trackColor = forceWhite ? 'rgba(255,255,255,0.25)' : '#E2E8F0'
  const dim = size === 'lg' ? 88 : 60
  const r = size === 'lg' ? 38 : 25
  const stroke = size === 'lg' ? 5 : 4
  const circ = 2 * Math.PI * r
  const dash = (score / 100) * circ
  return (
    <div className="relative flex items-center justify-center" style={{ width: dim, height: dim }}>
      <svg width={dim} height={dim} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={dim/2} cy={dim/2} r={r} fill="none" stroke={trackColor} strokeWidth={stroke} />
        <circle cx={dim/2} cy={dim/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" />
      </svg>
      <div className="absolute text-center">
        <div className="font-bold leading-none" style={{ fontSize: size === 'lg' ? 20 : 13, color }}>
          {Math.round(score)}%
        </div>
        {size === 'lg' && <div style={{ color: forceWhite ? 'rgba(255,255,255,0.7)' : '#9CA3AF' }} className="text-xs mt-0.5">توافق</div>}
      </div>
    </div>
  )
}

function RankBadge({ rank }: { rank: number }) {
  const styles: Record<number, string> = {
    1: 'bg-[#C8A84B] text-white',
    2: 'bg-gray-300 text-gray-700',
    3: 'bg-amber-600 text-white',
  }
  const icons = { 1: '🥇', 2: '🥈', 3: '🥉' }
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${styles[rank] ?? 'bg-[#0B2340]/10 text-[#0B2340]'}`}>
      {icons[rank as keyof typeof icons] ?? `#${rank}`}
      {rank <= 3 ? '' : ` رقم ${rank}`}
    </span>
  )
}

// ─── FIX: University catalogue that matches real domain keys (A, B, C...) ──────
// These are the most prominent Algerian universities per domain, based on
// the official MESRS Circulaire d'orientation 2025.
const UNIVERSITY_CATALOGUE = [
  {
    id: 'USTHB',
    nameAr: 'جامعة العلوم والتكنولوجيا هواري بومدين (USTHB)',
    wilaya: 'الجزائر',
    website: 'https://www.usthb.dz',
    // A=Sciences&Tech, B=Sciences Matière, C=Math&Info, D=SNV, E=Sciences Terre
    domains: ['A', 'B', 'C', 'D', 'E'],
  },
  {
    id: 'U001',
    nameAr: 'جامعة الجزائر 1 بن يوسف بن خدة',
    wilaya: 'الجزائر',
    website: 'https://www.univ-alger.dz',
    // P=Médecine, G=Droit, F=Économie, I=Sciences Humaines
    domains: ['P', 'G', 'F', 'I'],
  },
  {
    id: 'U002',
    nameAr: 'جامعة الجزائر 2 أبو القاسم سعد الله',
    wilaya: 'الجزائر',
    website: 'https://www.univ-alger2.dz',
    // I=Sciences Humaines, L=Lettres Arabes, M=Lettres, H=Langues
    domains: ['I', 'L', 'M', 'H'],
  },
  {
    id: 'ESI',
    nameAr: 'المدرسة الوطنية العليا للإعلام الآلي (ESI)',
    wilaya: 'الجزائر',
    website: 'https://www.esi.dz',
    domains: ['C', 'A'],
  },
  {
    id: 'ENP',
    nameAr: 'المدرسة الوطنية متعددة التقنيات (ENP)',
    wilaya: 'الجزائر',
    website: 'https://www.enp.edu.dz',
    domains: ['A', 'N'],
  },
  {
    id: 'U005_CST',
    nameAr: 'جامعة الإخوة منتوري قسنطينة 1',
    wilaya: 'قسنطينة',
    website: 'https://www.umc.edu.dz',
    domains: ['A', 'B', 'C', 'G', 'I', 'L'],
  },
  {
    id: 'U007_ORA',
    nameAr: 'جامعة وهران 1 أحمد بن بلة',
    wilaya: 'وهران',
    website: 'https://www.univ-oran1.dz',
    domains: ['P', 'A', 'F', 'I', 'L'],
  },
  {
    id: 'U008_ORA',
    nameAr: 'جامعة وهران 2 محمد بن أحمد',
    wilaya: 'وهران',
    website: 'https://www.univ-oran2.dz',
    domains: ['G', 'F', 'H', 'I'],
  },
  {
    id: 'U013_SET',
    nameAr: 'جامعة فرحات عباس سطيف 1',
    wilaya: 'سطيف',
    website: 'https://www.univ-setif.dz',
    domains: ['A', 'B', 'C', 'P', 'F'],
  },
  {
    id: 'U015_TLM',
    nameAr: 'جامعة أبي بكر بلقايد تلمسان',
    wilaya: 'تلمسان',
    website: 'https://www.univ-tlemcen.dz',
    domains: ['P', 'A', 'G', 'F', 'D'],
  },
  {
    id: 'U016_TIZ',
    nameAr: 'جامعة مولود معمري تيزي وزو',
    wilaya: 'تيزي وزو',
    website: 'https://www.ummto.dz',
    domains: ['A', 'P', 'F', 'H', 'L'],
  },
  {
    id: 'U018_ANN',
    nameAr: 'جامعة باجي مختار عنابة',
    wilaya: 'عنابة',
    website: 'https://www.univ-annaba.dz',
    domains: ['A', 'B', 'P', 'G', 'L'],
  },
  {
    id: 'U011_BAT',
    nameAr: 'جامعة الحاج لخضر باتنة 1',
    wilaya: 'باتنة',
    website: 'https://www.univ-batna.dz',
    domains: ['P', 'A', 'F', 'G'],
  },
  {
    id: 'U019_BLD',
    nameAr: 'جامعة سعد دحلب البليدة 1',
    wilaya: 'البليدة',
    website: 'https://www.univ-blida.dz',
    domains: ['P', 'A', 'C', 'D'],
  },
  {
    id: 'U009_BJA',
    nameAr: 'جامعة عبد الرحمن ميرة بجاية',
    wilaya: 'بجاية',
    website: 'https://www.univ-bejaia.dz',
    domains: ['A', 'B', 'F', 'H'],
  },
  {
    id: 'U026_ORG',
    nameAr: 'جامعة قاصدي مرباح ورقلة',
    wilaya: 'ورقلة',
    website: 'https://www.univ-ouargla.dz',
    domains: ['A', 'F', 'G', 'I'],
  },
  {
    id: 'U017_BSK',
    nameAr: 'جامعة محمد خيضر بسكرة',
    wilaya: 'بسكرة',
    website: 'https://www.univ-biskra.dz',
    domains: ['A', 'C', 'F', 'D'],
  },
]

// FIX: Domain key → Arabic label (matches the domain keys A, B, C... stored in recommendations)
const DOMAIN_AR: Record<string, string> = {
  A: 'العلوم والتكنولوجيا',
  B: 'علوم المادة',
  C: 'الرياضيات والإعلام الآلي',
  D: 'علوم الطبيعة والحياة',
  E: 'علوم الأرض',
  F: 'العلوم الاقتصادية والتسيير',
  G: 'الحقوق والعلوم السياسية',
  H: 'اللغات والترجمة',
  I: 'العلوم الإنسانية والاجتماعية',
  J: 'النشاطات البدنية والرياضية',
  K: 'الفنون',
  L: 'الآداب العربية',
  M: 'الآداب',
  N: 'العمارة والعمران',
  P: 'العلوم الطبية',
}

// FIX: Uses actual domain keys (A, B, C...) from recommendations — no more fake codes
function getMatchingUniversities(recs: Recommendation[]) {
  // Collect unique domain keys from the student's recommendations
  const recDomains = Array.from(new Set(recs.map(r => r.domain).filter(Boolean)))
  if (recDomains.length === 0) return []

  return UNIVERSITY_CATALOGUE
    .map(u => {
      const matched = u.domains.filter(d => recDomains.includes(d))
      return {
        ...u,
        matchCount: matched.length,
        // Show Arabic domain label for matched domains
        matchedLabels: matched.map(d => DOMAIN_AR[d] ?? d).slice(0, 2),
      }
    })
    .filter(u => u.matchCount > 0)
    .sort((a, b) => b.matchCount - a.matchCount)
    .slice(0, 6)
}

export function ResultsContent({ profile, recommendations, answers, canRetake = true, hoursLeft = 0, attemptsLeft = 2, attemptsUsed = 0 }: ResultsContentProps) {
  const [expandedId, setExpandedId] = useState<number | null>(
    recommendations.length > 0 ? recommendations[0].id : null,
  )

  const top = recommendations[0]
  const hasData = recommendations.length > 0

  const topInterests = answers.interests.slice(0, 4).map(i => INTERESTS_LABELS[i] ?? i)
  const topStrength = Object.entries(answers.strengths).sort((a, b) => b[1] - a[1])[0]
  const topPriority = answers.priorities[0]

  return (
    <div className="min-h-screen bg-[#F4F6F9]" dir="rtl">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-white/90 border-b border-[#E2E8F0] shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2">
            <MasarekLogo size={36} />
            <div>
              <span className="text-lg font-bold text-[#0B2340]" style={{ fontFamily: 'Noto Sans Arabic, sans-serif' }}>مساركَ</span>
              <span className="text-xs text-[#006233] block leading-none">Masarek.dz</span>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            {canRetake ? (
              <Link href="/assessment?reset=1">
                <button className="
                  inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold
                  border border-[#E2E8F0] text-gray-600
                  hover:border-[#006233] hover:text-[#006233]
                  transition-all duration-200
                ">
                  <RefreshCw className="w-3.5 h-3.5" />
                  إعادة الاختبار ({attemptsLeft} متبقي)
                </button>
              </Link>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border border-[#E2E8F0] text-gray-400 cursor-not-allowed opacity-60">
                <RefreshCw className="w-3.5 h-3.5" />
                متاح بعد {hoursLeft}س
              </span>
            )}
            <Link href="/dashboard">
              <button className="
                inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold
                border border-[#006233] text-[#006233]
                hover:bg-[#006233] hover:text-white
                transition-all duration-200
              ">
                <LayoutDashboard className="w-3.5 h-3.5" /> لوحة التحكم
              </button>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">

        {/* Page title */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-[#006233]/10 flex items-center justify-center mx-auto mb-3">
            <Target className="w-8 h-8 text-[#006233]" />
          </div>
          <h1 className="text-2xl font-bold text-[#0B2340] mb-1">نتائج تحليل الذكاء الاصطناعي</h1>
          <p className="text-gray-500 text-sm">بناءً على إجاباتك، حلّل الذكاء الاصطناعي ملفك وأعدّ توصياتك الشخصية</p>
        </div>

        {/* ── TOP MATCH BANNER ── */}
        {hasData && top && (
          <div className="rounded-2xl p-6 text-white mb-8 shadow-lg" style={{ background: 'linear-gradient(135deg, #006233 0%, #004d28 100%)' }}>
            <div className="flex flex-col md:flex-row md:items-center gap-5">
              <div className="flex flex-col items-center shrink-0">
                <ScoreCircle score={top.matchScore} size="lg" forceWhite={true} />
                <RankBadge rank={1} />
              </div>
              <div className="flex-1">
                <div className="text-xs text-white/60 mb-1">التخصص الأنسب لك</div>
                {/* FIX: nameAr now shows the specialty name, not the domain */}
                <h2 className="text-xl font-bold mb-0.5">{top.nameAr}</h2>
                <p className="text-white/70 text-sm mb-3">{top.nameFr}</p>
                <div className="flex flex-wrap gap-2 mb-3">
                  <span className="bg-white/15 text-white text-xs px-2.5 py-1 rounded-full">⏱ {top.durationYears} سنوات</span>
                  {top.minGrade != null && (
                    <span className="bg-white/15 text-white text-xs px-2.5 py-1 rounded-full">📊 الحد الأدنى: {top.minGrade}/20</span>
                  )}
                  {/* FIX: fieldAr is the domain label — shown separately and clearly */}
                  <span className="bg-white/15 text-white text-xs px-2.5 py-1 rounded-full">🎓 {top.fieldAr}</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {top.reasons.map(r => (
                    <span key={r} className="flex items-center gap-1 bg-white/10 text-white/90 text-xs px-2 py-0.5 rounded-full">
                      <CheckCircle className="w-3 h-3 text-[#C8A84B]" /> {r}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── YOUR PROFILE SUMMARY ── */}
        <div className="mb-8">
          <h2 className="text-lg font-bold text-[#0B2340] mb-4 flex items-center gap-2">
            <Brain className="w-5 h-5 text-[#006233]" /> ملخص ملفك الشخصي
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            <Card className="border-[#E2E8F0]">
              <CardContent className="p-5">
                <h3 className="text-sm font-semibold text-[#0B2340] mb-3 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-[#006233]" /> المعلومات الأكاديمية
                </h3>
                <div className="space-y-2.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">الشعبة</span>
                    <span className="font-medium text-[#0B2340]">
                      {BAC_SERIES_LABELS[answers.bacSeries] ?? answers.bacSeries ?? '—'}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">المعدل</span>
                    <span className="font-bold text-[#006233]">{answers.bacGrade?.toFixed(2) ?? '—'}/20</span>
                  </div>
                  <div>
                    <span className="text-gray-500 text-sm">بيئة العمل المفضلة</span>
                    <p className="font-medium text-[#0B2340] text-sm mt-0.5">
                      {WORK_ENV_LABELS[answers.workEnv] ?? answers.workEnv ?? '—'}
                    </p>
                  </div>
                  {answers.wilayas?.length > 0 && (
                    <div className="flex items-start gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-gray-400 mt-0.5 shrink-0" />
                      <span className="text-xs text-gray-500">{answers.wilayas.join('، ')}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="border-[#E2E8F0]">
              <CardContent className="p-5">
                <h3 className="text-sm font-semibold text-[#0B2340] mb-3 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-[#C8A84B]" /> الميول والقدرات
                </h3>
                <div className="space-y-3">
                  <div>
                    <span className="text-gray-500 text-xs">مجالات الاهتمام</span>
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {topInterests.length > 0
                        ? topInterests.map(i => (
                            <span key={i} className="bg-[#006233]/10 text-[#006233] text-xs px-2 py-0.5 rounded-full">{i}</span>
                          ))
                        : <span className="text-gray-400 text-xs">—</span>
                      }
                    </div>
                  </div>
                  {topStrength && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">أبرز نقطة قوة</span>
                      <span className="font-medium text-[#0B2340]">
                        {{
                          logic:'التحليل المنطقي', creativity:'الإبداع', comms:'التواصل',
                          leadership:'القيادة', math:'الرياضيات', writing:'الكتابة',
                          problem:'حل المشكلات', org:'التنظيم',
                        }[topStrength[0]] ?? topStrength[0]}
                        <span className="text-[#006233] font-bold mr-1">({topStrength[1]}/5)</span>
                      </span>
                    </div>
                  )}
                  {topPriority && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">الأولوية المهنية</span>
                      <span className="font-medium text-[#0B2340]">{topPriority}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* ── STRENGTHS BARS ── */}
        {Object.keys(answers.strengths).length > 0 && (
          <Card className="border-[#E2E8F0] mb-8">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#006233]" /> تفصيل القدرات
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                {Object.entries(answers.strengths).map(([key, val]) => {
                  const labels: Record<string, string> = {
                    logic:'التحليل المنطقي', creativity:'الإبداع', comms:'التواصل',
                    leadership:'القيادة', math:'الرياضيات', writing:'الكتابة',
                    problem:'حل المشكلات', org:'التنظيم',
                  }
                  return (
                    <div key={key}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">{labels[key] ?? key}</span>
                        <span className="font-semibold text-[#006233]">{val}/5</span>
                      </div>
                      <Progress value={(val / 5) * 100} className="h-1.5" />
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── RECOMMENDATIONS LIST ── */}
        <div className="mb-4">
          <h2 className="text-lg font-bold text-[#0B2340] mb-1">
            التخصصات الموصى بها ({recommendations.length})
          </h2>
          <p className="text-gray-500 text-sm mb-5">مرتبة حسب نسبة توافقها مع ملفك الشخصي</p>
        </div>

        {!hasData && (
          <Card className="border-[#E2E8F0] mb-8">
            <CardContent className="py-12 text-center">
              <Brain className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">لم يتم العثور على توصيات. أعد الاختبار.</p>
              {canRetake ? (
                <Link href="/assessment?reset=1" className="mt-4 inline-block">
                  <Button className="gap-2 bg-[#006233] hover:bg-[#004d28] text-white">
                    <RefreshCw className="w-4 h-4" /> إعادة الاختبار ({attemptsLeft} متبقي)
                  </Button>
                </Link>
              ) : (
                <p className="mt-4 text-sm text-gray-400">يمكنك إعادة الاختبار بعد {hoursLeft} ساعة</p>
              )}
            </CardContent>
          </Card>
        )}

        <div className="space-y-4 mb-10">
          {recommendations.map((rec, index) => {
            const isExpanded = expandedId === rec.id
            return (
              <Card
                key={rec.id}
                className={`border transition-all ${isExpanded ? 'border-[#006233]/40 shadow-md' : 'border-[#E2E8F0] hover:border-[#006233]/25'}`}
              >
                <button
                  className="w-full text-right"
                  onClick={() => setExpandedId(isExpanded ? null : rec.id)}
                >
                  <CardContent className="p-5">
                    <div className="flex items-center gap-4">
                      <ScoreCircle score={rec.matchScore} size="sm" />
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <RankBadge rank={rec.rank} />
                          {/* FIX: fieldAr is always the domain — shown as a badge, not the title */}
                          <Badge variant="outline" className="text-xs border-[#E2E8F0] text-gray-500">{rec.fieldAr}</Badge>
                        </div>
                        {/* FIX: nameAr is now the specialty name, not the domain */}
                        <h3 className="font-bold text-[#0B2340] text-base leading-snug">{rec.nameAr}</h3>
                        <p className="text-gray-400 text-xs">{rec.nameFr}</p>
                      </div>
                      <div className="shrink-0 text-gray-400">
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {rec.reasons.map(r => (
                        <span key={r} className="flex items-center gap-1 text-xs bg-[#F4F6F9] text-gray-600 px-2 py-0.5 rounded-full border border-[#E2E8F0]">
                          <CheckCircle className="w-3 h-3 text-[#006233]" /> {r}
                        </span>
                      ))}
                    </div>
                  </CardContent>
                </button>

                {isExpanded && (
                  <div className="border-t border-[#E2E8F0] px-5 pb-5 pt-4 bg-[#FAFBFC]">
                    <p className="text-gray-600 text-sm mb-4">{rec.descriptionAr}</p>

                    <div className="grid md:grid-cols-3 gap-3 mb-4 text-sm">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Clock className="w-4 h-4 text-[#006233]" />
                        <span>مدة الدراسة: <span className="font-semibold text-[#0B2340]">{rec.durationYears} سنوات</span></span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Star className="w-4 h-4 text-[#C8A84B]" />
                        <span>الحد الأدنى: <span className="font-semibold text-[#0B2340]">{rec.minGrade ?? '—'}/20</span></span>
                      </div>
                      {rec.admissionPriority && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <CheckCircle className="w-4 h-4 text-[#006233]" />
                          <span>الأولوية: <span className="font-semibold text-[#006233]">{rec.admissionPriority}</span></span>
                        </div>
                      )}
                    </div>

                    <div>
                      <p className="text-xs font-semibold text-gray-500 mb-2 flex items-center gap-1.5">
                        <Briefcase className="w-3.5 h-3.5" /> المسارات المهنية المتاحة
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {rec.careerPaths.map(c => (
                          <span key={c} className="bg-white border border-[#E2E8F0] text-[#0B2340] text-xs px-3 py-1 rounded-full">{c}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            )
          })}
        </div>

        {/* ── RECOMMENDED UNIVERSITIES — FIX: now uses real domain keys ── */}
        {hasData && (() => {
          const matchingUnis = getMatchingUniversities(recommendations)
          return matchingUnis.length > 0 ? (
            <div className="mt-8">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-[#0B2340]/10 flex items-center justify-center">
                  <MapPin className="w-4 h-4 text-[#0B2340]" />
                </div>
                <h2 className="text-lg font-bold text-[#0B2340]">الجامعات الأنسب لتوصياتك</h2>
              </div>
              <p className="text-sm text-gray-500 mb-4">
                مؤسسات جامعية جزائرية رسمية تقدم التخصصات الموصى بها — بناءً على الدليل الرسمي لوزارة التعليم العالي 2025
              </p>
              <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
                {matchingUnis.map(u => (
                  <Card key={u.id} className="border border-[#E2E8F0] hover:border-[#006233]/40 transition-all bg-white">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-2.5 mb-2">
                        <div className="w-9 h-9 rounded-lg bg-[#006233]/10 flex items-center justify-center shrink-0">
                          <Star className="w-4 h-4 text-[#006233]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-xs text-[#0B2340] leading-tight">{u.nameAr}</h4>
                          <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                            <MapPin className="w-3 h-3" /> {u.wilaya}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {u.matchedLabels.map(s => (
                          <Badge key={s} className="text-xs bg-[#006233]/8 text-[#006233] border-0 py-0 px-1.5">{s}</Badge>
                        ))}
                      </div>
                      {u.website && (
                        <a href={u.website} target="_blank" rel="noopener noreferrer"
                          className="mt-2 flex items-center gap-1 text-xs text-[#006233] hover:underline">
                          <ExternalLink className="w-3 h-3" /> الموقع الرسمي
                        </a>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
              <div className="mt-3 text-center">
                <Link href="/universities?from=dashboard">
                  <button className="inline-flex items-center gap-1.5 text-sm text-[#006233] font-medium hover:text-[#004d28] transition-colors">
                    عرض جميع الجامعات <ChevronLeft className="w-4 h-4" />
                  </button>
                </Link>
              </div>
            </div>
          ) : null
        })()}

        {/* CTA bottom */}
        <div className="grid md:grid-cols-2 gap-4 mt-8">
          <Card className="bg-[#006233]/5 border-[#006233]/20">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#006233]/10 flex items-center justify-center shrink-0">
                <Compass className="w-6 h-6 text-[#006233]" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-sm text-[#0B2340]">استكشف كل التخصصات</h3>
                <p className="text-xs text-gray-500 mt-0.5">تصفح 300+ تخصص في الجزائر</p>
              </div>
              <Link href="/explorer?from=dashboard">
                <Button size="sm" className="bg-[#006233] text-white hover:bg-[#004d28] gap-1.5">
                  استكشاف <ChevronLeft className="w-3.5 h-3.5" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="bg-[#0B2340]/5 border-[#0B2340]/20">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#0B2340]/10 flex items-center justify-center shrink-0">
                <RefreshCw className="w-6 h-6 text-[#0B2340]" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-sm text-[#0B2340]">إعادة الاختبار</h3>
                <p className="text-xs text-gray-500 mt-0.5">جرّب إجابات مختلفة وقارن النتائج</p>
              </div>
              <Link href="/assessment?reset=1">
                <Button size="sm" variant="outline" className="border-[#0B2340]/30 text-[#0B2340] gap-1.5">
                  إعادة <ChevronLeft className="w-3.5 h-3.5" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}