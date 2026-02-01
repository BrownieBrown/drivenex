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
