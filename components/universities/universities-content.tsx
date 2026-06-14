
'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Search, MapPin, ExternalLink, Building2, LayoutDashboard, GraduationCap,
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

type University = {
  id: number
  nameAr: string
  nameFr: string
  wilaya: string
  type: string
  website: string
  specialtiesCount: number
  keySpecialties: string[]
  domains: string[]
}

const ALL_TYPES = [
  { value: 'all', labelAr: 'الكل' },
  { value: 'جامعة', labelAr: 'جامعات' },
  { value: 'مدرسة عليا', labelAr: 'مدارس عليا' },
  { value: 'مؤسسة جامعية', labelAr: 'مؤسسات جامعية' },
]

// FIX: deriveUniversityTypeAr() (in app/actions/student.ts) can return one of
// 9 specific Arabic labels. The filter UI only exposes 3 broad categories, so
// we map every specific label to the matching broad category here before
// comparing against `selectedType`. Without this, types like
// 'مدرسة عليا للأساتذة', 'مدرسة وطنية', 'مركز جامعي', 'معهد وطني',
// 'مدرسة/معهد' never matched any filter option and returned 0 results.
const TYPE_GROUP_MAP: Record<string, string> = {
  'جامعة': 'جامعة',
  'مدرسة عليا': 'مدرسة عليا',
  'مدرسة عليا للأساتذة': 'مدرسة عليا',
  'مدرسة وطنية متعددة التقنيات': 'مدرسة عليا',
  'مدرسة وطنية': 'مدرسة عليا',
  'مدرسة/معهد': 'مدرسة عليا',
  'مركز جامعي': 'مؤسسة جامعية',
  'معهد وطني': 'مؤسسة جامعية',
  'مؤسسة جامعية': 'مؤسسة جامعية',
}

function getTypeGroup(type: string): string {
  return TYPE_GROUP_MAP[type] ?? 'مؤسسة جامعية'
}

const typeColorMap: Record<string, string> = {
  'جامعة': 'bg-[#006233]/10 text-[#006233]',
  'مدرسة عليا': 'bg-[#0B2340]/10 text-[#0B2340]',
  'مؤسسة جامعية': 'bg-[#C8A84B]/10 text-[#C8A84B]',
}

