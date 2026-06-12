
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { ResultsContent } from '@/components/results/results-content'
import {
  getStudentProfile,
  getUserRecommendations,
  getAssessmentAnswers,
  canRunAssessment,
} from '@/app/actions/student'

export default async function ResultsPage() {
  const session = await auth()
  if (!session?.user) redirect('/sign-in')

  const profile = await getStudentProfile()
  // FIX: removed redirect to /onboarding (deleted). No profile → dashboard.
  if (!profile) redirect('/dashboard')

  const [recommendations, answers, rateLimitStatus] = await Promise.all([
    getUserRecommendations(),
    getAssessmentAnswers(),
    canRunAssessment(),
  ])

  // No results yet → take the assessment first
  if (!recommendations || recommendations.length === 0) {
    redirect('/assessment')
  }

  return (
    <ResultsContent
      profile={profile}
      recommendations={recommendations}
      answers={answers}
      // FIX: pass rate-limit info so the "Retake" button is correctly
      // enabled/disabled and shows the right countdown.
      canRetake={rateLimitStatus.allowed}
      hoursLeft={rateLimitStatus.hoursLeft}
      attemptsLeft={rateLimitStatus.attemptsLeft}
      attemptsUsed={rateLimitStatus.attemptsUsed}
    />
  )
}
