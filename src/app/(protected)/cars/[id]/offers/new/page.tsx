'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, Button, Input, Select, useToast, KeyValueInput } from '@/components/ui'
import type { OfferType, OfferInsert } from '@/types/database'
import { parseNumber, parseInteger, parseNumberOrNull } from '@/lib/supabase/helpers'
import { getUserFriendlyError } from '@/lib/errors'

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
  other_fees: Record<string, number>
  residual_value: string
  financing_rate: string
  notes: string
}

interface ValidationErrors {
  name?: string
  monthly_payment?: string
  duration_months?: string
  km_per_year?: string
}

export default function NewOfferPage() {
  const { id: carId } = useParams<{ id: string }>()
  const router = useRouter()
  const supabase = createClient()
  const toast = useToast()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({})

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
    other_fees: {},
    residual_value: '',
    financing_rate: '',
    notes: '',
  })

  const validate = (): boolean => {
    const errors: ValidationErrors = {}

    if (!formData.name.trim()) {
      errors.name = 'Offer name is required'
    }

    const monthlyPayment = parseFloat(formData.monthly_payment)
    if (!formData.monthly_payment || isNaN(monthlyPayment)) {
      errors.monthly_payment = 'Monthly payment is required'
    } else if (monthlyPayment <= 0) {
      errors.monthly_payment = 'Monthly payment must be greater than 0'
    }

    const duration = parseInt(formData.duration_months)
    if (!formData.duration_months || isNaN(duration)) {
      errors.duration_months = 'Contract duration is required'
    } else if (duration < 1 || duration > 120) {
      errors.duration_months = 'Duration must be between 1 and 120 months'
    }

    const kmPerYear = parseInt(formData.km_per_year)
    if (!formData.km_per_year || isNaN(kmPerYear)) {
      errors.km_per_year = 'Included km/year is required'
    } else if (kmPerYear < 1000 || kmPerYear > 100000) {
      errors.km_per_year = 'km/year must be between 1,000 and 100,000'
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async () => {
    setError(null)

    if (!validate()) {
      // Navigate to step with errors
      if (validationErrors.name) {
        setStep(1)
      } else if (validationErrors.monthly_payment || validationErrors.duration_months || validationErrors.km_per_year) {
        setStep(2)
      }
      return
    }

    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setError('You must be logged in')
      setLoading(false)
      return
    }

    const offerData: OfferInsert = {
      car_id: carId,
      user_id: user.id,
      type: formData.type,
      name: formData.name.trim(),
      source_url: formData.source_url.trim() || null,
      source_name: formData.source_name.trim() || null,
      monthly_payment: parseNumber(formData.monthly_payment),
      down_payment: parseNumber(formData.down_payment),
      duration_months: parseInteger(formData.duration_months),
      km_per_year: parseInteger(formData.km_per_year),
      excess_km_cost: parseNumberOrNull(formData.excess_km_cost),
      includes_insurance: formData.includes_insurance,
      includes_maintenance: formData.includes_maintenance,
      includes_tax: formData.includes_tax,
      includes_tires: formData.includes_tires,
      transfer_fee: parseNumber(formData.transfer_fee),
      other_fees: formData.other_fees,
      residual_value: parseNumberOrNull(formData.residual_value),
      financing_rate: parseNumberOrNull(formData.financing_rate),
      notes: formData.notes.trim() || null,
    }

    const { error: insertError } = await supabase.from('offers').insert(offerData)

    if (insertError) {
      setError(getUserFriendlyError(insertError))
      setLoading(false)
    } else {
      toast.success('Offer added successfully')
      router.push(`/cars/${carId}`)
      router.refresh()
    }
  }

  const clearFieldError = (field: keyof ValidationErrors) => {
    if (validationErrors[field]) {
      setValidationErrors({ ...validationErrors, [field]: undefined })
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Add New Offer</h1>
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
                onChange={(e) => {
                  setFormData({ ...formData, name: e.target.value })
                  clearFieldError('name')
                }}
                hint="Give this offer a memorable name"
                error={validationErrors.name}
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
                onChange={(e) => {
                  setFormData({ ...formData, monthly_payment: e.target.value })
                  clearFieldError('monthly_payment')
                }}
                error={validationErrors.monthly_payment}
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
                  onChange={(e) => {
                    setFormData({ ...formData, duration_months: e.target.value })
                    clearFieldError('duration_months')
                  }}
                  error={validationErrors.duration_months}
                />
                <Input
                  id="km_per_year"
                  label="Included km/year"
                  type="number"
                  placeholder="10000"
                  required
                  value={formData.km_per_year}
                  onChange={(e) => {
                    setFormData({ ...formData, km_per_year: e.target.value })
                    clearFieldError('km_per_year')
                  }}
                  error={validationErrors.km_per_year}
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

              <KeyValueInput
                label="Other One-Time Fees"
                hint="Add registration fees, processing fees, etc."
                value={formData.other_fees}
                onChange={(fees) => setFormData({ ...formData, other_fees: fees })}
              />
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
              variant="secondary"
              onClick={() => router.back()}
            >
              Cancel
            </Button>

            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? 'Saving...' : 'Save Offer'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
