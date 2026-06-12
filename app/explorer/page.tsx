import { ExplorerContent } from '@/components/explorer/explorer-content'
import { getSpecialtiesCatalogue } from '@/app/actions/student'

export default async function ExplorerPage() {
  const specialties = await getSpecialtiesCatalogue()
  return <ExplorerContent specialties={specialties} />
}
