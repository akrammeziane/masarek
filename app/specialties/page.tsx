'use client'

import { Suspense } from 'react'
import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

function SpecialtiesRedirect() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const from = searchParams.get('from')
    router.replace(from ? `/explorer?from=${from}` : '/explorer')
  }, [router, searchParams])

  return null
}

export default function SpecialtiesPage() {
  return (
    <Suspense fallback={null}>
      <SpecialtiesRedirect />
    </Suspense>
  )
}