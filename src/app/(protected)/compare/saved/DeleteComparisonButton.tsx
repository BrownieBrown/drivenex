'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Modal, useToast } from '@/components/ui'
import { getUserFriendlyError } from '@/lib/errors'

interface DeleteComparisonButtonProps {
  comparisonId: string
  comparisonName: string
}

export default function DeleteComparisonButton({
  comparisonId,
  comparisonName,
}: DeleteComparisonButtonProps) {
  const router = useRouter()
  const supabase = createClient()
  const toast = useToast()
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    setLoading(true)
    const { error } = await supabase
      .from('comparisons')
      .delete()
      .eq('id', comparisonId)

    if (error) {
      toast.error(getUserFriendlyError(error))
    } else {
      toast.success('Comparison deleted')
      router.refresh()
    }
    setLoading(false)
    setShowModal(false)
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="text-gray-400 hover:text-red-600 transition-colors"
        title="Delete comparison"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onConfirm={handleDelete}
        title="Delete Comparison"
        message={`Are you sure you want to delete "${comparisonName}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        loading={loading}
      />
    </>
  )
}
