/*
  # Create health_records table

  1. New Tables:
    - `health_records` - Stores user health records
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key)
      - `title` (text, required)
      - `content` (text)
      - `type` (text)
      - `provider_id` (uuid, foreign key)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
  
  2. Security:
    - Enable RLS on `health_records` table
    - Create policies for viewing, inserting, and updating health records
*/

-- Create health_records table
CREATE TABLE IF NOT EXISTS health_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT,
  type TEXT,
  provider_id UUID REFERENCES providers(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on health_records table
ALTER TABLE health_records ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for health_records
CREATE POLICY "Users can view their own health records" 
ON health_records FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own health records" 
ON health_records FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own health records" 
ON health_records FOR UPDATE 
TO authenticated 
USING (auth.uid() = user_id);