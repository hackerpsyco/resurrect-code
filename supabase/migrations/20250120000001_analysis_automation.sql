-- Create analysis_automation_settings table
CREATE TABLE IF NOT EXISTS analysis_automation_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Email settings
  enable_email_notifications BOOLEAN DEFAULT false,
  user_email VARCHAR(255),
  
  -- GitHub settings
  github_token VARCHAR(255),
  github_login VARCHAR(255),
  
  -- Automation settings
  auto_generate_improvements BOOLEAN DEFAULT false,
  auto_push_to_github BOOLEAN DEFAULT false,
  
  -- Schedule settings
  analysis_schedule VARCHAR(50) DEFAULT 'manual', -- manual, on-push, daily, weekly
  scheduled_time VARCHAR(5) DEFAULT '02:00', -- HH:MM format in UTC
  
  -- Report settings
  short_report_format BOOLEAN DEFAULT true,
  
  -- Selected resources (stored as JSON arrays)
  selected_repositories JSONB DEFAULT '[]'::jsonb,
  selected_projects JSONB DEFAULT '[]'::jsonb,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id)
);

-- Create analysis_reports table
CREATE TABLE IF NOT EXISTS analysis_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Report metadata
  report_id VARCHAR(255) NOT NULL, -- Unique report identifier
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  repository VARCHAR(255) NOT NULL,
  
  -- Analysis results
  total_issues INTEGER DEFAULT 0,
  critical_issues INTEGER DEFAULT 0,
  high_issues INTEGER DEFAULT 1,
  medium_issues INTEGER DEFAULT 0,
  low_issues INTEGER DEFAULT 0,
  
  -- Report content
  short_summary TEXT,
  full_report TEXT,
  
  -- GitHub integration
  pr_url VARCHAR(255),
  pr_number INTEGER,
  branch_name VARCHAR(255),
  
  -- Email tracking
  email_sent BOOLEAN DEFAULT false,
  email_sent_at TIMESTAMP WITH TIME ZONE,
  user_approved BOOLEAN,
  user_approved_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, report_id)
);

-- Enable RLS (Row Level Security)
ALTER TABLE analysis_automation_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE analysis_reports ENABLE ROW LEVEL SECURITY;

-- Create policies for analysis_automation_settings
CREATE POLICY "Users can only access their own automation settings" ON analysis_automation_settings
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can only insert their own automation settings" ON analysis_automation_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can only update their own automation settings" ON analysis_automation_settings
  FOR UPDATE USING (auth.uid() = user_id);

-- Allow service role to bypass RLS for edge functions
CREATE POLICY "Service role can access all automation settings" ON analysis_automation_settings
  FOR ALL USING (auth.role() = 'service_role');

-- Create policies for analysis_reports
CREATE POLICY "Users can only access their own analysis reports" ON analysis_reports
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can only insert their own analysis reports" ON analysis_reports
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can only update their own analysis reports" ON analysis_reports
  FOR UPDATE USING (auth.uid() = user_id);

-- Allow service role to bypass RLS for edge functions
CREATE POLICY "Service role can access all analysis reports" ON analysis_reports
  FOR ALL USING (auth.role() = 'service_role');

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_analysis_automation_settings_user_id ON analysis_automation_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_analysis_reports_user_id ON analysis_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_analysis_reports_repository ON analysis_reports(repository);
CREATE INDEX IF NOT EXISTS idx_analysis_reports_timestamp ON analysis_reports(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_analysis_reports_report_id ON analysis_reports(report_id);

-- Create updated_at trigger function (if not exists)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at
CREATE TRIGGER update_analysis_automation_settings_updated_at 
  BEFORE UPDATE ON analysis_automation_settings 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_analysis_reports_updated_at 
  BEFORE UPDATE ON analysis_reports 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
