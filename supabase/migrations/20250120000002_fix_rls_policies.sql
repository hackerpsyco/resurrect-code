-- Drop old conflicting policies
DROP POLICY IF EXISTS "Users can only access their own automation settings" ON analysis_automation_settings;
DROP POLICY IF EXISTS "Users can only insert their own automation settings" ON analysis_automation_settings;
DROP POLICY IF EXISTS "Users can only update their own automation settings" ON analysis_automation_settings;
DROP POLICY IF EXISTS "Users can only access their own analysis reports" ON analysis_reports;
DROP POLICY IF EXISTS "Users can only insert their own analysis reports" ON analysis_reports;
DROP POLICY IF EXISTS "Users can only update their own analysis reports" ON analysis_reports;

-- Create new explicit policies for analysis_automation_settings
CREATE POLICY "Users can select their own automation settings" ON analysis_automation_settings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own automation settings" ON analysis_automation_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own automation settings" ON analysis_automation_settings
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own automation settings" ON analysis_automation_settings
  FOR DELETE USING (auth.uid() = user_id);

-- Create new explicit policies for analysis_reports
CREATE POLICY "Users can select their own analysis reports" ON analysis_reports
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own analysis reports" ON analysis_reports
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own analysis reports" ON analysis_reports
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own analysis reports" ON analysis_reports
  FOR DELETE USING (auth.uid() = user_id);
