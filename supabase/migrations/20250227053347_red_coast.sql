/*
  # Create Appointments and Health Metrics Tables

  1. New Tables
    - `appointments` - Stores user appointment data
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `provider_id` (uuid, references providers)
      - `type` (text, appointment type)
      - `date` (timestamptz, appointment date)
      - `time` (text, appointment time)
      - `status` (text, status of appointment)
      - `details` (jsonb, additional appointment details)
    
    - `health_metrics` - Stores user health metrics data
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `metric_type` (text, type of health metric)
      - `value` (text, metric value)
      - `unit` (text, unit of measurement)
      - `recorded_at` (timestamptz, when metric was recorded)
      - `source` (text, source of the metric data)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
*/

-- Create appointments table
CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  provider_id UUID REFERENCES providers(id),
  type TEXT NOT NULL,
  date TIMESTAMPTZ NOT NULL,
  time TEXT,
  status TEXT DEFAULT 'pending',
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on appointments table
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Create policies for appointments
CREATE POLICY "Users can view their own appointments" 
ON appointments FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own appointments" 
ON appointments FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own appointments" 
ON appointments FOR UPDATE 
TO authenticated 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own appointments" 
ON appointments FOR DELETE 
TO authenticated 
USING (auth.uid() = user_id);

-- Create health metrics table
CREATE TABLE IF NOT EXISTS health_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  metric_type TEXT NOT NULL,
  value TEXT NOT NULL,
  unit TEXT,
  recorded_at TIMESTAMPTZ DEFAULT NOW(),
  source TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on health_metrics table
ALTER TABLE health_metrics ENABLE ROW LEVEL SECURITY;

-- Create policies for health_metrics
CREATE POLICY "Users can view their own health metrics" 
ON health_metrics FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own health metrics" 
ON health_metrics FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own health metrics" 
ON health_metrics FOR UPDATE 
TO authenticated 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own health metrics" 
ON health_metrics FOR DELETE 
TO authenticated 
USING (auth.uid() = user_id);