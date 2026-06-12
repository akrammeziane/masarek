'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  GraduationCap,
  Users,
  BookOpen,
  Building2,
  TrendingUp,
  Activity,
} from 'lucide-react'

// Mock statistics - would come from database
const stats = {
  totalUsers: 1250,
  activeToday: 87,
  completedAssessments: 834,
  totalSpecializations: 150,
  totalUniversities: 58,
  newUsersThisWeek: 145,
}

const recentActivity = [
  { action: 'تسجيل جديد', user: 'أحمد محمد', time: 'منذ 5 دقائق' },
  { action: 'إكمال الاختبار', user: 'فاطمة علي', time: 'منذ 12 دقيقة' },
  { action: 'تسجيل جديد', user: 'يوسف كريم', time: 'منذ 25 دقيقة' },
  { action: 'حفظ تخصص', user: 'مريم سعيد', time: 'منذ 30 دقيقة' },
  { action: 'إكمال الاختبار', user: 'عمر حسن', time: 'منذ 45 دقيقة' },
]

export function AdminDashboard() {
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
            <Badge variant="secondary">لوحة الإدارة</Badge>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground mb-2">لوحة الإدارة</h1>
          <p className="text-muted-foreground">نظرة عامة على إحصائيات المنصة</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.totalUsers.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">إجمالي المستخدمين</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
                  <Activity className="w-5 h-5 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.activeToday}</p>
                  <p className="text-sm text-muted-foreground">نشط اليوم</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <p className="text-2xl font-bold">+{stats.newUsersThisWeek}</p>
                  <p className="text-sm text-muted-foreground">هذا الأسبوع</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-warning" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.completedAssessments}</p>
                  <p className="text-sm text-muted-foreground">اختبار مكتمل</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <GraduationCap className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.totalSpecializations}</p>
                  <p className="text-sm text-muted-foreground">تخصص</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.totalUniversities}</p>
                  <p className="text-sm text-muted-foreground">جامعة</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              النشاط الأخير
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-medium">
                      {activity.user.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{activity.user}</p>
                      <p className="text-xs text-muted-foreground">{activity.action}</p>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">{activity.time}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
