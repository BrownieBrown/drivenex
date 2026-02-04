// Type-safe helpers for Supabase operations

/**
 * Safely parse a string to a number with fallback
 */
export function parseNumber(
  value: string | number | null | undefined,
  defaultValue: number = 0
): number {
  if (value === null || value === undefined || value === '') {
    return defaultValue
  }
  const parsed = typeof value === 'number' ? value : parseFloat(value)
  return isNaN(parsed) ? defaultValue : parsed
}

/**
 * Safely parse a string to an integer with fallback
 */
export function parseInteger(
  value: string | number | null | undefined,
  defaultValue: number = 0
): number {
  if (value === null || value === undefined || value === '') {
    return defaultValue
  }
  const parsed = typeof value === 'number' ? Math.round(value) : parseInt(value, 10)
  return isNaN(parsed) ? defaultValue : parsed
}

/**
 * Safely parse a string to a number, returning null if empty/invalid
 */
export function parseNumberOrNull(
  value: string | number | null | undefined
): number | null {
  if (value === null || value === undefined || value === '') {
    return null
  }
  const parsed = typeof value === 'number' ? value : parseFloat(value)
  return isNaN(parsed) ? null : parsed
}

/**
 * Safely parse a string to an integer, returning null if empty/invalid
 */
export function parseIntegerOrNull(
  value: string | number | null | undefined
): number | null {
  if (value === null || value === undefined || value === '') {
    return null
  }
  const parsed = typeof value === 'number' ? Math.round(value) : parseInt(value, 10)
  return isNaN(parsed) ? null : parsed
}
