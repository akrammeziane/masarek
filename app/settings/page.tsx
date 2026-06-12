
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { SettingsContent } from '@/components/settings/settings-content'
import { getStudentProfile, canRunAssessment } from '@/app/actions/student'

export default async function SettingsPage() {
  const session = await auth()
  if (!session?.user) redirect('/sign-in')

  const profile = await getStudentProfile()
  // FIX: removed redirect to /onboarding (deleted). No profile → dashboard.
  if (!profile) redirect('/dashboard')

  // FIX: pass rate-limit data so settings retake button is correctly enabled/disabled
  const rateLimitStatus = await canRunAssessment()

  return (
    <SettingsContent
      user={session.user}
      profile={profile}
      canRetake={rateLimitStatus.allowed}
      hoursLeft={rateLimitStatus.hoursLeft}
      attemptsLeft={rateLimitStatus.attemptsLeft}
      attemptsUsed={rateLimitStatus.attemptsUsed}
    />
  )
}
