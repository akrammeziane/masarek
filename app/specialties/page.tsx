'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export default function SpecialtiesPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const from = searchParams.get('from')
    router.replace(from ? `/explorer?from=${from}` : '/explorer')
  }, [router, searchParams])

  return null
}
