import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Card, Button } from '@/components/ui'
import type { Comparison } from '@/types/database'
import DeleteComparisonButton from './DeleteComparisonButton'

export default async function SavedComparisonsPage() {
  const supabase = await createClient()

  const { data: comparisonsData } = await supabase
    .from('comparisons')
    .select('*')
    .order('created_at', { ascending: false })

  const comparisons = (comparisonsData ?? []) as Comparison[]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Saved Comparisons</h1>
          <p className="mt-1 text-gray-600">
            View and manage your saved offer comparisons
          </p>
        </div>
        <Link href="/compare">
          <Button>
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Comparison
          </Button>
        </Link>
      </div>

      {comparisons.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {comparisons.map((comparison) => (
            <Card key={comparison.id} className="hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900">{comparison.name}</h3>
                  <p className="text-sm text-gray-500">
                    {comparison.offer_ids.length} offer{comparison.offer_ids.length === 1 ? '' : 's'}
                  </p>
                </div>
                <DeleteComparisonButton
                  comparisonId={comparison.id}
                  comparisonName={comparison.name}
                />
              </div>
              <p className="text-xs text-gray-400 mb-4">
                Saved {new Date(comparison.created_at).toLocaleDateString('de-DE', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </p>
              <Link
                href={`/compare?offers=${comparison.offer_ids.join(',')}`}
                className="inline-flex items-center text-indigo-600 hover:text-indigo-800 text-sm font-medium"
              >
                Load comparison
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="text-center py-12">
          <svg className="mx-auto w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-gray-900">No saved comparisons</h3>
          <p className="mt-2 text-gray-500">
            Create a comparison and save it to access it later.
          </p>
          <div className="mt-6">
            <Link href="/compare">
              <Button>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create your first comparison
              </Button>
            </Link>
          </div>
        </Card>
      )}
    </div>
  )
}
