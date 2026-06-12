import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { DashboardContent } from '@/components/dashboard/dashboard-content'
import { getStudentProfile, getUserRecommendations } from '@/app/actions/student'

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user) redirect('/sign-in')

  const profile = await getStudentProfile()

  const user = {
    id: session.user.id ?? '',
    name: session.user.name ?? '',
    email: session.user.email ?? '',
    image: session.user.image ?? null,
  }

  // Always fetch — old results persist after reset until new assessment is submitted
  const recommendations = await getUserRecommendations()

  return (
    <DashboardContent
      user={user}
      profile={profile}
      recommendations={recommendations}
    />
  )
}
