import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Card, Button } from '@/components/ui'
import type { Car } from '@/types/database'

type CarWithOfferCount = Car & { offers: { count: number }[] }

const fuelTypeLabels: Record<string, string> = {
  bev: 'Electric (BEV)',
  petrol: 'Petrol',
  diesel: 'Diesel',
  hybrid: 'Hybrid',
}

export default async function CarsPage() {
  const supabase = await createClient()

  const { data: carsData } = await supabase
    .from('cars')
    .select('*, offers(count)')
    .order('created_at', { ascending: false })

  const cars = (carsData || []) as unknown as CarWithOfferCount[]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cars</h1>
          <p className="mt-1 text-gray-600">
            Manage the cars you want to compare
          </p>
        </div>
        <Link href="/cars/new">
          <Button>
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Car
          </Button>
        </Link>
      </div>

      {cars && cars.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cars.map((car) => {
            const offerCount = (car.offers as { count: number }[])?.[0]?.count ?? 0
            return (
              <Link key={car.id} href={`/cars/${car.id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                  <div className="flex items-start justify-between">
                    <div className="flex-shrink-0 w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                      <span className="text-2xl">
                        {car.fuel_type === 'bev' ? '⚡' : '⛽'}
                      </span>
                    </div>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                      {offerCount} {offerCount === 1 ? 'offer' : 'offers'}
                    </span>
                  </div>

                  <div className="mt-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {car.brand} {car.model}
                    </h3>
                    {car.variant && (
                      <p className="text-sm text-gray-500">{car.variant}</p>
                    )}
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-700">
                      {fuelTypeLabels[car.fuel_type]}
                    </span>
                    {car.power_kw && (
                      <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-700">
                        {car.power_kw} kW
                      </span>
                    )}
                    {car.battery_kwh && (
                      <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-700">
                        {car.battery_kwh} kWh
                      </span>
                    )}
                  </div>
                </Card>
              </Link>
            )
          })}
        </div>
      ) : (
        <Card className="text-center py-12">
          <svg className="mx-auto w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-gray-900">No cars yet</h3>
          <p className="mt-2 text-gray-500">
            Add a car to start comparing offers.
          </p>
          <div className="mt-6">
            <Link href="/cars/new">
              <Button>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add your first car
              </Button>
            </Link>
          </div>
        </Card>
      )}
    </div>
  )
}
