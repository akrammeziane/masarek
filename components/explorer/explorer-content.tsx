'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Search, BookOpen, Briefcase, Clock, Star, Filter, Heart,
  LayoutDashboard, Building2,
} from 'lucide-react'
import { PublicNavbar } from '@/components/public-navbar'
import { PublicFooter } from '@/components/public-footer'

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

const bacSeriesLabels: Record<string, string> = {
  'sciences-exp': 'علوم تجريبية',
  'math': 'رياضيات',
  'tech-math': 'تقني رياضي',
  'letters-philo': 'آداب وفلسفة',
  'languages': 'لغات أجنبية',
  'gestion-eco': 'تسيير واقتصاد',
}

type SpecialtyItem = {
  id: string
  codes?: string[]                    // every raw MESRS code grouped under this name
  nameAr: string
  nameFr: string
  fieldAr: string
  domain: string
  minGrade: number | null             // null = unknown threshold
  universitiesCount?: number          // # of universities offering this specialty
  durationYears: number
  careerPaths: string[]
  descriptionAr: string
  requiredSeries: string[]
}

interface ExplorerContentProps {
  specialties: SpecialtyItem[]
}

const DOMAIN_FIELDS = [
  { value: 'all', labelAr: 'جميع المجالات' },
  { value: 'العلوم والتكنولوجيا', labelAr: 'العلوم والتكنولوجيا' },
  { value: 'الفنون والهندسة', labelAr: 'الفنون والهندسة' },
  { value: 'العلوم الطبية', labelAr: 'العلوم الطبية' },
  { value: 'العلوم الاقتصادية والتجارية', labelAr: 'العلوم الاقتصادية والتجارية' },
  { value: 'العلوم القانونية والسياسية', labelAr: 'العلوم القانونية والسياسية' },
  { value: 'الآداب واللغات', labelAr: 'الآداب واللغات' },
  { value: 'العلوم الاجتماعية والإنسانية', labelAr: 'العلوم الاجتماعية والإنسانية' },
  { value: 'العلوم الأساسية', labelAr: 'العلوم الأساسية' },
  { value: 'العلوم الزراعية والبيئية', labelAr: 'العلوم الزراعية والبيئية' },
  { value: 'الفنون والرياضة', labelAr: 'الفنون والرياضة' },
  { value: 'العلوم الإسلامية', labelAr: 'العلوم الإسلامية' },
]

/** Final client-side guard: collapse any accidental duplicates that slip through
 *  (defense-in-depth — server already dedupes by canonical name). */
function dedupByCanonical(list: SpecialtyItem[]): SpecialtyItem[] {
  const seen = new Map<string, SpecialtyItem>()
  for (const s of list) {
    const key = (s.nameFr || s.nameAr || s.id)
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .toUpperCase().replace(/[^A-Z0-9]+/g, ' ').trim()
    if (!key) continue
    const prev = seen.get(key)
    if (!prev) { seen.set(key, s); continue }
    // Merge: keep lower minGrade, sum universitiesCount, union codes.
    const merged: SpecialtyItem = {
      ...prev,
      codes: Array.from(new Set([...(prev.codes ?? []), ...(s.codes ?? [])])),
      minGrade:
        prev.minGrade == null ? s.minGrade
        : s.minGrade == null ? prev.minGrade
        : Math.min(prev.minGrade, s.minGrade),
      universitiesCount: (prev.universitiesCount ?? 0) + (s.universitiesCount ?? 0),
    }
    seen.set(key, merged)
  }
  return Array.from(seen.values())
}

