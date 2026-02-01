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

export function calculateInsuranceForYear(
  baseInsurance: number,
  startingSfKlasse: number,
  year: number
): number {
  // Each claim-free year improves SF-Klasse by 1
  const sfKlasse = Math.min(startingSfKlasse + year, 35)
  const percentage = SF_KLASSE_PERCENTAGES[sfKlasse] || SF_KLASSE_PERCENTAGES[Math.min(sfKlasse, 35)]

  // Base insurance is at SF5 (100%), adjust accordingly
  const baseAtSf5 = baseInsurance / (SF_KLASSE_PERCENTAGES[startingSfKlasse] / 100)
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

export function calculateTCO(
  car: Car,
  offer: Offer,
  runningCosts: RunningCosts | null,
  years: number = 3
): TCOResult {
  const durationYears = offer.duration_months / 12
  const effectiveYears = Math.min(years, durationYears)

  const yearlyCosts: YearlyCost[] = []
  let cumulative = offer.down_payment + offer.transfer_fee

  // Upfront costs
  const upfrontCosts = offer.down_payment + offer.transfer_fee

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

    // Tires
    const tires = runningCosts?.tire_costs || DEFAULT_TIRE_COSTS

    // TÜV (every 2 years, first after 3 years for new cars)
    // Assuming new car for simplicity
    const tuv = year >= TUV_FIRST_INSPECTION_YEAR && (year - TUV_FIRST_INSPECTION_YEAR) % 2 === 0
      ? TUV_COST
      : 0

    const total = monthlyPayment + fuelCost + insurance + tax + maintenance + tires + tuv
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
      total,
      cumulative,
    })
  }

  const totalCost = cumulative
  const contractCosts = offer.monthly_payment * offer.duration_months
  const runningCostsTotal = yearlyCosts.reduce((sum, y) => sum + y.fuelCost + y.insurance + y.tax + y.maintenance + y.tires + y.tuv, 0)

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
