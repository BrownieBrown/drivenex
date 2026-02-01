import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Card, Button } from '@/components/ui'
import DeleteCarButton from './DeleteCarButton'
import OfferCard from './OfferCard'
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

  const car = carData as unknown as Car

  const { data: offersData } = await supabase
    .from('offers')
    .select('*')
    .eq('car_id', id)
    .order('created_at', { ascending: false })

  const offers = (offersData || []) as unknown as Offer[]

  const isBEV = car.fuel_type === 'bev'

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
          <DeleteCarButton carId={id} />
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
