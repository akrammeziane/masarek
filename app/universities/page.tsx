
// FIX: Converted to a server component so it fetches the full official university
// catalogue (all 269 entries) via getUniversitiesCatalogue() and passes it as a
// prop to <UniversitiesContent>. This removes the dependency on the old 17-entry
// hardcoded mock array that lived inside the component.
import { UniversitiesContent } from '@/components/universities/universities-content'
import { getUniversitiesCatalogue } from '@/app/actions/student'

export default async function UniversitiesPage() {
  const universities = await getUniversitiesCatalogue()
  return <UniversitiesContent universities={universities} />
}
