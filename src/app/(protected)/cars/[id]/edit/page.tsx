'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, Button, Input, Select } from '@/components/ui'
import type { FuelType, Car, CarUpdate } from '@/types/database'
import { parseIntegerOrNull, parseNumberOrNull } from '@/lib/supabase/helpers'
import { getUserFriendlyError } from '@/lib/errors'

const fuelTypeOptions = [
  { value: 'bev', label: 'Electric (BEV)' },
  { value: 'petrol', label: 'Petrol' },
  { value: 'diesel', label: 'Diesel' },
  { value: 'hybrid', label: 'Hybrid' },
]

export default function EditCarPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [car, setCar] = useState<Car | null>(null)

  const [formData, setFormData] = useState({
    brand: '',
    model: '',
    variant: '',
    fuel_type: 'bev' as FuelType,
    power_kw: '',
    co2_emissions: '',
    battery_kwh: '',
    consumption: '',
  })

  useEffect(() => {
    const fetchCar = async () => {
      const { data } = await supabase
        .from('cars')
        .select('*')
        .eq('id', id)
        .single()

      if (data) {
        const carData = data as Car
        setCar(carData)
        setFormData({
          brand: carData.brand,
          model: carData.model,
          variant: carData.variant || '',
          fuel_type: carData.fuel_type,
          power_kw: carData.power_kw?.toString() || '',
          co2_emissions: carData.co2_emissions?.toString() || '',
          battery_kwh: carData.battery_kwh?.toString() || '',
          consumption: carData.consumption?.toString() || '',
        })
      }
    }
    fetchCar()
  }, [id, supabase])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const updateData: CarUpdate = {
      brand: formData.brand,
      model: formData.model,
      variant: formData.variant || null,
      fuel_type: formData.fuel_type,
      power_kw: parseIntegerOrNull(formData.power_kw),
      co2_emissions: parseIntegerOrNull(formData.co2_emissions),
      battery_kwh: parseNumberOrNull(formData.battery_kwh),
      consumption: parseNumberOrNull(formData.consumption),
    }

    const { error: updateError } = await supabase
      .from('cars')
      .update(updateData)
      .eq('id', id)

    if (updateError) {
      setError(getUserFriendlyError(updateError))
      setLoading(false)
    } else {
      router.push(`/cars/${id}`)
      router.refresh()
    }
  }

  if (!car) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  const isBEV = formData.fuel_type === 'bev'

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Edit Car</h1>
        <p className="mt-1 text-gray-600">
          Update the details of {car.brand} {car.model}
        </p>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              id="brand"
              label="Brand"
              placeholder="e.g., Volkswagen"
              required
              value={formData.brand}
              onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
            />
            <Input
              id="model"
              label="Model"
              placeholder="e.g., ID.4"
              required
              value={formData.model}
              onChange={(e) => setFormData({ ...formData, model: e.target.value })}
            />
          </div>

          <Input
            id="variant"
            label="Variant (optional)"
            placeholder="e.g., Pro Performance"
            value={formData.variant}
            onChange={(e) => setFormData({ ...formData, variant: e.target.value })}
          />

          <Select
            id="fuel_type"
            label="Fuel Type"
            options={fuelTypeOptions}
            value={formData.fuel_type}
            onChange={(e) => setFormData({ ...formData, fuel_type: e.target.value as FuelType })}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              id="power_kw"
              label="Power (kW)"
              type="number"
              placeholder="e.g., 150"
              value={formData.power_kw}
              onChange={(e) => setFormData({ ...formData, power_kw: e.target.value })}
            />
            {!isBEV && (
              <Input
                id="co2_emissions"
                label="CO2 Emissions (g/km)"
                type="number"
                placeholder="e.g., 120"
                hint="Used to calculate Kfz-Steuer"
                value={formData.co2_emissions}
                onChange={(e) => setFormData({ ...formData, co2_emissions: e.target.value })}
              />
            )}
          </div>

          {isBEV && (
            <Input
              id="battery_kwh"
              label="Battery Capacity (kWh)"
              type="number"
              step="0.1"
              placeholder="e.g., 77"
              value={formData.battery_kwh}
              onChange={(e) => setFormData({ ...formData, battery_kwh: e.target.value })}
            />
          )}

          <Input
            id="consumption"
            label={isBEV ? 'Consumption (kWh/100km)' : 'Consumption (L/100km)'}
            type="number"
            step="0.1"
            placeholder={isBEV ? 'e.g., 17.5' : 'e.g., 6.5'}
            hint="Used to calculate fuel/electricity costs"
            value={formData.consumption}
            onChange={(e) => setFormData({ ...formData, consumption: e.target.value })}
          />

          <div className="flex gap-3 pt-4">
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
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
