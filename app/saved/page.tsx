import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { SavedContent } from '@/components/saved/saved-content'

export default async function SavedPage() {
  const session = await auth()
  if (!session?.user) redirect('/sign-in')

  return <SavedContent />
}
