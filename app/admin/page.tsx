import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { AdminDashboard } from '@/components/admin/admin-dashboard'

// List of admin email addresses
const ADMIN_EMAILS = ['admin@masarek.dz']

export default async function AdminPage() {
  // ✅ Fixed NextAuth v5 session check
  const session = await auth()
  if (!session?.user) redirect('/sign-in')
  
  // Check if user is admin (Make sure your NextAuth configuration returns the user email)
  if (!session.user.email || !ADMIN_EMAILS.includes(session.user.email)) {
    redirect('/dashboard')
  }

  return <AdminDashboard />
}