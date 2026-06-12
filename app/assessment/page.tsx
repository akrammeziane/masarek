
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { AssessmentContent } from '@/components/assessment/assessment-content'
import { getStudentProfile, resetAssessment, canRunAssessment } from '@/app/actions/student'

interface Props {
  searchParams: Promise<{ reset?: string }>
}

export default async function AssessmentPage({ searchParams }: Props) {
  const session = await auth()
  if (!session?.user) redirect('/sign-in')

  const params = await searchParams

  const profile = await getStudentProfile()
  // FIX: was redirecting to /onboarding (deleted). New users without a profile
  // are sent to /dashboard which handles profile creation inline.
  if (!profile) redirect('/dashboard')

  // FIX: canRunAssessment now returns a richer object with attemptsUsed/Left
  const { allowed, hoursLeft, attemptsLeft, attemptsUsed } = await canRunAssessment()

  // ?reset=1 clicked — only allow if attempts remain in the rolling window
  if (params.reset === '1') {
    if (!allowed) {
      // Still at 2/2 within 24h — ignore reset, show locked screen
      return (
        <AssessmentContent
          profile={profile}
          canRetake={false}
          hoursLeft={hoursLeft}
          attemptsLeft={0}
          attemptsUsed={attemptsUsed}
        />
      )
    }
    // Attempts remain — safe to reset quiz wizard state
    await resetAssessment()
    redirect('/assessment')
  }

  // Assessment already completed
  if (profile.assessmentCompleted) {
    if (!allowed) {
      // At limit — show wait screen; DB results are preserved
      return (
        <AssessmentContent
          profile={profile}
          canRetake={false}
          hoursLeft={hoursLeft}
          attemptsLeft={0}
          attemptsUsed={attemptsUsed}
        />
      )
    }
    // Has remaining attempts — send to results so they can choose to retake
    redirect('/results')
  }

  // Assessment not yet completed — show the quiz
  return (
    <AssessmentContent
      profile={profile}
      canRetake={true}
      hoursLeft={0}
      attemptsLeft={attemptsLeft}
      attemptsUsed={attemptsUsed}
    />
  )
}
