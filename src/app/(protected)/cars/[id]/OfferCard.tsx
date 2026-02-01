'use client'

import Link from 'next/link'
import { Card } from '@/components/ui'
import type { Offer } from '@/types/database'

const offerTypeLabels: Record<string, string> = {
  lease: 'Leasing',
  buy: 'Purchase',
  subscription: 'Subscription',
}

interface OfferCardProps {
  offer: Offer
  carId: string
}

export default function OfferCard({ offer, carId }: OfferCardProps) {
  return (
    <Link href={`/cars/${carId}/offers/${offer.id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
        <div className="flex items-start justify-between mb-3">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            offer.type === 'lease' ? 'bg-indigo-100 text-indigo-800' :
            offer.type === 'buy' ? 'bg-green-100 text-green-800' :
            'bg-purple-100 text-purple-800'
          }`}>
            {offerTypeLabels[offer.type]}
          </span>
          {offer.source_url && (
            <a
              href={offer.source_url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-gray-400 hover:text-indigo-600 transition-colors"
              title="View original offer"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          )}
        </div>

        <h3 className="font-semibold text-gray-900">{offer.name}</h3>
        {offer.source_name && (
          <p className="text-sm text-gray-500">{offer.source_name}</p>
        )}

        <div className="mt-4 space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-500">Monthly</span>
            <span className="font-semibold text-gray-900">{offer.monthly_payment.toFixed(2)} EUR</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Duration</span>
            <span className="text-gray-900">{offer.duration_months} months</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">km/year</span>
            <span className="text-gray-900">{offer.km_per_year.toLocaleString()}</span>
          </div>
          {offer.down_payment > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Down payment</span>
              <span className="text-gray-900">{offer.down_payment.toFixed(2)} EUR</span>
            </div>
          )}
        </div>

        <div className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap gap-1">
          {offer.includes_insurance && (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-green-50 text-green-700">
              Insurance
            </span>
          )}
          {offer.includes_maintenance && (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-green-50 text-green-700">
              Maintenance
            </span>
          )}
          {offer.includes_tax && (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-green-50 text-green-700">
              Tax
            </span>
          )}
          {offer.includes_tires && (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-green-50 text-green-700">
              Tires
            </span>
          )}
        </div>
      </Card>
    </Link>
  )
}
