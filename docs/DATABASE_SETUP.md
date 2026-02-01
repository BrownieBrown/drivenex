# Database Setup Guide

This guide walks you through setting up Supabase for the Car Comparison app.

## 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click "New Project"
3. Enter a project name and database password
4. Select a region close to your users
5. Wait for the project to be created

## 2. Create Database Tables

Go to the SQL Editor in your Supabase dashboard and run the following SQL:

```sql
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
```

## 3. Enable Row Level Security (RLS)

Run the following SQL to secure your tables:

```sql
-- Enable RLS on all tables
ALTER TABLE cars ENABLE ROW LEVEL SECURITY;
ALTER TABLE offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE running_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE comparisons ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Cars policies
CREATE POLICY "Users can view own cars"
  ON cars FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own cars"
  ON cars FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own cars"
  ON cars FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own cars"
  ON cars FOR DELETE
  USING (auth.uid() = user_id);

-- Offers policies
CREATE POLICY "Users can view own offers"
  ON offers FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own offers"
  ON offers FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own offers"
  ON offers FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own offers"
  ON offers FOR DELETE
  USING (auth.uid() = user_id);

-- Running costs policies (access through offer ownership)
CREATE POLICY "Users can view running costs for own offers"
  ON running_costs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM offers
      WHERE offers.id = running_costs.offer_id
      AND offers.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert running costs for own offers"
  ON running_costs FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM offers
      WHERE offers.id = running_costs.offer_id
      AND offers.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update running costs for own offers"
  ON running_costs FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM offers
      WHERE offers.id = running_costs.offer_id
      AND offers.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete running costs for own offers"
  ON running_costs FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM offers
      WHERE offers.id = running_costs.offer_id
      AND offers.user_id = auth.uid()
    )
  );

-- Comparisons policies
CREATE POLICY "Users can view own comparisons"
  ON comparisons FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own comparisons"
  ON comparisons FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own comparisons"
  ON comparisons FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own comparisons"
  ON comparisons FOR DELETE
  USING (auth.uid() = user_id);

-- User settings policies
CREATE POLICY "Users can view own settings"
  ON user_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings"
  ON user_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own settings"
  ON user_settings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own settings"
  ON user_settings FOR DELETE
  USING (auth.uid() = user_id);
```

## 4. Configure Authentication

### Enable Email Auth (Default)

1. Go to Authentication > Providers in your Supabase dashboard
2. Email provider is enabled by default
3. Optionally configure:
   - Confirm email: Toggle on/off
   - Secure email change: Recommended on
   - Double confirm changes: Recommended on

### Site URL Configuration

1. Go to Authentication > URL Configuration
2. Set Site URL to your app URL (e.g., `http://localhost:3000` for development)
3. Add redirect URLs:
   - `http://localhost:3000/auth/callback` (development)
   - `https://yourdomain.com/auth/callback` (production)

## 5. Get API Credentials

1. Go to Settings > API Keys in your Supabase dashboard
2. Copy the following values:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **Publishable key** (`sb_publishable_...`) - safe to use in browser

> **Note:** Supabase now uses Publishable keys (replacing the legacy "anon" key) and Secret keys (replacing the legacy "service_role" key). The publishable key works the same way for client-side authentication.

## 6. Configure Environment Variables

Create or update `.env.local` in your project root:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...
```

Or use the Makefile:

```bash
make setup
# Then edit .env.local with your credentials
```

## 7. Create a Test User

Option 1: Through the app
1. Start your app with `make dev`
2. Go to the login page
3. Sign up with email and password

Option 2: Through Supabase Dashboard
1. Go to Authentication > Users
2. Click "Add user"
3. Enter email and password
4. Optionally check "Auto Confirm User"

## Troubleshooting

### "relation does not exist" errors
Run the table creation SQL from step 2 again.

### "new row violates row-level security policy"
Make sure:
- User is authenticated
- `user_id` matches the authenticated user's ID
- RLS policies from step 3 are applied

### Authentication not working
Check:
- Site URL is configured correctly
- Redirect URLs include your callback path
- Environment variables are set correctly

### CORS errors
Add your app's URL to the allowed origins in Authentication > URL Configuration.
