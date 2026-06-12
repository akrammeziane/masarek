
// FIX: The onboarding flow has been removed entirely.
// This file redirects any stale links (bookmarks, emails, etc.) that might still
// point to /onboarding directly to /dashboard, preventing a 404.
// The OnboardingForm component at components/onboarding/onboarding-form.tsx
// can be safely deleted from the repository as well.
import { redirect } from 'next/navigation'

export default function OnboardingPage() {
  // Permanent redirect — onboarding is gone, send everyone to dashboard
  redirect('/dashboard')
}
