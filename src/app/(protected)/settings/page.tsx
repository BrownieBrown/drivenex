'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, Button, Input } from '@/components/ui'
import {
  DEFAULT_ELECTRICITY_PRICE_HOME,
  DEFAULT_ELECTRICITY_PRICE_PUBLIC,
  DEFAULT_PETROL_PRICE,
  DEFAULT_DIESEL_PRICE,
  DEFAULT_KM_PER_YEAR,
} from '@/lib/constants'
import type { UserSettings } from '@/types/database'

export default function SettingsPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [settings, setSettings] = useState<UserSettings | null>(null)

  const [formData, setFormData] = useState({
    electricity_price_home: DEFAULT_ELECTRICITY_PRICE_HOME.toString(),
    electricity_price_public: DEFAULT_ELECTRICITY_PRICE_PUBLIC.toString(),
    petrol_price: DEFAULT_PETROL_PRICE.toString(),
    diesel_price: DEFAULT_DIESEL_PRICE.toString(),
    default_km_per_year: DEFAULT_KM_PER_YEAR.toString(),
  })

  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (data) {
        const settingsData = data as unknown as UserSettings
        setSettings(settingsData)
        setFormData({
          electricity_price_home: settingsData.electricity_price_home.toString(),
          electricity_price_public: settingsData.electricity_price_public.toString(),
          petrol_price: settingsData.petrol_price.toString(),
          diesel_price: settingsData.diesel_price.toString(),
          default_km_per_year: settingsData.default_km_per_year.toString(),
        })
      }
      setLoading(false)
    }
    fetchSettings()
  }, [supabase])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    setSaving(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setError('You must be logged in')
      setSaving(false)
      return
    }

    const data = {
      user_id: user.id,
      electricity_price_home: parseFloat(formData.electricity_price_home),
      electricity_price_public: parseFloat(formData.electricity_price_public),
      petrol_price: parseFloat(formData.petrol_price),
      diesel_price: parseFloat(formData.diesel_price),
      default_km_per_year: parseInt(formData.default_km_per_year),
    }

    let result
    if (settings) {
      result = await supabase
        .from('user_settings')
        .update(data as never)
        .eq('id', settings.id)
    } else {
      result = await supabase.from('user_settings').insert(data as never)
    }

    if (result.error) {
      setError(result.error.message)
    } else {
      setSuccess(true)
      router.refresh()
    }
    setSaving(false)
  }

  const resetToDefaults = () => {
    setFormData({
      electricity_price_home: DEFAULT_ELECTRICITY_PRICE_HOME.toString(),
      electricity_price_public: DEFAULT_ELECTRICITY_PRICE_PUBLIC.toString(),
      petrol_price: DEFAULT_PETROL_PRICE.toString(),
      diesel_price: DEFAULT_DIESEL_PRICE.toString(),
      default_km_per_year: DEFAULT_KM_PER_YEAR.toString(),
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="mt-1 text-gray-600">
          Configure default values for cost calculations
        </p>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-green-50 text-green-600 p-3 rounded-lg text-sm">
              Settings saved successfully!
            </div>
          )}

          {/* Electricity Prices */}
          <div>
            <h3 className="font-medium text-gray-900 mb-4">Electricity Prices</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                id="electricity_price_home"
                label="Home Charging (EUR/kWh)"
                type="number"
                step="0.01"
                placeholder="0.30"
                value={formData.electricity_price_home}
                onChange={(e) => setFormData({ ...formData, electricity_price_home: e.target.value })}
                hint="Your electricity rate at home"
              />
              <Input
                id="electricity_price_public"
                label="Public Charging (EUR/kWh)"
                type="number"
                step="0.01"
                placeholder="0.50"
                value={formData.electricity_price_public}
                onChange={(e) => setFormData({ ...formData, electricity_price_public: e.target.value })}
                hint="Average public charging station rate"
              />
            </div>
          </div>

          {/* Fuel Prices */}
          <div>
            <h3 className="font-medium text-gray-900 mb-4">Fuel Prices</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                id="petrol_price"
                label="Petrol (EUR/L)"
                type="number"
                step="0.01"
                placeholder="1.75"
                value={formData.petrol_price}
                onChange={(e) => setFormData({ ...formData, petrol_price: e.target.value })}
              />
              <Input
                id="diesel_price"
                label="Diesel (EUR/L)"
                type="number"
                step="0.01"
                placeholder="1.65"
                value={formData.diesel_price}
                onChange={(e) => setFormData({ ...formData, diesel_price: e.target.value })}
              />
            </div>
          </div>

          {/* Defaults */}
          <div>
            <h3 className="font-medium text-gray-900 mb-4">Default Values</h3>
            <Input
              id="default_km_per_year"
              label="Default km/year"
              type="number"
              placeholder="15000"
              value={formData.default_km_per_year}
              onChange={(e) => setFormData({ ...formData, default_km_per_year: e.target.value })}
              hint="Used as default when adding new offers"
            />
          </div>

          {/* German Defaults Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">German Tax Information</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Electric vehicles (BEV) are tax-free until 2030</li>
              <li>• Kfz-Steuer for combustion cars: based on CO2 emissions + displacement</li>
              <li>• TÜV/HU: ~100 EUR every 2 years (first inspection after 3 years for new cars)</li>
            </ul>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving...' : 'Save Settings'}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={resetToDefaults}
            >
              Reset to Defaults
            </Button>
          </div>
        </form>
      </Card>

      {/* Hidden Costs Checklist */}
      <Card className="mt-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Hidden Costs Checklist</h2>
        <p className="text-gray-600 mb-4">
          Don&apos;t forget these commonly overlooked costs when comparing offers:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            { name: 'Transfer/Delivery Fee', desc: 'Überführungskosten' },
            { name: 'Registration Fees', desc: 'Zulassungsgebühren' },
            { name: 'Processing Fees', desc: 'Bearbeitungsgebühren' },
            { name: 'Winter Tires', desc: 'Winterreifen' },
            { name: 'Wallbox Installation', desc: 'For EVs - home charging setup' },
            { name: 'Parking Permit', desc: 'Anwohnerparkausweis / Garage' },
            { name: 'Excess Mileage', desc: 'Mehrkilometer risk' },
            { name: 'Wear & Tear', desc: 'Minderwert bei Rückgabe' },
          ].map((item) => (
            <div key={item.name} className="flex items-start p-3 bg-gray-50 rounded-lg">
              <svg className="w-5 h-5 text-amber-500 mr-3 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <p className="font-medium text-gray-900">{item.name}</p>
                <p className="text-sm text-gray-500">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
