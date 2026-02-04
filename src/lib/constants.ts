// German defaults for car cost calculations

// Fuel prices (EUR)
export const DEFAULT_PETROL_PRICE = 1.75 // EUR/L
export const DEFAULT_DIESEL_PRICE = 1.65 // EUR/L
export const DEFAULT_ELECTRICITY_PRICE_HOME = 0.30 // EUR/kWh
export const DEFAULT_ELECTRICITY_PRICE_PUBLIC = 0.50 // EUR/kWh

// Kfz-Steuer (vehicle tax)
// BEVs are tax-free until 2030
// For combustion: base rate + CO2 component
export const KFZ_STEUER_BASE_PETROL = 2.0 // EUR per 100ccm
export const KFZ_STEUER_BASE_DIESEL = 9.5 // EUR per 100ccm
export const KFZ_STEUER_CO2_THRESHOLD = 95 // g/km (tax-free below this)
export const KFZ_STEUER_CO2_RATES = [
  { from: 96, to: 115, rate: 2.0 },
  { from: 116, to: 135, rate: 2.0 },
  { from: 136, to: 155, rate: 2.0 },
  { from: 156, to: 175, rate: 2.0 },
  { from: 176, to: 195, rate: 2.0 },
  { from: 196, to: Infinity, rate: 4.0 },
] as const

// TÜV/HU (vehicle inspection)
export const TUV_COST = 100 // EUR every 2 years
export const TUV_FIRST_INSPECTION_YEAR = 3 // New cars: first TÜV after 3 years

// SF-Klasse (no-claims bonus) - percentage of base premium
export const SF_KLASSE_PERCENTAGES: Record<number, number> = {
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
  11: 65,
  12: 62,
  13: 60,
  14: 57,
  15: 55,
  16: 53,
  17: 51,
  18: 49,
  19: 47,
  20: 45,
  25: 40,
  30: 35,
  35: 30,
}

// Default maintenance costs (EUR/year)
export const DEFAULT_MAINTENANCE_BEV = 200
export const DEFAULT_MAINTENANCE_PETROL = 400
export const DEFAULT_MAINTENANCE_DIESEL = 450
export const DEFAULT_MAINTENANCE_HYBRID = 350

// Default tire costs (EUR/year)
export const DEFAULT_TIRE_COSTS = 300

// Default km/year
export const DEFAULT_KM_PER_YEAR = 15000

// Default insurance (EUR/year at SF10)
export const DEFAULT_INSURANCE_YEARLY = 1200
