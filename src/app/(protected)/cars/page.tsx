'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Card, Button, Modal, useToast } from '@/components/ui'
import { findPresetForCar } from '@/lib/ev-presets'
import { getUserFriendlyError } from '@/lib/errors'
import type { Car } from '@/types/database'

type CarWithOfferCount = Car & { offers: { count: number }[] }

const ITEMS_PER_PAGE = 12

const fuelTypeLabels: Record<string, string> = {
  bev: 'Electric (BEV)',
  petrol: 'Petrol',
  diesel: 'Diesel',
  hybrid: 'Hybrid',
}

export default function CarsPage() {
  const supabase = createClient()
  const toast = useToast()
  const [cars, setCars] = useState<CarWithOfferCount[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [selectMode, setSelectMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const fetchCars = useCallback(async () => {
    setLoading(true)
    const start = (page - 1) * ITEMS_PER_PAGE
    const end = start + ITEMS_PER_PAGE - 1

    const { data, count } = await supabase
      .from('cars')
      .select('*, offers(count)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(start, end)

    setCars((data ?? []) as CarWithOfferCount[])
    setTotalCount(count ?? 0)
    setLoading(false)
  }, [page, supabase])

  useEffect(() => {
    fetchCars()
  }, [fetchCars])

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE)

  const toggleSelect = (carId: string) => {
    setSelectedIds(prev =>
      prev.includes(carId)
        ? prev.filter(id => id !== carId)
        : [...prev, carId]
    )
  }

  const toggleSelectAll = () => {
    if (selectedIds.length === cars.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(cars.map(car => car.id))
    }
  }

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return
    setDeleting(true)

    const { error } = await supabase
      .from('cars')
      .delete()
      .in('id', selectedIds)

    if (error) {
      toast.error(getUserFriendlyError(error))
    } else {
      toast.success(`${selectedIds.length} car${selectedIds.length === 1 ? '' : 's'} deleted`)
      setSelectedIds([])
      setSelectMode(false)
      fetchCars()
    }
    setDeleting(false)
    setShowDeleteModal(false)
  }

  const exitSelectMode = () => {
    setSelectMode(false)
    setSelectedIds([])
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cars</h1>
          <p className="mt-1 text-gray-600">
            Manage the cars you want to compare
            {totalCount > 0 && ` (${totalCount} total)`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {selectMode ? (
            <>
              <Button variant="secondary" onClick={exitSelectMode}>
                Cancel
              </Button>
              <Button
                variant="secondary"
                onClick={toggleSelectAll}
              >
                {selectedIds.length === cars.length ? 'Deselect All' : 'Select All'}
              </Button>
              <Button
                onClick={() => setShowDeleteModal(true)}
                disabled={selectedIds.length === 0}
                className="bg-red-600 hover:bg-red-700"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete ({selectedIds.length})
              </Button>
            </>
          ) : (
            <>
              {cars.length > 0 && (
                <Button variant="secondary" onClick={() => setSelectMode(true)}>
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                  Select
                </Button>
              )}
              <Link href="/cars/new">
                <Button>
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Car
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleBulkDelete}
        title="Delete Cars"
        message={`Are you sure you want to delete ${selectedIds.length} car${selectedIds.length === 1 ? '' : 's'}? This will also delete all associated offers and running costs. This action cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        loading={deleting}
      />

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      ) : cars && cars.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cars.map((car) => {
              const offerCount = (car.offers as { count: number }[])?.[0]?.count ?? 0
              const preset = car.fuel_type === 'bev' ? findPresetForCar(car) : undefined
              const isSelected = selectedIds.includes(car.id)

              return (
                <div key={car.id} className="relative">
                  {selectMode && (
                    <button
                      onClick={() => toggleSelect(car.id)}
                      className={`absolute top-3 left-3 z-10 w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${
                        isSelected
                          ? 'bg-indigo-600 border-indigo-600 text-white'
                          : 'bg-white border-gray-300 hover:border-indigo-400'
                      }`}
                    >
                      {isSelected && (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                  )}
                  {selectMode ? (
                    <button
                      onClick={() => toggleSelect(car.id)}
                      className="w-full text-left"
                    >
                      <Card className={`h-full transition-all ${
                        isSelected ? 'ring-2 ring-indigo-500 bg-indigo-50' : 'hover:shadow-md'
                      }`}>
                        <CarCardContent car={car} offerCount={offerCount} preset={preset} selectMode={selectMode} />
                      </Card>
                    </button>
                  ) : (
                    <Link href={`/cars/${car.id}`}>
                      <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                        <CarCardContent car={car} offerCount={offerCount} preset={preset} selectMode={selectMode} />
                      </Card>
                    </Link>
                  )}
                </div>
              )
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <Button
                variant="secondary"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              <span className="text-sm text-gray-600 px-4">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="secondary"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </>
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

// Extracted card content component
function CarCardContent({
  car,
  offerCount,
  preset,
  selectMode,
}: {
  car: CarWithOfferCount
  offerCount: number
  preset: { rating: number } | undefined
  selectMode: boolean
}) {
  return (
    <>
      <div className="flex items-start justify-between">
        <div className={`flex-shrink-0 w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center ${selectMode ? 'ml-6' : ''}`}>
          <span className="text-2xl">
            {car.fuel_type === 'bev' ? '⚡' : '⛽'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {preset && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
              {preset.rating.toFixed(1)} ★
            </span>
          )}
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
            {offerCount} {offerCount === 1 ? 'offer' : 'offers'}
          </span>
        </div>
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
    </>
  )
}
