import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { AuthForm } from '@/components/auth-form'

export default async function SignUpPage() {
  // ✅ This is the correct NextAuth.js v5 way to fetch a session on a Server Component
  const session = await auth()

  // If a session exists, the student is logged in; redirect them away from sign-up
  if (session?.user) {
    redirect('/dashboard')
  }

  return <AuthForm mode="sign-up" />
}