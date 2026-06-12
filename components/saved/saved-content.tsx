'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  GraduationCap,
  Bookmark,
  BookOpen,
  Briefcase,
  Clock,
  Star,
  Trash2,
  Compass,
} from 'lucide-react'

// This would normally come from the database
const savedSpecs = [
  {
    id: 1,
    nameAr: 'هندسة المعلوماتية',
    nameFr: 'Génie Informatique',
    fieldAr: 'العلوم والتكنولوجيا',
    minScore: 14.5,
    durationYears: 5,
    careers: ['مهندس برمجيات', 'محلل بيانات', 'مطور ويب'],
    savedAt: '2025-06-01',
  },
]

export function SavedContent() {
  const handleRemove = (id: number) => {
    // This would call the server action
    console.log('[v0] Remove saved:', id)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b border-border">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg">مساركَ</span>
          </Link>
          <Link href="/dashboard">
            <Button variant="outline" size="sm">
              العودة للوحة التحكم
            </Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Page Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-14 h-14 rounded-2xl bg-success/10 flex items-center justify-center">
            <Bookmark className="w-7 h-7 text-success" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">التخصصات المحفوظة</h1>
            <p className="text-muted-foreground">
              {savedSpecs.length} تخصص محفوظ
            </p>
          </div>
        </div>

        {savedSpecs.length > 0 ? (
          <div className="space-y-4">
            {savedSpecs.map((spec) => (
              <Card key={spec.id}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <h3 className="font-bold text-lg">{spec.nameAr}</h3>
                          <p className="text-sm text-muted-foreground">{spec.nameFr}</p>
                        </div>
                        <Badge variant="secondary">{spec.fieldAr}</Badge>
                      </div>

                      <div className="flex flex-wrap gap-4 text-sm mb-4">
                        <div className="flex items-center gap-1.5">
                          <Star className="w-4 h-4 text-warning" />
                          <span>الحد الأدنى: {spec.minScore}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-4 h-4 text-muted-foreground" />
                          <span>{spec.durationYears} سنوات</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        <Briefcase className="w-4 h-4 text-muted-foreground" />
                        {spec.careers.map((career) => (
                          <Badge key={career} variant="outline" className="text-xs">
                            {career}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemove(spec.id)}
                      className="text-muted-foreground hover:text-destructive shrink-0"
                    >
                      <Trash2 className="w-5 h-5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="py-12">
            <CardContent className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
                <Bookmark className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="font-semibold text-lg mb-2">لا توجد تخصصات محفوظة</h3>
              <p className="text-muted-foreground mb-6">
                استكشف التخصصات واحفظ ما يهمك للرجوع إليه لاحقًا
              </p>
              <Link href="/explorer">
                <Button className="gap-2">
                  <Compass className="w-4 h-4" />
                  <span>استكشاف التخصصات</span>
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
