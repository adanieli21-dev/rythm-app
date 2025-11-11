/*
  # RYTHM App Initial Schema

  1. New Tables
    - `systems`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `name` (text) - System name
      - `trigger` (text) - When to do it
      - `full_action` (text) - Full version description
      - `survival_action` (text) - Survival mode version
      - `is_paused` (boolean) - Whether system is active
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `daily_logs`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `system_id` (uuid, foreign key to systems)
      - `date` (date) - Log date
      - `status` (text) - 'done', 'survival', 'skip', or null
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
      - Unique constraint on (user_id, system_id, date)
    
    - `weekly_syncs`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `week_ending` (date) - End date of the week
      - `win` (text) - What was a win
      - `patterns` (text) - Patterns that emerged
      - `hard_days` (text) - What made hard days hard
      - `adjust_system` (text) - Which system to adjust
      - `adjust_description` (text) - How to adjust it
      - `intention` (text) - Next week's intention
      - `created_at` (timestamptz)
    
    - `user_settings`
      - `user_id` (uuid, primary key, foreign key to auth.users)
      - `survival_mode` (boolean) - Global survival mode toggle
      - `tracker_date` (date) - For date navigation in tracker
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Users can only access their own data
    - Policies for SELECT, INSERT, UPDATE, DELETE
*/

-- Create systems table
CREATE TABLE IF NOT EXISTS systems (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  trigger text NOT NULL,
  full_action text NOT NULL,
  survival_action text NOT NULL,
  is_paused boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE systems ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own systems"
  ON systems FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own systems"
  ON systems FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own systems"
  ON systems FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own systems"
  ON systems FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create daily_logs table
CREATE TABLE IF NOT EXISTS daily_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  system_id uuid REFERENCES systems(id) ON DELETE CASCADE NOT NULL,
  date date NOT NULL,
  status text CHECK (status IN ('done', 'survival', 'skip')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, system_id, date)
);

ALTER TABLE daily_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own logs"
  ON daily_logs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own logs"
  ON daily_logs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own logs"
  ON daily_logs FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own logs"
  ON daily_logs FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create weekly_syncs table
CREATE TABLE IF NOT EXISTS weekly_syncs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  week_ending date NOT NULL,
  win text NOT NULL,
  patterns text NOT NULL,
  hard_days text,
  adjust_system text NOT NULL,
  adjust_description text,
  intention text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE weekly_syncs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own syncs"
  ON weekly_syncs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own syncs"
  ON weekly_syncs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create user_settings table
CREATE TABLE IF NOT EXISTS user_settings (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  survival_mode boolean DEFAULT false,
  tracker_date date DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own settings"
  ON user_settings FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings"
  ON user_settings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own settings"
  ON user_settings FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_systems_user_id ON systems(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_logs_user_date ON daily_logs(user_id, date);
CREATE INDEX IF NOT EXISTS idx_daily_logs_system_date ON daily_logs(system_id, date);
CREATE INDEX IF NOT EXISTS idx_weekly_syncs_user ON weekly_syncs(user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS systems_updated_at ON systems;
CREATE TRIGGER systems_updated_at
  BEFORE UPDATE ON systems
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS daily_logs_updated_at ON daily_logs;
CREATE TRIGGER daily_logs_updated_at
  BEFORE UPDATE ON daily_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS user_settings_updated_at ON user_settings;
CREATE TRIGGER user_settings_updated_at
  BEFORE UPDATE ON user_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
