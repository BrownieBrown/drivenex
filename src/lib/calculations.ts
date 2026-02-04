import type { Car, Offer, RunningCosts } from '@/types/database'
import {
  KFZ_STEUER_CO2_THRESHOLD,
  TUV_COST,
  TUV_FIRST_INSPECTION_YEAR,
  SF_KLASSE_PERCENTAGES,
  DEFAULT_ELECTRICITY_PRICE_HOME,
  DEFAULT_PETROL_PRICE,
  DEFAULT_DIESEL_PRICE,
  DEFAULT_MAINTENANCE_BEV,
  DEFAULT_MAINTENANCE_PETROL,
  DEFAULT_MAINTENANCE_DIESEL,
  DEFAULT_MAINTENANCE_HYBRID,
  DEFAULT_TIRE_COSTS,
} from './constants'

export interface YearlyCost {
  year: number
  monthlyPayment: number
  fuelCost: number
  insurance: number
  tax: number
  maintenance: number
  tires: number
  tuv: number
  otherCosts: number
  total: number
  cumulative: number
}

export interface TCOResult {
  yearlyCosts: YearlyCost[]
  totalCost: number
  averageMonthly: number
  upfrontCosts: number
  contractCosts: number
  runningCosts: number
}

export function calculateKfzSteuer(car: Car): number {
  // BEVs are tax-free until 2030
  if (car.fuel_type === 'bev') {
    return 0
  }

  // If no CO2 data, estimate based on fuel type
  const co2 = car.co2_emissions || 150

  // Base component (we don't have displacement, so skip this)
  // CO2 component
  const co2Above95 = Math.max(0, co2 - KFZ_STEUER_CO2_THRESHOLD)
  const co2Tax = co2Above95 * 2 // Simplified: 2 EUR per g/km above 95

  // Minimum tax
  return Math.max(co2Tax, 16)
}

// Valid SF-Klasse levels (some gaps exist in the progression)
const SF_KLASSE_LEVELS = [0, 0.5, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 25, 30, 35]

/**
 * Get the next SF-Klasse level after a claim-free year
 */
export function getNextSfKlasse(current: number): number {
  const currentIndex = SF_KLASSE_LEVELS.indexOf(current)
  if (currentIndex === -1) {
    // If current level not found, find nearest lower level
    const nearestLower = SF_KLASSE_LEVELS.filter(l => l <= current).pop() ?? 0
    const nearestIndex = SF_KLASSE_LEVELS.indexOf(nearestLower)
    return SF_KLASSE_LEVELS[Math.min(nearestIndex + 1, SF_KLASSE_LEVELS.length - 1)]
  }
  return SF_KLASSE_LEVELS[Math.min(currentIndex + 1, SF_KLASSE_LEVELS.length - 1)]
}

/**
 * Calculate SF-Klasse after N claim-free years
 */
export function getSfKlasseAfterYears(startingSfKlasse: number, years: number): number {
  let sfKlasse = startingSfKlasse
  for (let i = 0; i < years; i++) {
    sfKlasse = getNextSfKlasse(sfKlasse)
  }
  return sfKlasse
}

export function calculateInsuranceForYear(
  baseInsurance: number,
  startingSfKlasse: number,
  year: number
): number {
  // Use proper SF-Klasse progression with gaps
  const sfKlasse = getSfKlasseAfterYears(startingSfKlasse, year)
  const percentage = SF_KLASSE_PERCENTAGES[sfKlasse] ?? SF_KLASSE_PERCENTAGES[35]

  // Base insurance is entered at the starting SF-Klasse, normalize to SF5 (100%) then apply new rate
  const startingPercentage = SF_KLASSE_PERCENTAGES[startingSfKlasse] ?? SF_KLASSE_PERCENTAGES[0]
  const baseAtSf5 = baseInsurance / (startingPercentage / 100)
  return baseAtSf5 * (percentage / 100)
}

export function calculateFuelCostYearly(
  car: Car,
  kmPerYear: number,
  runningCosts?: RunningCosts | null
): number {
  if (!car.consumption) {
    return 0
  }

  let pricePerUnit: number
  if (car.fuel_type === 'bev') {
    pricePerUnit = runningCosts?.electricity_price || DEFAULT_ELECTRICITY_PRICE_HOME
  } else if (car.fuel_type === 'diesel') {
    pricePerUnit = runningCosts?.fuel_price || DEFAULT_DIESEL_PRICE
  } else {
    pricePerUnit = runningCosts?.fuel_price || DEFAULT_PETROL_PRICE
  }

  return (car.consumption / 100) * kmPerYear * pricePerUnit
}

