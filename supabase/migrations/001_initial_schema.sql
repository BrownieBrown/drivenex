-- Create custom types
CREATE TYPE fuel_type AS ENUM ('bev', 'petrol', 'diesel', 'hybrid');
CREATE TYPE offer_type AS ENUM ('lease', 'buy', 'subscription');

-- Cars table
CREATE TABLE cars (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  variant TEXT,
  fuel_type fuel_type NOT NULL,
  power_kw INTEGER,
  co2_emissions INTEGER,
  battery_kwh DECIMAL(5,1),
  consumption DECIMAL(4,1),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Offers table
CREATE TABLE offers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  car_id UUID NOT NULL REFERENCES cars(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type offer_type NOT NULL,
  name TEXT NOT NULL,
  source_url TEXT,
  source_name TEXT,
  monthly_payment DECIMAL(10,2) NOT NULL,
  down_payment DECIMAL(10,2) DEFAULT 0,
  duration_months INTEGER NOT NULL,
  km_per_year INTEGER NOT NULL,
  excess_km_cost DECIMAL(6,4),
  includes_insurance BOOLEAN DEFAULT FALSE,
  includes_maintenance BOOLEAN DEFAULT FALSE,
  includes_tax BOOLEAN DEFAULT FALSE,
  transfer_fee DECIMAL(10,2) DEFAULT 0,
  other_fees JSONB DEFAULT '{}',
  residual_value DECIMAL(10,2),
  financing_rate DECIMAL(5,2),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Running costs table
CREATE TABLE running_costs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  offer_id UUID NOT NULL REFERENCES offers(id) ON DELETE CASCADE UNIQUE,
  insurance_yearly DECIMAL(10,2) NOT NULL,
  sf_klasse INTEGER DEFAULT 0,
  fuel_price DECIMAL(5,3),
  electricity_price DECIMAL(5,3),
  maintenance_yearly DECIMAL(10,2) DEFAULT 0,
  tire_costs DECIMAL(10,2) DEFAULT 0,
  other_costs JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Comparisons table
CREATE TABLE comparisons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  offer_ids UUID[] NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- User settings table
CREATE TABLE user_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  electricity_price_home DECIMAL(5,3) DEFAULT 0.30,
  electricity_price_public DECIMAL(5,3) DEFAULT 0.50,
  petrol_price DECIMAL(5,3) DEFAULT 1.75,
  diesel_price DECIMAL(5,3) DEFAULT 1.65,
  default_km_per_year INTEGER DEFAULT 15000,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_cars_updated_at BEFORE UPDATE ON cars
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_offers_updated_at BEFORE UPDATE ON offers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_running_costs_updated_at BEFORE UPDATE ON running_costs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comparisons_updated_at BEFORE UPDATE ON comparisons
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON user_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE cars ENABLE ROW LEVEL SECURITY;
ALTER TABLE offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE running_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE comparisons ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for cars
CREATE POLICY "Users can view own cars" ON cars
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own cars" ON cars
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own cars" ON cars
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own cars" ON cars
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for offers
CREATE POLICY "Users can view own offers" ON offers
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own offers" ON offers
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own offers" ON offers
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own offers" ON offers
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for running_costs (through offer ownership)
CREATE POLICY "Users can view own running costs" ON running_costs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM offers WHERE offers.id = running_costs.offer_id AND offers.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own running costs" ON running_costs
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM offers WHERE offers.id = running_costs.offer_id AND offers.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own running costs" ON running_costs
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM offers WHERE offers.id = running_costs.offer_id AND offers.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own running costs" ON running_costs
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM offers WHERE offers.id = running_costs.offer_id AND offers.user_id = auth.uid()
    )
  );

-- RLS Policies for comparisons
CREATE POLICY "Users can view own comparisons" ON comparisons
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own comparisons" ON comparisons
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own comparisons" ON comparisons
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own comparisons" ON comparisons
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for user_settings
CREATE POLICY "Users can view own settings" ON user_settings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings" ON user_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own settings" ON user_settings
  FOR UPDATE USING (auth.uid() = user_id);

-- Create indexes for better query performance
CREATE INDEX idx_cars_user_id ON cars(user_id);
CREATE INDEX idx_offers_user_id ON offers(user_id);
CREATE INDEX idx_offers_car_id ON offers(car_id);
CREATE INDEX idx_running_costs_offer_id ON running_costs(offer_id);
CREATE INDEX idx_comparisons_user_id ON comparisons(user_id);
CREATE INDEX idx_user_settings_user_id ON user_settings(user_id);
