'use client'

import { useState, useMemo } from 'react'
import { Card } from '@/components/ui'
import { calculateTCO, formatCurrency } from '@/lib/calculations'
import {
  CumulativeCostChart,
  MonthlyCostBreakdownChart,
} from '@/components/charts/CostChart'
import type { Car, Offer, RunningCosts } from '@/types/database'
import Link from 'next/link'

type CarWithOffers = Car & {
  offers: (Offer & { running_costs: RunningCosts[] })[]
}

interface CompareClientProps {
  cars: CarWithOffers[]
  preselectedIds: string[]
}

const offerTypeLabels: Record<string, string> = {
  lease: 'Leasing',
  buy: 'Purchase',
  subscription: 'Subscription',
}

export default function CompareClient({ cars, preselectedIds }: CompareClientProps) {
  const [selectedOfferIds, setSelectedOfferIds] = useState<string[]>(preselectedIds)
  const [years, setYears] = useState(3)
  const [compareByContract, setCompareByContract] = useState(false)

  const allOffers = useMemo(() => {
    return cars.flatMap((car) =>
      car.offers.map((offer) => ({
        car,
        offer,
        runningCosts: offer.running_costs?.[0] || null,
      }))
    )
  }, [cars])

  const selectedOffers = useMemo(() => {
    return allOffers.filter((o) => selectedOfferIds.includes(o.offer.id))
  }, [allOffers, selectedOfferIds])

  const comparisonData = useMemo(() => {
    const data = selectedOffers.map((item) => {
      const contractYears = item.offer.duration_months / 12
      const effectiveYears = compareByContract ? contractYears : years
      return {
        name: `${item.car.brand} ${item.car.model} - ${item.offer.name}`,
        shortName: item.offer.name,
        color: '#3B82F6',
        tco: calculateTCO(item.car, item.offer, item.runningCosts, effectiveYears),
        offer: item.offer,
        car: item.car,
        contractYears,
        effectiveYears,
        costPerMonth: calculateTCO(item.car, item.offer, item.runningCosts, contractYears).totalCost / item.offer.duration_months,
      }
    })
    // Sort by cost per month in contract mode, by total cost otherwise
    return data.sort((a, b) =>
      compareByContract
        ? a.costPerMonth - b.costPerMonth
        : a.tco.totalCost - b.tco.totalCost
    )
  }, [selectedOffers, years, compareByContract])

  const toggleOffer = (offerId: string) => {
    setSelectedOfferIds((prev) =>
      prev.includes(offerId)
        ? prev.filter((id) => id !== offerId)
        : [...prev, offerId]
    )
  }

  return (
    <div className="space-y-6">
      {/* Offer Selection */}
      <Card>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Select Offers to Compare</h2>
        <div className="space-y-4">
          {cars.map((car) => (
            <div key={car.id}>
              <h3 className="font-medium text-gray-700 mb-2 flex items-center">
                <span className="mr-2">{car.fuel_type === 'bev' ? '⚡' : '⛽'}</span>
                {car.brand} {car.model}
                {car.variant && <span className="text-gray-500 ml-1">({car.variant})</span>}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                {car.offers.map((offer) => {
                  const isSelected = selectedOfferIds.includes(offer.id)
                  return (
                    <button
                      key={offer.id}
                      onClick={() => toggleOffer(offer.id)}
                      className={`text-left p-3 rounded-lg border-2 transition-all ${
                        isSelected
                          ? 'border-indigo-500 bg-indigo-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          offer.type === 'lease' ? 'bg-indigo-100 text-indigo-700' :
                          offer.type === 'buy' ? 'bg-green-100 text-green-700' :
                          'bg-purple-100 text-purple-700'
                        }`}>
                          {offerTypeLabels[offer.type]}
                        </span>
                        {isSelected && (
                          <svg className="w-5 h-5 text-indigo-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                      <p className="font-medium mt-1 text-gray-900">{offer.name}</p>
                      <p className="text-sm text-gray-500">
                        {offer.monthly_payment.toFixed(0)} EUR/month
                      </p>
                    </button>
                  )
                })}
                {car.offers.length === 0 && (
                  <p className="text-gray-500 text-sm col-span-full">
                    No offers yet.{' '}
                    <Link href={`/cars/${car.id}/offers/new`} className="text-indigo-600 hover:underline">
                      Add one
                    </Link>
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Duration Selector */}
      {selectedOfferIds.length > 0 && (
        <Card>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Comparison Mode</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => setCompareByContract(false)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    !compareByContract
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Fixed Period
                </button>
                <button
                  onClick={() => setCompareByContract(true)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    compareByContract
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  By Contract Length
                </button>
              </div>
            </div>

            {!compareByContract && (
              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                <span className="text-sm text-gray-600">Compare all offers over:</span>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((y) => (
                    <button
                      key={y}
                      onClick={() => setYears(y)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        years === y
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {y}y
                    </button>
                  ))}
                </div>
              </div>
            )}

            {compareByContract && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="text-sm text-amber-800">
                  Each offer is compared over its own contract duration.
                  Use this to fairly compare short-term subscriptions vs long-term leases.
                </p>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Comparison Results */}
      {comparisonData.length > 0 && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {comparisonData.map((item, index) => (
              <Card key={item.offer.id} className="relative">
                {index === 0 && comparisonData.length > 1 && (
                  <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                    {compareByContract ? 'Best Value' : 'Cheapest'}
                  </div>
                )}
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      item.offer.type === 'lease' ? 'bg-indigo-100 text-indigo-700' :
                      item.offer.type === 'buy' ? 'bg-green-100 text-green-700' :
                      'bg-purple-100 text-purple-700'
                    }`}>
                      {offerTypeLabels[item.offer.type]}
                    </span>
                  </div>
                  {item.offer.source_url && (
                    <a
                      href={item.offer.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-400 hover:text-indigo-600"
                      title="View original offer"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  )}
                </div>
                <h3 className="font-semibold text-gray-900">{item.car.brand} {item.car.model}</h3>
                <p className="text-sm text-gray-500 mb-4">{item.offer.name}</p>

                {compareByContract && (
                  <div className="mb-3 px-2 py-1 bg-gray-100 rounded text-center">
                    <span className="text-sm font-medium text-gray-700">
                      {item.offer.duration_months} month contract
                    </span>
                  </div>
                )}

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-500">
                      {compareByContract
                        ? `Total (${item.offer.duration_months}mo)`
                        : `Total (${years} years)`}
                    </span>
                    <span className="font-bold text-lg text-gray-900">{formatCurrency(item.tco.totalCost)}</span>
                  </div>
                  {compareByContract && (
                    <div className="flex justify-between text-sm bg-indigo-50 -mx-2 px-2 py-1 rounded">
                      <span className="text-indigo-700 font-medium">Cost per Month</span>
                      <span className="font-bold text-indigo-900">{formatCurrency(item.costPerMonth)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Avg. Monthly</span>
                    <span className="font-medium text-gray-900">{formatCurrency(item.tco.averageMonthly)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Upfront Costs</span>
                    <span className="text-gray-900">{formatCurrency(item.tco.upfrontCosts)}</span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap gap-1">
                  {item.offer.includes_insurance && (
                    <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded">Insurance</span>
                  )}
                  {item.offer.includes_maintenance && (
                    <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded">Maintenance</span>
                  )}
                  {item.offer.includes_tax && (
                    <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded">Tax</span>
                  )}
                  {item.offer.includes_tires && (
                    <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded">Tires</span>
                  )}
                </div>
              </Card>
            ))}
          </div>

          {/* Charts */}
          {!compareByContract && (
            <Card>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Total Cost Over Time</h2>
              <CumulativeCostChart data={comparisonData} years={years} />
            </Card>
          )}

          <Card>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Monthly Cost Breakdown</h2>
            <MonthlyCostBreakdownChart data={comparisonData} />
            {compareByContract && (
              <p className="mt-4 text-sm text-gray-500 text-center">
                Cost per month is the best metric for comparing offers with different contract lengths.
              </p>
            )}
          </Card>

          {/* Detailed Comparison Table */}
          <Card>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Detailed Comparison</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Category</th>
                    {comparisonData.map((item) => (
                      <th key={item.offer.id} className="text-right py-3 px-4 font-medium text-gray-900">
                        {item.shortName}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  <tr>
                    <td className="py-3 px-4 text-gray-500">Monthly Payment</td>
                    {comparisonData.map((item) => (
                      <td key={item.offer.id} className="text-right py-3 px-4 text-gray-900">
                        {formatCurrency(item.offer.monthly_payment)}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-3 px-4 text-gray-500">Down Payment</td>
                    {comparisonData.map((item) => (
                      <td key={item.offer.id} className="text-right py-3 px-4 text-gray-900">
                        {formatCurrency(item.offer.down_payment)}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-3 px-4 text-gray-500">Transfer Fee</td>
                    {comparisonData.map((item) => (
                      <td key={item.offer.id} className="text-right py-3 px-4 text-gray-900">
                        {formatCurrency(item.offer.transfer_fee)}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-3 px-4 text-gray-500">Duration</td>
                    {comparisonData.map((item) => (
                      <td key={item.offer.id} className="text-right py-3 px-4 text-gray-900">
                        {item.offer.duration_months} months
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-3 px-4 text-gray-500">km/year</td>
                    {comparisonData.map((item) => (
                      <td key={item.offer.id} className="text-right py-3 px-4 text-gray-900">
                        {item.offer.km_per_year.toLocaleString()}
                      </td>
                    ))}
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="py-3 px-4 font-medium text-gray-900">
                      Yearly Running Costs
                    </td>
                    {comparisonData.map((item) => (
                      <td key={item.offer.id} className="text-right py-3 px-4 font-medium text-gray-900">
                        ~{formatCurrency(item.tco.runningCosts / item.effectiveYears)}
                      </td>
                    ))}
                  </tr>
                  {compareByContract && (
                    <tr className="bg-amber-50">
                      <td className="py-3 px-4 font-medium text-amber-900">
                        Cost per Month
                      </td>
                      {comparisonData.map((item) => (
                        <td key={item.offer.id} className="text-right py-3 px-4 font-bold text-amber-900">
                          {formatCurrency(item.costPerMonth)}
                        </td>
                      ))}
                    </tr>
                  )}
                  <tr className="bg-indigo-50">
                    <td className="py-3 px-4 font-semibold text-indigo-900">
                      {compareByContract
                        ? 'Total Contract Cost'
                        : `Total Cost (${years} years)`}
                    </td>
                    {comparisonData.map((item) => (
                      <td key={item.offer.id} className="text-right py-3 px-4 font-bold text-indigo-900">
                        {formatCurrency(item.tco.totalCost)}
                        {compareByContract && (
                          <span className="block text-xs font-normal text-indigo-700">
                            ({item.offer.duration_months} months)
                          </span>
                        )}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}

      {selectedOfferIds.length === 0 && (
        <Card className="text-center py-8">
          <svg className="mx-auto w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-gray-900">Select offers to compare</h3>
          <p className="mt-2 text-gray-500">
            Click on offers above to add them to the comparison.
          </p>
        </Card>
      )}
    </div>
  )
}
