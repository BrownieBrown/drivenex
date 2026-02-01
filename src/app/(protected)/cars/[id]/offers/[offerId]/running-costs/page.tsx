'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, Button, Input } from '@/components/ui'
import type { Car, Offer, RunningCosts } from '@/types/database'

const SF_KLASSE_DISCOUNTS: Record<number, number> = {
  0: 230,
  0.5: 200,
  1: 140,
  2: 130,
  3: 120,
  4: 110,
  5: 100,
  6: 95,
  7: 85,
  8: 80,
  9: 75,
  10: 70,
  15: 55,
  20: 45,
  25: 40,
  30: 35,
  35: 30,
}

export default function RunningCostsPage() {
  const { id: carId, offerId } = useParams<{ id: string; offerId: string }>()
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [car, setCar] = useState<Car | null>(null)
  const [offer, setOffer] = useState<Offer | null>(null)
  const [existingCosts, setExistingCosts] = useState<RunningCosts | null>(null)

  const [formData, setFormData] = useState({
    insurance_yearly: '',
    sf_klasse: '0',
    fuel_price: '',
    electricity_price: '',
    maintenance_yearly: '',
    tire_costs: '',
  })

  useEffect(() => {
    const fetchData = async () => {
      const [{ data: carData }, { data: offerData }, { data: costsData }] = await Promise.all([
        supabase.from('cars').select('*').eq('id', carId).single(),
        supabase.from('offers').select('*').eq('id', offerId).single(),
        supabase.from('running_costs').select('*').eq('offer_id', offerId).single(),
      ])

      const typedCar = carData as Car | null
      const typedOffer = offerData as Offer | null
      const typedCosts = costsData as RunningCosts | null

      if (typedCar) setCar(typedCar)
      if (typedOffer) setOffer(typedOffer)
      if (typedCosts) {
        setExistingCosts(typedCosts)
        setFormData({
          insurance_yearly: typedCosts.insurance_yearly?.toString() || '',
          sf_klasse: typedCosts.sf_klasse?.toString() || '0',
          fuel_price: typedCosts.fuel_price?.toString() || '',
          electricity_price: typedCosts.electricity_price?.toString() || '',
          maintenance_yearly: typedCosts.maintenance_yearly?.toString() || '',
          tire_costs: typedCosts.tire_costs?.toString() || '',
        })
      } else if (typedCar) {
        // Set defaults based on car type
        const isBEV = typedCar.fuel_type === 'bev'
        setFormData({
          insurance_yearly: '',
          sf_klasse: '0',
          fuel_price: isBEV ? '' : '1.75',
          electricity_price: isBEV ? '0.30' : '',
          maintenance_yearly: isBEV ? '200' : '400',
          tire_costs: '300',
        })
      }
    }
    fetchData()
  }, [carId, offerId, supabase])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const data = {
      offer_id: offerId,
      insurance_yearly: parseFloat(formData.insurance_yearly),
      sf_klasse: parseInt(formData.sf_klasse),
      fuel_price: formData.fuel_price ? parseFloat(formData.fuel_price) : null,
      electricity_price: formData.electricity_price ? parseFloat(formData.electricity_price) : null,
      maintenance_yearly: parseFloat(formData.maintenance_yearly) || 0,
      tire_costs: parseFloat(formData.tire_costs) || 0,
    }

    let result
    if (existingCosts) {
      result = await supabase
        .from('running_costs')
        .update(data as never)
        .eq('id', existingCosts.id)
    } else {
      result = await supabase.from('running_costs').insert(data as never)
    }

    if (result.error) {
      setError(result.error.message)
      setLoading(false)
    } else {
      router.push(`/cars/${carId}/offers/${offerId}`)
      router.refresh()
    }
  }

  if (!car || !offer) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  const isBEV = car.fuel_type === 'bev'
  const sfKlasse = parseInt(formData.sf_klasse)
  const sfDiscount = SF_KLASSE_DISCOUNTS[sfKlasse] || SF_KLASSE_DISCOUNTS[Math.min(sfKlasse, 35)]

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          {existingCosts ? 'Edit' : 'Add'} Running Costs
        </h1>
        <p className="mt-1 text-gray-600">
          For {offer.name} ({car.brand} {car.model})
        </p>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Skip if included */}
          {offer.includes_insurance && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm text-green-800">
                Insurance is included in this offer. You can skip the insurance section or enter costs for comparison purposes.
              </p>
            </div>
          )}

          {/* Insurance */}
          <div className="space-y-4">
            <h3 className="font-medium text-gray-900">Insurance</h3>

            <Input
              id="insurance_yearly"
              label="Yearly Insurance Premium (EUR)"
              type="number"
              step="0.01"
              placeholder="e.g., 800"
              required={!offer.includes_insurance}
              value={formData.insurance_yearly}
              onChange={(e) => setFormData({ ...formData, insurance_yearly: e.target.value })}
              hint="Your current or quoted annual premium"
            />

            <div>
              <label htmlFor="sf_klasse" className="block text-sm font-medium text-gray-700 mb-1">
                SF-Klasse (No-Claims Class)
              </label>
              <select
                id="sf_klasse"
                value={formData.sf_klasse}
                onChange={(e) => setFormData({ ...formData, sf_klasse: e.target.value })}
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="0">SF 0 (New driver / after accident)</option>
                <option value="1">SF 1 (1 claim-free year)</option>
                <option value="2">SF 2 (2 claim-free years)</option>
                <option value="3">SF 3 (3 claim-free years)</option>
                <option value="4">SF 4 (4 claim-free years)</option>
                <option value="5">SF 5 (5 claim-free years)</option>
                <option value="6">SF 6</option>
                <option value="7">SF 7</option>
                <option value="8">SF 8</option>
                <option value="9">SF 9</option>
                <option value="10">SF 10</option>
                <option value="15">SF 15</option>
                <option value="20">SF 20</option>
                <option value="25">SF 25</option>
                <option value="30">SF 30</option>
                <option value="35">SF 35+</option>
              </select>
              <p className="mt-1 text-sm text-gray-500">
                Typical rate: ~{sfDiscount}% of base premium. Each claim-free year reduces your rate.
              </p>
            </div>
          </div>

          {/* Fuel/Electricity */}
          <div className="space-y-4">
            <h3 className="font-medium text-gray-900">Fuel / Electricity</h3>

            {isBEV ? (
              <Input
                id="electricity_price"
                label="Electricity Price (EUR/kWh)"
                type="number"
                step="0.01"
                placeholder="0.30"
                value={formData.electricity_price}
                onChange={(e) => setFormData({ ...formData, electricity_price: e.target.value })}
                hint="Avg. home charging: ~0.30 EUR, public: ~0.50 EUR"
              />
            ) : (
              <Input
                id="fuel_price"
                label={`Fuel Price (EUR/L) - ${car.fuel_type === 'diesel' ? 'Diesel' : 'Petrol'}`}
                type="number"
                step="0.01"
                placeholder={car.fuel_type === 'diesel' ? '1.65' : '1.75'}
                value={formData.fuel_price}
                onChange={(e) => setFormData({ ...formData, fuel_price: e.target.value })}
              />
            )}

            {car.consumption && (
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">
                  With {car.consumption} {isBEV ? 'kWh' : 'L'}/100km and {offer.km_per_year.toLocaleString()} km/year:
                </p>
                <p className="text-lg font-medium text-gray-900 mt-1">
                  ~{calculateYearlyFuelCost(
                    car.consumption,
                    offer.km_per_year,
                    isBEV
                      ? parseFloat(formData.electricity_price) || 0.30
                      : parseFloat(formData.fuel_price) || 1.75
                  ).toFixed(0)} EUR/year in {isBEV ? 'electricity' : 'fuel'}
                </p>
              </div>
            )}
          </div>

          {/* Maintenance */}
          {!offer.includes_maintenance && (
            <div className="space-y-4">
              <h3 className="font-medium text-gray-900">Maintenance</h3>

              <Input
                id="maintenance_yearly"
                label="Yearly Maintenance (EUR)"
                type="number"
                step="0.01"
                placeholder={isBEV ? '200' : '400'}
                value={formData.maintenance_yearly}
                onChange={(e) => setFormData({ ...formData, maintenance_yearly: e.target.value })}
                hint={`Typical for ${isBEV ? 'EVs' : 'combustion cars'}: ${isBEV ? '150-300' : '300-600'} EUR/year`}
              />
            </div>
          )}

          {/* Tires */}
          <div className="space-y-4">
            <h3 className="font-medium text-gray-900">Tires</h3>

            <Input
              id="tire_costs"
              label="Yearly Tire Costs (EUR)"
              type="number"
              step="0.01"
              placeholder="300"
              value={formData.tire_costs}
              onChange={(e) => setFormData({ ...formData, tire_costs: e.target.value })}
              hint="Include winter tire storage, replacement reserves"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Save Running Costs'}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => router.back()}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}

function calculateYearlyFuelCost(
  consumption: number,
  kmPerYear: number,
  pricePerUnit: number
): number {
  return (consumption / 100) * kmPerYear * pricePerUnit
}
