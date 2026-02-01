'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui'

export default function DeleteOfferButton({
  carId,
  offerId
}: {
  carId: string
  offerId: string
}) {
  const router = useRouter()
  const supabase = createClient()
  const [confirming, setConfirming] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    setLoading(true)
    const { error } = await supabase.from('offers').delete().eq('id', offerId)

    if (error) {
      alert('Failed to delete offer: ' + error.message)
      setLoading(false)
    } else {
      router.push(`/cars/${carId}`)
      router.refresh()
    }
  }

  if (confirming) {
    return (
      <div className="flex gap-2">
        <Button
          variant="danger"
          onClick={handleDelete}
          disabled={loading}
        >
          {loading ? 'Deleting...' : 'Confirm'}
        </Button>
        <Button
          variant="secondary"
          onClick={() => setConfirming(false)}
          disabled={loading}
        >
          Cancel
        </Button>
      </div>
    )
  }

  return (
    <Button variant="danger" onClick={() => setConfirming(true)}>
      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
      </svg>
      Delete
    </Button>
  )
}
