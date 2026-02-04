'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, Button, Input, Select, useToast } from '@/components/ui'
import { EV_PRESETS, searchPresets, type EVPreset } from '@/lib/ev-presets'
import type { FuelType, CarInsert } from '@/types/database'
import { parseIntegerOrNull, parseNumberOrNull } from '@/lib/supabase/helpers'
import { getUserFriendlyError } from '@/lib/errors'

const fuelTypeOptions = [
  { value: 'bev', label: 'Electric (BEV)' },
  { value: 'petrol', label: 'Petrol' },
  { value: 'diesel', label: 'Diesel' },
  { value: 'hybrid', label: 'Hybrid' },
]

interface ValidationErrors {
  brand?: string
  model?: string
}

export default function NewCarPage() {
  const router = useRouter()
  const supabase = createClient()
  const toast = useToast()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({})

  // EV Preset search state
  const [searchQuery, setSearchQuery] = useState('')
  const [showPresets, setShowPresets] = useState(false)
  const [selectedPreset, setSelectedPreset] = useState<EVPreset | null>(null)

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

  // Filter presets based on search query
  const filteredPresets = useMemo(() => {
    if (!searchQuery) return EV_PRESETS.slice(0, 8) // Show first 8 by default
    return searchPresets(searchQuery)
  }, [searchQuery])

  const handlePresetSelect = (preset: EVPreset) => {
    setSelectedPreset(preset)
    setFormData({
      brand: preset.brand,
      model: preset.model,
      variant: preset.variant,
      fuel_type: preset.fuel_type,
      power_kw: preset.power_kw.toString(),
      co2_emissions: '',
      battery_kwh: preset.battery_kwh.toString(),
      consumption: preset.consumption.toString(),
    })
    setSearchQuery('')
    setShowPresets(false)
    setValidationErrors({})
  }

  const clearPreset = () => {
    setSelectedPreset(null)
    setFormData({
      brand: '',
      model: '',
      variant: '',
      fuel_type: 'bev',
      power_kw: '',
      co2_emissions: '',
      battery_kwh: '',
      consumption: '',
    })
  }

  const validate = (): boolean => {
    const errors: ValidationErrors = {}

    if (!formData.brand.trim()) {
      errors.brand = 'Brand is required'
    }
    if (!formData.model.trim()) {
      errors.model = 'Model is required'
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!validate()) {
      return
    }

    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setError('You must be logged in')
      setLoading(false)
      return
    }

    const carData: CarInsert = {
      user_id: user.id,
      brand: formData.brand.trim(),
      model: formData.model.trim(),
      variant: formData.variant.trim() || null,
      fuel_type: formData.fuel_type,
      power_kw: parseIntegerOrNull(formData.power_kw),
      co2_emissions: parseIntegerOrNull(formData.co2_emissions),
      battery_kwh: parseNumberOrNull(formData.battery_kwh),
      consumption: parseNumberOrNull(formData.consumption),
    }

    const { error: insertError } = await supabase.from('cars').insert(carData)

    if (insertError) {
      setError(getUserFriendlyError(insertError))
      setLoading(false)
    } else {
      toast.success('Car added successfully')
      router.push('/cars')
      router.refresh()
    }
  }

  const isBEV = formData.fuel_type === 'bev'

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Add New Car</h1>
        <p className="mt-1 text-gray-600">
          Enter the details of the car you want to compare
        </p>
      </div>

      {/* EV Quick Select */}
      <Card className="mb-6 bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-2xl">⚡</span>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Quick Select EV</h2>
            <p className="text-sm text-gray-600">Search for a BYD model to auto-fill specifications</p>
          </div>
        </div>

        {selectedPreset ? (
          <div className="flex items-center justify-between bg-white rounded-lg p-3 border border-indigo-200">
            <div>
              <p className="font-medium text-gray-900">
                {selectedPreset.brand} {selectedPreset.model}
              </p>
              <p className="text-sm text-gray-500">{selectedPreset.variant}</p>
            </div>
            <Button variant="secondary" size="sm" onClick={clearPreset}>
              Clear
            </Button>
          </div>
        ) : (
          <div className="relative">
            <Input
              id="ev-search"
              placeholder="Search BYD Atto 3, Dolphin, Seal..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setShowPresets(true)
              }}
              onFocus={() => setShowPresets(true)}
            />
            {showPresets && (
              <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                {filteredPresets.length === 0 ? (
                  <div className="p-3 text-sm text-gray-500">No matching EVs found</div>
                ) : (
                  filteredPresets.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handlePresetSelect(preset)}
                      className="w-full text-left px-4 py-3 hover:bg-indigo-50 border-b border-gray-100 last:border-b-0 transition-colors"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-gray-900">
                            {preset.brand} {preset.model}
                          </p>
                          <p className="text-sm text-gray-500">{preset.variant}</p>
                        </div>
                        <div className="text-right text-sm">
                          <p className="text-indigo-600 font-medium">{preset.battery_kwh} kWh</p>
                          <p className="text-gray-400">{preset.power_kw} kW</p>
                        </div>
                      </div>
                    </button>
                  ))
                )}
                <button
                  type="button"
                  onClick={() => setShowPresets(false)}
                  className="w-full text-center py-2 text-sm text-gray-500 hover:text-gray-700 bg-gray-50"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Manual Entry Form */}
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
              onChange={(e) => {
                setFormData({ ...formData, brand: e.target.value })
                if (validationErrors.brand) {
                  setValidationErrors({ ...validationErrors, brand: undefined })
                }
              }}
              error={validationErrors.brand}
            />
            <Input
              id="model"
              label="Model"
              placeholder="e.g., ID.4"
              required
              value={formData.model}
              onChange={(e) => {
                setFormData({ ...formData, model: e.target.value })
                if (validationErrors.model) {
                  setValidationErrors({ ...validationErrors, model: undefined })
                }
              }}
              error={validationErrors.model}
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
              {loading ? 'Saving...' : 'Add Car'}
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
