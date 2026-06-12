import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { AuthForm } from '@/components/auth-form'

export default async function SignInPage() {
  // ✅ Fixed NextAuth v5 session check
  const session = await auth()
  if (session?.user) redirect('/dashboard')

  return <AuthForm mode="sign-in" />
}