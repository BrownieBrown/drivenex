export type FuelType = 'bev' | 'petrol' | 'diesel' | 'hybrid'
export type OfferType = 'lease' | 'buy' | 'subscription'

export interface Database {
  public: {
    Tables: {
      cars: {
        Row: {
          id: string
          user_id: string
          brand: string
          model: string
          variant: string | null
          fuel_type: FuelType
          power_kw: number | null
          co2_emissions: number | null
          battery_kwh: number | null
          consumption: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          brand: string
          model: string
          variant?: string | null
          fuel_type: FuelType
          power_kw?: number | null
          co2_emissions?: number | null
          battery_kwh?: number | null
          consumption?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          brand?: string
          model?: string
          variant?: string | null
          fuel_type?: FuelType
          power_kw?: number | null
          co2_emissions?: number | null
          battery_kwh?: number | null
          consumption?: number | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      offers: {
        Row: {
          id: string
          car_id: string
          user_id: string
          type: OfferType
          name: string
          source_url: string | null
          source_name: string | null
          monthly_payment: number
          down_payment: number
          duration_months: number
          km_per_year: number
          excess_km_cost: number | null
          includes_insurance: boolean
          includes_maintenance: boolean
          includes_tax: boolean
          includes_tires: boolean
          transfer_fee: number
          other_fees: Record<string, number>
          residual_value: number | null
          financing_rate: number | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          car_id: string
          user_id: string
          type: OfferType
          name: string
          source_url?: string | null
          source_name?: string | null
          monthly_payment: number
          down_payment?: number
          duration_months: number
          km_per_year: number
          excess_km_cost?: number | null
          includes_insurance?: boolean
          includes_maintenance?: boolean
          includes_tax?: boolean
          includes_tires?: boolean
          transfer_fee?: number
          other_fees?: Record<string, number>
          residual_value?: number | null
          financing_rate?: number | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          car_id?: string
          user_id?: string
          type?: OfferType
          name?: string
          source_url?: string | null
          source_name?: string | null
          monthly_payment?: number
          down_payment?: number
          duration_months?: number
          km_per_year?: number
          excess_km_cost?: number | null
          includes_insurance?: boolean
          includes_maintenance?: boolean
          includes_tax?: boolean
          includes_tires?: boolean
          transfer_fee?: number
          other_fees?: Record<string, number>
          residual_value?: number | null
          financing_rate?: number | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      running_costs: {
        Row: {
          id: string
          offer_id: string
          insurance_yearly: number
          sf_klasse: number
          fuel_price: number | null
          electricity_price: number | null
          maintenance_yearly: number
          tire_costs: number
          other_costs: Record<string, number>
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          offer_id: string
          insurance_yearly: number
          sf_klasse?: number
          fuel_price?: number | null
          electricity_price?: number | null
          maintenance_yearly?: number
          tire_costs?: number
          other_costs?: Record<string, number>
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          offer_id?: string
          insurance_yearly?: number
          sf_klasse?: number
          fuel_price?: number | null
          electricity_price?: number | null
          maintenance_yearly?: number
          tire_costs?: number
          other_costs?: Record<string, number>
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      comparisons: {
        Row: {
          id: string
          user_id: string
          name: string
          offer_ids: string[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          offer_ids: string[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          offer_ids?: string[]
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          id: string
          user_id: string
          electricity_price_home: number
          electricity_price_public: number
          petrol_price: number
          diesel_price: number
          default_km_per_year: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          electricity_price_home?: number
          electricity_price_public?: number
          petrol_price?: number
          diesel_price?: number
          default_km_per_year?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          electricity_price_home?: number
          electricity_price_public?: number
          petrol_price?: number
          diesel_price?: number
          default_km_per_year?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: {
      fuel_type: FuelType
      offer_type: OfferType
    }
  }
}

export type Car = Database['public']['Tables']['cars']['Row']
export type CarInsert = Database['public']['Tables']['cars']['Insert']
export type CarUpdate = Database['public']['Tables']['cars']['Update']

export type Offer = Database['public']['Tables']['offers']['Row']
export type OfferInsert = Database['public']['Tables']['offers']['Insert']
export type OfferUpdate = Database['public']['Tables']['offers']['Update']

export type RunningCosts = Database['public']['Tables']['running_costs']['Row']
export type RunningCostsInsert = Database['public']['Tables']['running_costs']['Insert']
export type RunningCostsUpdate = Database['public']['Tables']['running_costs']['Update']

export type Comparison = Database['public']['Tables']['comparisons']['Row']
export type ComparisonInsert = Database['public']['Tables']['comparisons']['Insert']
export type ComparisonUpdate = Database['public']['Tables']['comparisons']['Update']

export type UserSettings = Database['public']['Tables']['user_settings']['Row']
export type UserSettingsInsert = Database['public']['Tables']['user_settings']['Insert']
export type UserSettingsUpdate = Database['public']['Tables']['user_settings']['Update']