export function ExplorerContent({ specialties }: ExplorerContentProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedField, setSelectedField] = useState('all')
  const [sortBy, setSortBy] = useState('name')
  const [savedIds, setSavedIds] = useState<string[]>([])
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const searchParams = useSearchParams()
  const fromDashboard = searchParams.get('from') === 'dashboard'

  const distinctSpecs = dedupByCanonical(specialties)

  const filteredSpecs = distinctSpecs
    .filter((spec) => {
      const q = searchQuery.toLowerCase()
      const matchesSearch =
        spec.nameAr.includes(searchQuery) ||
        spec.nameFr.toLowerCase().includes(q) ||
        spec.descriptionAr.includes(searchQuery)
      const matchesField = selectedField === 'all' || spec.fieldAr === selectedField
      return matchesSearch && matchesField
    })
    .sort((a, b) => {
      if (sortBy === 'name') return a.nameAr.localeCompare(b.nameAr, 'ar')
      if (sortBy === 'score') {
        const aNull = a.minGrade == null
        const bNull = b.minGrade == null
        if (aNull && bNull) return 0
        if (aNull) return 1
        if (bNull) return -1
        return (b.minGrade as number) - (a.minGrade as number)
      }
      if (sortBy === 'duration') return a.durationYears - b.durationYears
      return 0
    })

  const toggleSave = (id: string) => {
    setSavedIds((prev) => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
  }
  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id))
  }

  return (
    <div className="min-h-screen bg-[#F4F6F9]" dir="rtl">

      {fromDashboard ? (
        <header className="sticky top-0 z-50 backdrop-blur-md bg-white/95 border-b border-[#E2E8F0] shadow-sm">
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
            <Link href="/dashboard" className="flex items-center gap-2">
              <MasarekLogo size={36} />
              <div>
                <span className="text-lg font-bold text-[#0B2340]" style={{ fontFamily: 'Noto Sans Arabic, sans-serif' }}>مساركَ</span>
                <span className="text-xs text-[#006233] block leading-none">Masarek.dz</span>
              </div>
            </Link>
            <Link href="/dashboard">
              <button className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold border border-[#006233] text-[#006233] hover:bg-[#006233] hover:text-white transition-all duration-200">
                <LayoutDashboard className="w-4 h-4" />
                العودة للوحة التحكم
              </button>
            </Link>
          </div>
        </header>
      ) : (
        <PublicNavbar variant="sticky" />
      )}

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#0B2340] mb-2">استكشاف التخصصات</h1>
          <p className="text-gray-500">
            تصفح جميع التخصصات الجامعية المتاحة في الجزائر ({distinctSpecs.length} تخصص)
          </p>
        </div>

        <Card className="mb-6 border border-[#E2E8F0]">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="ابحث عن تخصص..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-10 border-[#E2E8F0]"
                />
              </div>
              <Select value={selectedField} onValueChange={setSelectedField}>
                <SelectTrigger className="w-full md:w-64 border-[#E2E8F0]">
                  <Filter className="w-4 h-4 ml-2 text-gray-400" />
                  <SelectValue placeholder="المجال" />
                </SelectTrigger>
                <SelectContent>
                  {DOMAIN_FIELDS.map((field) => (
                    <SelectItem key={field.value} value={field.value}>
                      {field.labelAr}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Tabs value={sortBy} onValueChange={setSortBy} className="hidden md:block">
                <TabsList>
                  <TabsTrigger value="name">الاسم</TabsTrigger>
                  <TabsTrigger value="score">المعدل</TabsTrigger>
                  <TabsTrigger value="duration">المدة</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardContent>
        </Card>

        <p className="text-sm text-gray-500 mb-4">{filteredSpecs.length} تخصص</p>

        <div className="grid md:grid-cols-2 gap-4">
          {filteredSpecs.map((spec) => (
            <Card
              key={spec.id}
              className={`border transition-all duration-200 bg-white cursor-pointer ${
                expandedId === spec.id
                  ? 'border-[#006233] shadow-md'
                  : 'border-[#E2E8F0] hover:border-[#006233]/40 hover:-translate-y-0.5'
              }`}
              onClick={() => toggleExpand(spec.id)}
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-base text-[#0B2340] leading-tight">{spec.nameAr}</h3>
                    <p className="text-xs text-gray-400 mt-0.5 truncate">{spec.nameFr}</p>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleSave(spec.id) }}
                    className={`p-2 rounded-lg transition-colors shrink-0 ${
                      savedIds.includes(spec.id)
                        ? 'bg-[#D21034]/10 text-[#D21034]'
                        : 'bg-[#F4F6F9] hover:bg-[#E2E8F0] text-gray-400'
                    }`}
                  >
                    <Heart className={`w-4 h-4 ${savedIds.includes(spec.id) ? 'fill-current' : ''}`} />
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <Badge variant="secondary" className="bg-[#006233]/10 text-[#006233] border-0 text-xs">
                    {spec.fieldAr}
                  </Badge>
                  {spec.universitiesCount != null && spec.universitiesCount > 0 && (
                    <Badge variant="outline" className="text-xs border-[#E2E8F0] py-0 flex items-center gap-1">
                      <Building2 className="w-3 h-3" />
                      {spec.universitiesCount} جامعة
                    </Badge>
                  )}
                </div>

                <p className="text-sm text-gray-500 mb-4 leading-relaxed line-clamp-2">{spec.descriptionAr}</p>

                <div className="flex flex-wrap gap-4 text-sm mb-4">
                  <div className="flex items-center gap-1.5">
                    <Star className="w-4 h-4 text-[#C8A84B]" />
                    <span className="text-[#0B2340] text-xs">
                      الحد الأدنى:{' '}
                      <span className="font-semibold">
                        {spec.minGrade != null ? spec.minGrade : '—'}
                      </span>
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className="text-[#0B2340] text-xs">{spec.durationYears} سنوات</span>
                  </div>
                </div>

                <div className="space-y-2">
                  {spec.requiredSeries.length > 0 && (
                    <div className="flex items-center gap-2 flex-wrap">
                      <BookOpen className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      <span className="text-xs text-gray-400">الشعب:</span>
                      {spec.requiredSeries.slice(0, 3).map((bac) => (
                        <Badge key={bac} variant="outline" className="text-xs border-[#E2E8F0] py-0">
                          {bacSeriesLabels[bac] ?? bac}
                        </Badge>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center gap-2 flex-wrap">
                    <Briefcase className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    <span className="text-xs text-gray-400">المهن:</span>
                    {spec.careerPaths.slice(0, 2).map((career) => (
                      <Badge key={career} variant="outline" className="text-xs border-[#E2E8F0] py-0">
                        {career}
                      </Badge>
                    ))}
                    {spec.careerPaths.length > 2 && (
                      <span className="text-xs text-gray-400">+{spec.careerPaths.length - 2}</span>
                    )}
                  </div>
                </div>

                {expandedId === spec.id && (
                  <div className="mt-4 pt-4 border-t border-[#E2E8F0] space-y-2" onClick={(e) => e.stopPropagation()}>
                    <p className="text-xs font-semibold text-[#0B2340] mb-2">
                      📋 معلومات القبول (حدود دنيا 2025)
                    </p>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="bg-[#006233]/5 rounded-lg p-2">
                        <p className="text-xs text-gray-400">أولوية 1</p>
                        <p className="font-bold text-[#006233] text-sm">
                          {spec.minGrade != null ? spec.minGrade : '—'}
                        </p>
                      </div>
                      <div className="bg-[#C8A84B]/10 rounded-lg p-2">
                        <p className="text-xs text-gray-400">أولوية 2</p>
                        <p className="font-bold text-[#C8A84B] text-sm">
                          {spec.minGrade != null ? Math.max(10, spec.minGrade - 0.5).toFixed(2) : '—'}
                        </p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-2">
                        <p className="text-xs text-gray-400">أولوية 3</p>
                        <p className="font-bold text-gray-500 text-sm">
                          {spec.minGrade != null ? Math.max(10, spec.minGrade - 1.0).toFixed(2) : '—'}
                        </p>
                      </div>
                    </div>
                    {spec.universitiesCount != null && spec.universitiesCount > 0 && (
                      <p className="text-xs text-gray-500 mt-1">
                        🏛️ يُدرَّس هذا التخصص في <span className="font-semibold text-[#0B2340]">{spec.universitiesCount}</span> جامعة/مؤسسة (موسم 2025).
                      </p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">
                      ℹ️ الحد الأدنى الموضح هو أدنى معدل سُجِّل في عروض 2025. انقر مرة أخرى للطي.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredSpecs.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-400">لا توجد نتائج تطابق بحثك</p>
          </div>
        )}
      </main>

      {!fromDashboard && <PublicFooter />}
    </div>
  )
}