export function getDefaultMaintenance(fuelType: string): number {
  switch (fuelType) {
    case 'bev':
      return DEFAULT_MAINTENANCE_BEV
    case 'diesel':
      return DEFAULT_MAINTENANCE_DIESEL
    case 'hybrid':
      return DEFAULT_MAINTENANCE_HYBRID
    default:
      return DEFAULT_MAINTENANCE_PETROL
  }
}

/**
 * Calculate TÜV (vehicle inspection) cost for a given year
 * New cars: first inspection after 3 years, then every 2 years
 */
export function calculateTuvForYear(year: number, isNewCar: boolean = true): number {
  if (isNewCar) {
    // First TÜV after 3 years, then every 2 years (years 3, 5, 7, 9, ...)
    if (year === TUV_FIRST_INSPECTION_YEAR) {
      return TUV_COST
    }
    if (year > TUV_FIRST_INSPECTION_YEAR && (year - TUV_FIRST_INSPECTION_YEAR) % 2 === 0) {
      return TUV_COST
    }
  } else {
    // Used cars: every 2 years (years 2, 4, 6, ...)
    if (year % 2 === 0) {
      return TUV_COST
    }
  }
  return 0
}

export function calculateTCO(
  car: Car,
  offer: Offer,
  runningCosts: RunningCosts | null,
  years: number = 3
): TCOResult {
  const durationYears = offer.duration_months / 12
  const effectiveYears = Math.min(years, durationYears)

  const yearlyCosts: YearlyCost[] = []

  // Calculate one-time fees from other_fees
  const otherFeesTotal = Object.values(offer.other_fees || {}).reduce((sum, fee) => sum + fee, 0)

  // Calculate yearly other_costs from running costs
  const otherCostsYearly = Object.values(runningCosts?.other_costs || {}).reduce((sum, cost) => sum + cost, 0)

  let cumulative = offer.down_payment + offer.transfer_fee + otherFeesTotal

  // Upfront costs (including other_fees as one-time fees)
  const upfrontCosts = offer.down_payment + offer.transfer_fee + otherFeesTotal

  for (let year = 1; year <= effectiveYears; year++) {
    const monthlyPayment = offer.monthly_payment * 12

    // Fuel/electricity costs
    const fuelCost = calculateFuelCostYearly(car, offer.km_per_year, runningCosts)

    // Insurance (skip if included in offer)
    const insurance = offer.includes_insurance
      ? 0
      : runningCosts?.insurance_yearly
        ? calculateInsuranceForYear(runningCosts.insurance_yearly, runningCosts.sf_klasse || 0, year - 1)
        : 0

    // Tax (skip if included in offer)
    const tax = offer.includes_tax ? 0 : calculateKfzSteuer(car)

    // Maintenance (skip if included in offer)
    const maintenance = offer.includes_maintenance
      ? 0
      : runningCosts?.maintenance_yearly || getDefaultMaintenance(car.fuel_type)

    // Tires (skip if included in offer)
    const tires = offer.includes_tires ? 0 : (runningCosts?.tire_costs ?? DEFAULT_TIRE_COSTS)

    // TÜV/HU (vehicle inspection)
    // New cars: first after 3 years, then every 2 years
    const tuv = calculateTuvForYear(year)

    const total = monthlyPayment + fuelCost + insurance + tax + maintenance + tires + tuv + otherCostsYearly
    cumulative += total

    yearlyCosts.push({
      year,
      monthlyPayment,
      fuelCost,
      insurance,
      tax,
      maintenance,
      tires,
      tuv,
      otherCosts: otherCostsYearly,
      total,
      cumulative,
    })
  }

  const totalCost = cumulative
  const contractCosts = offer.monthly_payment * offer.duration_months
  const runningCostsTotal = yearlyCosts.reduce((sum, y) => sum + y.fuelCost + y.insurance + y.tax + y.maintenance + y.tires + y.tuv + y.otherCosts, 0)

  return {
    yearlyCosts,
    totalCost,
    averageMonthly: totalCost / (effectiveYears * 12),
    upfrontCosts,
    contractCosts,
    runningCosts: runningCostsTotal,
  }
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount)
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('de-DE').format(num)
}
