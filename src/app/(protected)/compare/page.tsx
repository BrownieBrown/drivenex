import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui'
import CompareClient from './CompareClient'

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<{ offers?: string }>
}) {
  const { offers: offerIds } = await searchParams
  const supabase = await createClient()

  // Get all cars with their offers
  const { data: cars } = await supabase
    .from('cars')
    .select(`
      *,
      offers (
        *,
        running_costs (*)
      )
    `)
    .order('created_at', { ascending: false })

  // Get preselected offer IDs from URL
  const preselectedIds = offerIds?.split(',').filter(Boolean) || []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Compare Offers</h1>
        <p className="mt-1 text-gray-600">
          Select offers to compare their total cost of ownership
        </p>
      </div>

      {cars && cars.length > 0 ? (
        <CompareClient cars={cars} preselectedIds={preselectedIds} />
      ) : (
        <Card className="text-center py-12">
          <svg className="mx-auto w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-gray-900">No offers to compare</h3>
          <p className="mt-2 text-gray-500">
            Add some cars and offers first, then come back to compare them.
          </p>
        </Card>
      )}
    </div>
  )
}
