import { Suspense } from 'react'
import { ExplorerContent } from '@/components/explorer/explorer-content'
import { getSpecialtiesCatalogue } from '@/app/actions/student'

export default async function ExplorerPage() {
  const specialties = await getSpecialtiesCatalogue()
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ExplorerContent specialties={specialties} />
    </Suspense>
  )
}