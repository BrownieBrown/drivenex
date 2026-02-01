-- Create custom types
CREATE TYPE fuel_type AS ENUM ('bev', 'petrol', 'diesel', 'hybrid');
CREATE TYPE offer_type AS ENUM ('lease', 'buy', 'subscription');

-- Cars table
CREATE TABLE cars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  variant TEXT,
  fuel_type fuel_type NOT NULL,
  power_kw INTEGER,
  co2_emissions INTEGER,
  battery_kwh DECIMAL,
  consumption DECIMAL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Offers table
CREATE TABLE offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  car_id UUID NOT NULL REFERENCES cars(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type offer_type NOT NULL,
  name TEXT NOT NULL,
  source_url TEXT,
  source_name TEXT,
  monthly_payment DECIMAL NOT NULL,
  down_payment DECIMAL DEFAULT 0,
  duration_months INTEGER NOT NULL,
  km_per_year INTEGER NOT NULL,
  excess_km_cost DECIMAL,
  includes_insurance BOOLEAN DEFAULT FALSE,
  includes_maintenance BOOLEAN DEFAULT FALSE,
  includes_tax BOOLEAN DEFAULT FALSE,
  transfer_fee DECIMAL DEFAULT 0,
  other_fees JSONB DEFAULT '{}',
  residual_value DECIMAL,
  financing_rate DECIMAL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Running costs table
CREATE TABLE running_costs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id UUID NOT NULL UNIQUE REFERENCES offers(id) ON DELETE CASCADE,
  insurance_yearly DECIMAL NOT NULL,
  sf_klasse INTEGER DEFAULT 0,
  fuel_price DECIMAL,
  electricity_price DECIMAL,
  maintenance_yearly DECIMAL DEFAULT 0,
  tire_costs DECIMAL DEFAULT 300,
  other_costs JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Comparisons table
CREATE TABLE comparisons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  offer_ids UUID[] NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User settings table
CREATE TABLE user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  electricity_price_home DECIMAL DEFAULT 0.30,
  electricity_price_public DECIMAL DEFAULT 0.50,
  petrol_price DECIMAL DEFAULT 1.75,
  diesel_price DECIMAL DEFAULT 1.65,
  default_km_per_year INTEGER DEFAULT 15000,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for common queries
CREATE INDEX idx_cars_user_id ON cars(user_id);
CREATE INDEX idx_offers_car_id ON offers(car_id);
CREATE INDEX idx_offers_user_id ON offers(user_id);
CREATE INDEX idx_running_costs_offer_id ON running_costs(offer_id);
CREATE INDEX idx_comparisons_user_id ON comparisons(user_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to all tables
CREATE TRIGGER cars_updated_at BEFORE UPDATE ON cars
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER offers_updated_at BEFORE UPDATE ON offers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER running_costs_updated_at BEFORE UPDATE ON running_costs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER comparisons_updated_at BEFORE UPDATE ON comparisons
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER user_settings_updated_at BEFORE UPDATE ON user_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
