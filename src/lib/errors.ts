// User-friendly error message mapping for Supabase errors

const SUPABASE_ERROR_MAP: Record<string, string> = {
  // PostgreSQL error codes
  '23505': 'This entry already exists.',
  '23503': 'Referenced item no longer exists.',
  '23502': 'Required field is missing.',
  '42501': 'You do not have permission for this action.',
  '42P01': 'Database table not found.',

  // Supabase specific
  'PGRST116': 'Item not found.',
  'PGRST301': 'Row-level security policy violation.',

  // Auth errors
  'invalid_credentials': 'Invalid email or password.',
  'email_not_confirmed': 'Please confirm your email address.',
  'user_not_found': 'User not found.',
  'weak_password': 'Password is too weak.',
  'email_taken': 'This email is already registered.',
}

/**
 * Convert Supabase error to user-friendly message
 */
export function getUserFriendlyError(error: { code?: string; message?: string } | null): string {
  if (!error) {
    return 'An unexpected error occurred. Please try again.'
  }

  if (error.code && SUPABASE_ERROR_MAP[error.code]) {
    return SUPABASE_ERROR_MAP[error.code]
  }

  // Check if the message contains known patterns
  if (error.message) {
    if (error.message.includes('duplicate key')) {
      return 'This entry already exists.'
    }
    if (error.message.includes('foreign key')) {
      return 'Referenced item no longer exists.'
    }
    if (error.message.includes('permission denied')) {
      return 'You do not have permission for this action.'
    }
    if (error.message.includes('JWT')) {
      return 'Your session has expired. Please log in again.'
    }
  }

  return error.message || 'An unexpected error occurred. Please try again.'
}
