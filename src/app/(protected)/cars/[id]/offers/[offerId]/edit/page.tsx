'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, Button, Input, Select } from '@/components/ui'
import type { OfferType, Offer } from '@/types/database'

const offerTypeOptions = [
  { value: 'lease', label: 'Leasing' },
  { value: 'buy', label: 'Purchase (Cash or Financed)' },
  { value: 'subscription', label: 'Subscription (e.g., FINN)' },
]

interface FormData {
  type: OfferType
  name: string
  source_url: string
  source_name: string
  monthly_payment: string
  down_payment: string
  duration_months: string
  km_per_year: string
  excess_km_cost: string
  includes_insurance: boolean
  includes_maintenance: boolean
  includes_tax: boolean
  includes_tires: boolean
  transfer_fee: string
  residual_value: string
  financing_rate: string
  notes: string
}

export default function EditOfferPage() {
  const { id: carId, offerId } = useParams<{ id: string; offerId: string }>()
  const router = useRouter()
  const supabase = createClient()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState<FormData>({
    type: 'lease',
    name: '',
    source_url: '',
    source_name: '',
    monthly_payment: '',
    down_payment: '0',
    duration_months: '24',
    km_per_year: '10000',
    excess_km_cost: '',
    includes_insurance: false,
    includes_maintenance: false,
    includes_tax: false,
    includes_tires: false,
    transfer_fee: '0',
    residual_value: '',
    financing_rate: '',
    notes: '',
  })

  useEffect(() => {
    async function fetchOffer() {
      const { data, error } = await supabase
        .from('offers')
        .select('*')
        .eq('id', offerId)
        .single()

      if (error) {
        setError('Failed to load offer')
        setInitialLoading(false)
        return
      }

      const offer = data as unknown as Offer
      setFormData({
        type: offer.type,
        name: offer.name,
        source_url: offer.source_url || '',
        source_name: offer.source_name || '',
        monthly_payment: offer.monthly_payment.toString(),
        down_payment: offer.down_payment.toString(),
        duration_months: offer.duration_months.toString(),
        km_per_year: offer.km_per_year.toString(),
        excess_km_cost: offer.excess_km_cost?.toString() || '',
        includes_insurance: offer.includes_insurance,
        includes_maintenance: offer.includes_maintenance,
        includes_tax: offer.includes_tax,
        includes_tires: offer.includes_tires || false,
        transfer_fee: offer.transfer_fee.toString(),
        residual_value: offer.residual_value?.toString() || '',
        financing_rate: offer.financing_rate?.toString() || '',
        notes: offer.notes || '',
      })
      setInitialLoading(false)
    }

    fetchOffer()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [offerId])

  const handleSubmit = async () => {
    setError(null)
    setLoading(true)

    const { error: updateError } = await supabase
      .from('offers')
      .update({
        type: formData.type,
        name: formData.name,
        source_url: formData.source_url || null,
        source_name: formData.source_name || null,
        monthly_payment: parseFloat(formData.monthly_payment),
        down_payment: parseFloat(formData.down_payment) || 0,
        duration_months: parseInt(formData.duration_months),
        km_per_year: parseInt(formData.km_per_year),
        excess_km_cost: formData.excess_km_cost ? parseFloat(formData.excess_km_cost) : null,
        includes_insurance: formData.includes_insurance,
        includes_maintenance: formData.includes_maintenance,
        includes_tax: formData.includes_tax,
        includes_tires: formData.includes_tires,
        transfer_fee: parseFloat(formData.transfer_fee) || 0,
        residual_value: formData.residual_value ? parseFloat(formData.residual_value) : null,
        financing_rate: formData.financing_rate ? parseFloat(formData.financing_rate) : null,
        notes: formData.notes || null,
      } as never)
      .eq('id', offerId)

    if (updateError) {
      setError(updateError.message)
      setLoading(false)
    } else {
      router.push(`/cars/${carId}/offers/${offerId}`)
      router.refresh()
    }
  }

  if (initialLoading) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card className="text-center py-12">
          <p className="text-gray-500">Loading offer...</p>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Edit Offer</h1>
        <p className="mt-1 text-gray-600">
          Step {step} of 3
        </p>
      </div>

      {/* Progress bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          {[1, 2, 3].map((s) => (
            <button
              key={s}
              onClick={() => setStep(s)}
              className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium cursor-pointer transition-colors ${
                s === step
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        <div className="h-2 bg-gray-200 rounded-full">
          <div
            className="h-2 bg-indigo-600 rounded-full transition-all"
            style={{ width: `${((step - 1) / 2) * 100}%` }}
          />
        </div>
        <div className="flex justify-between mt-2 text-xs text-gray-500">
          <button onClick={() => setStep(1)} className="hover:text-gray-700">Basic Info</button>
          <button onClick={() => setStep(2)} className="hover:text-gray-700">Pricing</button>
          <button onClick={() => setStep(3)} className="hover:text-gray-700">Details</button>
        </div>
      </div>

      <Card>
        <form onSubmit={(e) => e.preventDefault()}>
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-6">
              {error}
            </div>
          )}

          {/* Step 1: Basic Info */}
          {step === 1 && (
            <div className="space-y-6">
              <Select
                id="type"
                label="Offer Type"
                options={offerTypeOptions}
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as OfferType })}
              />

              <Input
                id="name"
                label="Offer Name"
                placeholder="e.g., VW Leasing Spring Deal"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                hint="Give this offer a memorable name"
              />

              <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                <label className="block text-sm font-medium text-indigo-900 mb-2">
                  Offer Link (Important!)
                </label>
                <Input
                  id="source_url"
                  type="url"
                  placeholder="https://..."
                  value={formData.source_url}
                  onChange={(e) => setFormData({ ...formData, source_url: e.target.value })}
                />
                <p className="mt-2 text-sm text-indigo-700">
                  Save the link to easily find this offer again later
                </p>
              </div>

              <Input
                id="source_name"
                label="Source/Dealer Name"
                placeholder="e.g., FINN, Mobile.de, Local VW Dealer"
                value={formData.source_name}
                onChange={(e) => setFormData({ ...formData, source_name: e.target.value })}
              />
            </div>
          )}

          {/* Step 2: Pricing */}
          {step === 2 && (
            <div className="space-y-6">
              <Input
                id="monthly_payment"
                label="Monthly Payment (EUR)"
                type="number"
                step="0.01"
                placeholder="e.g., 399"
                required
                value={formData.monthly_payment}
                onChange={(e) => setFormData({ ...formData, monthly_payment: e.target.value })}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  id="down_payment"
                  label="Down Payment (EUR)"
                  type="number"
                  step="0.01"
                  placeholder="0"
                  value={formData.down_payment}
                  onChange={(e) => setFormData({ ...formData, down_payment: e.target.value })}
                  hint={formData.type === 'lease' ? 'Anzahlung / Sonderzahlung' : 'Initial payment'}
                />
                <Input
                  id="transfer_fee"
                  label="Transfer Fee (EUR)"
                  type="number"
                  step="0.01"
                  placeholder="0"
                  value={formData.transfer_fee}
                  onChange={(e) => setFormData({ ...formData, transfer_fee: e.target.value })}
                  hint="Delivery/registration costs"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  id="duration_months"
                  label="Contract Duration (months)"
                  type="number"
                  placeholder="24"
                  required
                  value={formData.duration_months}
                  onChange={(e) => setFormData({ ...formData, duration_months: e.target.value })}
                />
                <Input
                  id="km_per_year"
                  label="Included km/year"
                  type="number"
                  placeholder="10000"
                  required
                  value={formData.km_per_year}
                  onChange={(e) => setFormData({ ...formData, km_per_year: e.target.value })}
                />
              </div>

              <Input
                id="excess_km_cost"
                label="Excess km Cost (EUR per km)"
                type="number"
                step="0.01"
                placeholder="e.g., 0.15"
                value={formData.excess_km_cost}
                onChange={(e) => setFormData({ ...formData, excess_km_cost: e.target.value })}
                hint="Cost charged for each km over the limit"
              />

              {formData.type === 'buy' && (
                <>
                  <Input
                    id="financing_rate"
                    label="Financing Rate (%)"
                    type="number"
                    step="0.01"
                    placeholder="e.g., 4.9"
                    value={formData.financing_rate}
                    onChange={(e) => setFormData({ ...formData, financing_rate: e.target.value })}
                    hint="Leave empty for cash purchase"
                  />
                  <Input
                    id="residual_value"
                    label="Expected Resale Value (EUR)"
                    type="number"
                    step="0.01"
                    placeholder="e.g., 25000"
                    value={formData.residual_value}
                    onChange={(e) => setFormData({ ...formData, residual_value: e.target.value })}
                    hint="Estimated value after contract period"
                  />
                </>
              )}

              {formData.type === 'lease' && (
                <Input
                  id="residual_value"
                  label="Residual Value (EUR)"
                  type="number"
                  step="0.01"
                  placeholder="Optional"
                  value={formData.residual_value}
                  onChange={(e) => setFormData({ ...formData, residual_value: e.target.value })}
                  hint="If this is a residual value lease"
                />
              )}
            </div>
          )}

          {/* Step 3: What's Included */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <p className="text-sm font-medium text-gray-700 mb-4">
                  What&apos;s included in the monthly payment?
                </p>
                <div className="space-y-3">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.includes_insurance}
                      onChange={(e) => setFormData({ ...formData, includes_insurance: e.target.checked })}
                      className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                    />
                    <span className="ml-3 text-gray-700">Insurance (Vollkasko/Haftpflicht)</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.includes_maintenance}
                      onChange={(e) => setFormData({ ...formData, includes_maintenance: e.target.checked })}
                      className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                    />
                    <span className="ml-3 text-gray-700">Maintenance & Repairs</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.includes_tax}
                      onChange={(e) => setFormData({ ...formData, includes_tax: e.target.checked })}
                      className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                    />
                    <span className="ml-3 text-gray-700">Vehicle Tax (Kfz-Steuer)</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.includes_tires}
                      onChange={(e) => setFormData({ ...formData, includes_tires: e.target.checked })}
                      className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                    />
                    <span className="ml-3 text-gray-700">Tires (Reifen- und Scheibenschutz)</span>
                  </label>
                </div>
              </div>

              {formData.type === 'subscription' && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <p className="text-sm text-purple-800">
                    Subscriptions like FINN typically include insurance, maintenance, tax, and tires.
                    Make sure to check what&apos;s covered in your specific offer.
                  </p>
                </div>
              )}

              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  id="notes"
                  rows={4}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Any additional details about this offer..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
            <Button
              type="button"
              variant="secondary"
              onClick={() => router.back()}
            >
              Cancel
            </Button>

            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
