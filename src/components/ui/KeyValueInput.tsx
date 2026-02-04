'use client'

import { useState } from 'react'
import Button from './Button'
import Input from './Input'

interface KeyValueInputProps {
  label: string
  hint?: string
  value: Record<string, number>
  onChange: (value: Record<string, number>) => void
  unitLabel?: string
}

export default function KeyValueInput({
  label,
  hint,
  value,
  onChange,
  unitLabel = 'EUR',
}: KeyValueInputProps) {
  const [newKey, setNewKey] = useState('')
  const [newValue, setNewValue] = useState('')

  const handleAdd = () => {
    const trimmedKey = newKey.trim()
    const parsedValue = parseFloat(newValue)

    if (trimmedKey && !isNaN(parsedValue) && parsedValue > 0) {
      onChange({ ...value, [trimmedKey]: parsedValue })
      setNewKey('')
      setNewValue('')
    }
  }

  const handleRemove = (key: string) => {
    const { [key]: _removed, ...rest } = value
    void _removed // Explicitly ignore the removed value
    onChange(rest)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAdd()
    }
  }

  const entries = Object.entries(value)
  const total = entries.reduce((sum, [, v]) => sum + v, 0)

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-sm font-medium text-gray-700">{label}</label>
        {hint && <p className="text-sm text-gray-500 mt-0.5">{hint}</p>}
      </div>

      {/* Existing entries */}
      {entries.length > 0 && (
        <div className="space-y-2">
          {entries.map(([k, v]) => (
            <div
              key={k}
              className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-900">{k}</span>
                <span className="text-sm text-gray-500">
                  {v.toFixed(2)} {unitLabel}
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleRemove(k)}
                className="text-red-500 hover:text-red-700 text-sm font-medium"
              >
                Remove
              </button>
            </div>
          ))}
          {entries.length > 1 && (
            <div className="flex justify-end text-sm text-gray-600 pt-1 border-t border-gray-200">
              Total: {total.toFixed(2)} {unitLabel}
            </div>
          )}
        </div>
      )}

      {/* Add new entry */}
      <div className="flex gap-2">
        <div className="flex-1">
          <Input
            id={`${label}-key`}
            placeholder="Name (e.g., Registration fee)"
            value={newKey}
            onChange={(e) => setNewKey(e.target.value)}
            onKeyPress={handleKeyPress}
          />
        </div>
        <div className="w-32">
          <Input
            id={`${label}-value`}
            type="number"
            step="0.01"
            placeholder="Amount"
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
            onKeyPress={handleKeyPress}
          />
        </div>
        <Button type="button" variant="secondary" onClick={handleAdd}>
          Add
        </Button>
      </div>
    </div>
  )
}
