import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Card, Button } from '@/components/ui'
import DeleteCarButton from './DeleteCarButton'
import OfferCard from './OfferCard'
import { findPresetForCar } from '@/lib/ev-presets'
import type { Car, Offer } from '@/types/database'

const fuelTypeLabels: Record<string, string> = {
  bev: 'Electric (BEV)',
  petrol: 'Petrol',
  diesel: 'Diesel',
  hybrid: 'Hybrid',
}

export default async function CarDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: carData } = await supabase
    .from('cars')
    .select('*')
    .eq('id', id)
    .single()

  if (!carData) {
    notFound()
  }

  const car = carData as Car

  const { data: offersData } = await supabase
    .from('offers')
    .select('*')
    .eq('car_id', id)
    .order('created_at', { ascending: false })

  const offers = (offersData ?? []) as Offer[]

  const isBEV = car.fuel_type === 'bev'
  const preset = findPresetForCar(car)

  // Generate star rating display
  const renderStars = (rating: number) => {
    const fullStars = Math.floor(rating / 2)
    const hasHalfStar = rating % 2 >= 1
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0)
    return (
      <span className="text-yellow-500">
        {'★'.repeat(fullStars)}
        {hasHalfStar && '½'}
        {'☆'.repeat(emptyStars)}
      </span>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="flex-shrink-0 w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center">
            <span className="text-3xl">
              {isBEV ? '⚡' : '⛽'}
            </span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {car.brand} {car.model}
            </h1>
            {car.variant && (
              <p className="text-gray-500">{car.variant}</p>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/cars/${id}/edit`}>
            <Button variant="secondary">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit
            </Button>
          </Link>
          <DeleteCarButton carId={id} carName={`${car.brand} ${car.model}`} />
        </div>
      </div>

      {/* Car Specs */}
      <Card>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Specifications</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-gray-500">Fuel Type</p>
            <p className="font-medium text-gray-900">{fuelTypeLabels[car.fuel_type]}</p>
          </div>
          {car.power_kw && (
            <div>
              <p className="text-sm text-gray-500">Power</p>
              <p className="font-medium text-gray-900">{car.power_kw} kW ({Math.round(car.power_kw * 1.36)} PS)</p>
            </div>
          )}
          {car.battery_kwh && (
            <div>
              <p className="text-sm text-gray-500">Battery</p>
              <p className="font-medium text-gray-900">{car.battery_kwh} kWh</p>
            </div>
          )}
          {car.consumption && (
            <div>
              <p className="text-sm text-gray-500">Consumption</p>
              <p className="font-medium text-gray-900">
                {car.consumption} {isBEV ? 'kWh/100km' : 'L/100km'}
              </p>
            </div>
          )}
          {car.co2_emissions && (
            <div>
              <p className="text-sm text-gray-500">CO2 Emissions</p>
              <p className="font-medium text-gray-900">{car.co2_emissions} g/km</p>
            </div>
          )}
        </div>
      </Card>

      {/* DRIVENEX Rating - Only shown for BEVs with a matching preset */}
      {isBEV && preset && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">DRIVENEX Rating</h2>
            <div className="flex items-center gap-2">
              {renderStars(preset.rating)}
              <span className="text-lg font-bold text-gray-900">{preset.rating.toFixed(1)}/10</span>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Pros */}
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Pros</h3>
              <ul className="space-y-2">
                {preset.pros.map((pro, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-gray-700">{pro}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Cons */}
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Cons</h3>
              <ul className="space-y-2">
                {preset.cons.map((con, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <span className="text-gray-700">{con}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Review link */}
          {preset.reviewUrl && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <a
                href={preset.reviewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-indigo-600 hover:text-indigo-800 font-medium"
              >
                Read full ADAC review
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
          )}
        </Card>
      )}

      {/* Offers */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">
          Offers ({offers?.length ?? 0})
        </h2>
        <Link href={`/cars/${id}/offers/new`}>
          <Button>
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Offer
          </Button>
        </Link>
      </div>

      {offers && offers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {offers.map((offer) => (
            <OfferCard key={offer.id} offer={offer} carId={id} />
          ))}
        </div>
      ) : (
        <Card className="text-center py-8">
          <svg className="mx-auto w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-gray-900">No offers yet</h3>
          <p className="mt-2 text-gray-500">
            Add leasing, purchase, or subscription offers to compare.
          </p>
          <div className="mt-4">
            <Link href={`/cars/${id}/offers/new`}>
              <Button>Add your first offer</Button>
            </Link>
          </div>
        </Card>
      )}
    </div>
  )
}
