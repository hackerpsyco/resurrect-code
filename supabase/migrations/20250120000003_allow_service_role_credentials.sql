-- Allow service role to access user_credentials table (for edge functions)
CREATE POLICY "Service role can access all credentials" ON user_credentials
  FOR ALL USING (auth.role() = 'service_role');

-- Allow service role to access user_settings table (for edge functions)
CREATE POLICY "Service role can access all settings" ON user_settings
  FOR ALL USING (auth.role() = 'service_role');
