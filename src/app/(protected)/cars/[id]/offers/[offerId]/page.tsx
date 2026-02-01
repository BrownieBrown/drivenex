import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Card, Button } from '@/components/ui'
import DeleteOfferButton from './DeleteOfferButton'
import type { Offer, Car, RunningCosts } from '@/types/database'
import {
  calculateFuelCostYearly,
  calculateKfzSteuer,
  getDefaultMaintenance,
  formatCurrency,
} from '@/lib/calculations'
import { DEFAULT_TIRE_COSTS } from '@/lib/constants'

const offerTypeLabels: Record<string, string> = {
  lease: 'Leasing',
  buy: 'Purchase',
  subscription: 'Subscription',
}

export default async function OfferDetailPage({
  params,
}: {
  params: Promise<{ id: string; offerId: string }>
}) {
  const { id: carId, offerId } = await params
  const supabase = await createClient()

  const [{ data: offerData }, { data: carData }, { data: runningCostsData }] = await Promise.all([
    supabase.from('offers').select('*').eq('id', offerId).single(),
    supabase.from('cars').select('*').eq('id', carId).single(),
    supabase.from('running_costs').select('*').eq('offer_id', offerId).single(),
  ])

  if (!offerData || !carData) {
    notFound()
  }

  const offer = offerData as unknown as Offer
  const car = carData as unknown as Car
  const runningCosts = runningCostsData as unknown as RunningCosts | null

  const totalContractCost =
    (offer.monthly_payment * offer.duration_months) +
    offer.down_payment +
    offer.transfer_fee

  // Calculate estimated running costs
  const yearlyFuelCost = calculateFuelCostYearly(car, offer.km_per_year, runningCosts)
  const yearlyTax = offer.includes_tax ? 0 : calculateKfzSteuer(car)
  const yearlyMaintenance = offer.includes_maintenance
    ? 0
    : (runningCosts?.maintenance_yearly ?? getDefaultMaintenance(car.fuel_type))
  const yearlyTires = offer.includes_tires
    ? 0
    : (runningCosts?.tire_costs ?? DEFAULT_TIRE_COSTS)

  // Insurance: use configured value, or estimate 1200€/year as default (SF10)
  // For new drivers (SF0), this could be 2000€+
  const DEFAULT_INSURANCE = 1200
  const yearlyInsurance = offer.includes_insurance
    ? 0
    : (runningCosts?.insurance_yearly ?? DEFAULT_INSURANCE)

  const yearlyRunningCosts = yearlyFuelCost + yearlyTax + yearlyMaintenance + yearlyTires + yearlyInsurance
  const monthlyRunningCosts = yearlyRunningCosts / 12
  const trueMonthlyTotal = offer.monthly_payment + monthlyRunningCosts
  const hasCustomRunningCosts = runningCosts !== null

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center text-sm text-gray-500">
        <Link href="/cars" className="hover:text-gray-700">Cars</Link>
        <svg className="w-4 h-4 mx-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        <Link href={`/cars/${carId}`} className="hover:text-gray-700">
          {car.brand} {car.model}
        </Link>
        <svg className="w-4 h-4 mx-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        <span className="text-gray-900">{offer.name}</span>
      </nav>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              offer.type === 'lease' ? 'bg-indigo-100 text-indigo-800' :
              offer.type === 'buy' ? 'bg-green-100 text-green-800' :
              'bg-purple-100 text-purple-800'
            }`}>
              {offerTypeLabels[offer.type]}
            </span>
            <h1 className="text-2xl font-bold text-gray-900">{offer.name}</h1>
          </div>
          {offer.source_name && (
            <p className="mt-1 text-gray-500">from {offer.source_name}</p>
          )}
        </div>
        <div className="flex gap-2">
          {offer.source_url && (
            <a
              href={offer.source_url}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="secondary">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                View Original
              </Button>
            </a>
          )}
          <Link href={`/cars/${carId}/offers/${offerId}/edit`}>
            <Button variant="secondary">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit
            </Button>
          </Link>
          <DeleteOfferButton carId={carId} offerId={offerId} />
        </div>
      </div>

      {/* Offer Link Card */}
      {offer.source_url && (
        <Card className="bg-indigo-50 border-indigo-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-indigo-900">Offer Link</p>
              <a
                href={offer.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-600 hover:text-indigo-800 text-sm break-all"
              >
                {offer.source_url}
              </a>
            </div>
            <a
              href={offer.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-shrink-0 ml-4"
            >
              <Button size="sm">
                Open Link
              </Button>
            </a>
          </div>
        </Card>
      )}

      {/* Cost Summary */}
      <Card>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Cost Summary</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div>
            <p className="text-sm text-gray-500">Monthly Payment</p>
            <p className="text-2xl font-bold text-gray-900">{offer.monthly_payment.toFixed(2)} EUR</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Down Payment</p>
            <p className="text-xl font-semibold text-gray-900">{offer.down_payment.toFixed(2)} EUR</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Transfer Fee</p>
            <p className="text-xl font-semibold text-gray-900">{offer.transfer_fee.toFixed(2)} EUR</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Total Contract Cost</p>
            <p className="text-xl font-semibold text-indigo-600">{totalContractCost.toFixed(2)} EUR</p>
          </div>
        </div>
      </Card>

      {/* Contract Details */}
      <Card>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Contract Details</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div>
            <p className="text-sm text-gray-500">Duration</p>
            <p className="font-medium text-gray-900">{offer.duration_months} months</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Included km/year</p>
            <p className="font-medium text-gray-900">{offer.km_per_year.toLocaleString()} km</p>
          </div>
          {offer.excess_km_cost && (
            <div>
              <p className="text-sm text-gray-500">Excess km Cost</p>
              <p className="font-medium text-gray-900">{offer.excess_km_cost.toFixed(2)} EUR/km</p>
            </div>
          )}
          {offer.residual_value && (
            <div>
              <p className="text-sm text-gray-500">Residual Value</p>
              <p className="font-medium text-gray-900">{offer.residual_value.toFixed(2)} EUR</p>
            </div>
          )}
          {offer.financing_rate && (
            <div>
              <p className="text-sm text-gray-500">Financing Rate</p>
              <p className="font-medium text-gray-900">{offer.financing_rate}%</p>
            </div>
          )}
        </div>
      </Card>

      {/* What's Included */}
      <Card>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">What&apos;s Included</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className={`flex items-center p-3 rounded-lg ${offer.includes_insurance ? 'bg-green-50' : 'bg-gray-50'}`}>
            {offer.includes_insurance ? (
              <svg className="w-5 h-5 text-green-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
            <span className={offer.includes_insurance ? 'text-green-800' : 'text-gray-500'}>
              Insurance
            </span>
          </div>
          <div className={`flex items-center p-3 rounded-lg ${offer.includes_maintenance ? 'bg-green-50' : 'bg-gray-50'}`}>
            {offer.includes_maintenance ? (
              <svg className="w-5 h-5 text-green-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
            <span className={offer.includes_maintenance ? 'text-green-800' : 'text-gray-500'}>
              Maintenance
            </span>
          </div>
          <div className={`flex items-center p-3 rounded-lg ${offer.includes_tax ? 'bg-green-50' : 'bg-gray-50'}`}>
            {offer.includes_tax ? (
              <svg className="w-5 h-5 text-green-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
            <span className={offer.includes_tax ? 'text-green-800' : 'text-gray-500'}>
              Vehicle Tax
            </span>
          </div>
          <div className={`flex items-center p-3 rounded-lg ${offer.includes_tires ? 'bg-green-50' : 'bg-gray-50'}`}>
            {offer.includes_tires ? (
              <svg className="w-5 h-5 text-green-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
            <span className={offer.includes_tires ? 'text-green-800' : 'text-gray-500'}>
              Tires
            </span>
          </div>
        </div>
      </Card>

      {/* Estimated Running Costs */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Estimated Running Costs</h2>
          {!hasCustomRunningCosts && (
            <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">Using estimates</span>
          )}
        </div>
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-500">
                {car.fuel_type === 'bev' ? 'Electricity' : 'Fuel'} / year
              </p>
              <p className="font-medium text-gray-900">{formatCurrency(yearlyFuelCost)}</p>
              {car.consumption && (
                <p className="text-xs text-gray-400">
                  {car.consumption} {car.fuel_type === 'bev' ? 'kWh' : 'L'}/100km × {(offer.km_per_year / 100).toLocaleString()}
                </p>
              )}
            </div>
            <div>
              <p className="text-sm text-gray-500">Insurance / year</p>
              <p className={`font-medium ${offer.includes_insurance ? 'text-green-600' : 'text-gray-900'}`}>
                {offer.includes_insurance ? 'Included' : formatCurrency(yearlyInsurance)}
              </p>
              {!offer.includes_insurance && !runningCosts?.insurance_yearly && (
                <p className="text-xs text-amber-500">Estimate - add actual cost</p>
              )}
            </div>
            <div>
              <p className="text-sm text-gray-500">Vehicle Tax / year</p>
              <p className={`font-medium ${offer.includes_tax ? 'text-green-600' : 'text-gray-900'}`}>
                {offer.includes_tax ? 'Included' : formatCurrency(yearlyTax)}
              </p>
              {car.fuel_type === 'bev' && !offer.includes_tax && (
                <p className="text-xs text-gray-400">BEV tax-free until 2030</p>
              )}
            </div>
            <div>
              <p className="text-sm text-gray-500">Maintenance / year</p>
              <p className={`font-medium ${offer.includes_maintenance ? 'text-green-600' : 'text-gray-900'}`}>
                {offer.includes_maintenance ? 'Included' : formatCurrency(yearlyMaintenance)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Tires / year</p>
              <p className={`font-medium ${offer.includes_tires ? 'text-green-600' : 'text-gray-900'}`}>
                {offer.includes_tires ? 'Included' : formatCurrency(yearlyTires)}
              </p>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-500">Additional costs / month</p>
                <p className="text-xs text-gray-400">(on top of monthly payment)</p>
              </div>
              <p className="text-lg font-semibold text-gray-900">{formatCurrency(monthlyRunningCosts)}</p>
            </div>
          </div>

          <div className="bg-indigo-50 rounded-lg p-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium text-indigo-900">True Monthly Cost</p>
                <p className="text-sm text-indigo-700">Payment + Running Costs</p>
              </div>
              <p className="text-2xl font-bold text-indigo-900">{formatCurrency(trueMonthlyTotal)}</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Notes */}
      {offer.notes && (
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Notes</h2>
          <p className="text-gray-600 whitespace-pre-wrap">{offer.notes}</p>
        </Card>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <Link href={`/cars/${carId}/offers/${offerId}/running-costs`}>
          <Button>
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            Add Running Costs
          </Button>
        </Link>
        <Link href={`/compare?offers=${offerId}`}>
          <Button variant="secondary">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Compare This Offer
          </Button>
        </Link>
      </div>
    </div>
  )
}