function UniversitiesInner({ universities: universitiesData }: { universities: University[] }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedWilaya, setSelectedWilaya] = useState('الكل')
  const [selectedType, setSelectedType] = useState('all')
  const searchParams = useSearchParams()
  const fromDashboard = searchParams.get('from') === 'dashboard'

  // Derive wilayas dynamically from real data
  const ALL_WILAYAS_DYNAMIC = [
    'الكل',
    ...Array.from(new Set(universitiesData.map(u => u.wilaya).filter(Boolean)))
      .sort((a, b) => a.localeCompare(b, 'ar'))
  ]

  const filteredUniversities = universitiesData.filter((uni) => {
    const q = searchQuery.toLowerCase()
    const matchesSearch =
      uni.nameAr.includes(searchQuery) ||
      uni.nameFr.toLowerCase().includes(q) ||
      uni.wilaya.toLowerCase().includes(q) ||
      uni.keySpecialties.some(s => s.includes(searchQuery))
    const matchesWilaya = selectedWilaya === 'الكل' || uni.wilaya === selectedWilaya
    const matchesType = selectedType === 'all' || getTypeGroup(uni.type) === selectedType
    return matchesSearch && matchesWilaya && matchesType
  })

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
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#0B2340] mb-2">الجامعات الجزائرية</h1>
          <p className="text-gray-500">تصفح {universitiesData.length} مؤسسة جامعية مع تخصصاتها المتاحة</p>
        </div>

        {/* Filters */}
        <Card className="mb-6 border border-[#E2E8F0]">
          <CardContent className="p-4">
            <div className="flex flex-col gap-3">
              {/* Search */}
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="ابحث بالاسم أو الولاية أو التخصص..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-10 border-[#E2E8F0]"
                />
              </div>
              {/* Wilaya + Type */}
              <div className="flex gap-3">
                <Select value={selectedWilaya} onValueChange={(v) => v && setSelectedWilaya(v)}>
                  <SelectTrigger className="flex-1 border-[#E2E8F0]">
                    <MapPin className="w-4 h-4 ml-2 text-gray-400 shrink-0" />
                    <SelectValue placeholder="الولاية" />
                  </SelectTrigger>
                  <SelectContent>
                    {ALL_WILAYAS_DYNAMIC.map(w => (
                      <SelectItem key={w} value={w}>{w}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={selectedType} onValueChange={(v) => v && setSelectedType(v)}>
                  <SelectTrigger className="flex-1 border-[#E2E8F0]">
                    <Building2 className="w-4 h-4 ml-2 text-gray-400 shrink-0" />
                    <SelectValue placeholder="النوع" />
                  </SelectTrigger>
                  <SelectContent>
                    {ALL_TYPES.map(t => (
                      <SelectItem key={t.value} value={t.value}>{t.labelAr}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <p className="text-sm text-gray-500 mb-4">{filteredUniversities.length} مؤسسة</p>

        <div className="grid md:grid-cols-2 gap-4">
          {filteredUniversities.map((uni) => (
            <Card key={uni.id} className="border border-[#E2E8F0] hover:border-[#006233]/40 hover:-translate-y-0.5 transition-all duration-200 bg-white">
              <CardContent className="p-5">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-11 h-11 rounded-xl bg-[#0B2340]/5 flex items-center justify-center shrink-0">
                    <Building2 className="w-5 h-5 text-[#0B2340]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-sm text-[#0B2340] leading-tight">{uni.nameAr}</h3>
                    {uni.nameFr && uni.nameFr !== uni.nameAr && (
                      <p className="text-xs text-gray-400 mt-0.5 truncate">{uni.nameFr}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 mb-3 flex-wrap">
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold ${typeColorMap[getTypeGroup(uni.type)] ?? 'bg-gray-100 text-gray-600'}`}>
                    {uni.type}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-gray-500">
                    <MapPin className="w-3.5 h-3.5" /> {uni.wilaya}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-gray-500">
                    <GraduationCap className="w-3.5 h-3.5" /> {uni.specialtiesCount} تخصص
                  </span>
                </div>

                {uni.keySpecialties.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs text-gray-400 mb-1.5">أبرز التخصصات:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {uni.keySpecialties.slice(0, 4).map(s => (
                        <Badge key={s} variant="outline" className="text-xs border-[#E2E8F0] text-[#0B2340] py-0">
                          {s}
                        </Badge>
                      ))}
                      {uni.keySpecialties.length > 4 && (
                        <span className="text-xs text-gray-400 self-center">+{uni.keySpecialties.length - 4}</span>
                      )}
                    </div>
                  </div>
                )}

                {uni.domains.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {uni.domains.slice(0, 2).map(d => (
                      <Badge key={d} className="text-xs bg-[#006233]/8 text-[#006233] border-0 py-0">
                        {d}
                      </Badge>
                    ))}
                  </div>
                )}

                {uni.website && (
                  <a
                    href={uni.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-[#006233] hover:text-[#004d28] font-medium transition-colors"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    زيارة الموقع الرسمي
                  </a>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredUniversities.length === 0 && (
          <div className="text-center py-12">
            <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-400">لا توجد نتائج تطابق بحثك</p>
            <button
              onClick={() => { setSearchQuery(''); setSelectedWilaya('الكل'); setSelectedType('all') }}
              className="mt-3 text-sm text-[#006233] hover:underline"
            >
              مسح الفلاتر
            </button>
          </div>
        )}
      </main>

      {!fromDashboard && <PublicFooter />}
    </div>
  )
}

export function UniversitiesContent({ universities }: { universities: University[] }) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F4F6F9]" />}>
      <UniversitiesInner universities={universities} />
    </Suspense>
  )
}
