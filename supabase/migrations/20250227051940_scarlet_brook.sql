/*
  # Create providers table

  1. New Tables:
    - `providers` - Stores healthcare provider information
      - `id` (uuid, primary key)
      - `name` (text, required)
      - `category` (text)
      - `status` (text)
      - `logo` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
      - `user_id` (uuid, foreign key)
  
  2. Security:
    - Enable RLS on `providers` table
    - Create policies for viewing, inserting, and updating providers
*/

-- Create providers table
CREATE TABLE IF NOT EXISTS providers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  category TEXT,
  status TEXT DEFAULT 'inactive',
  logo TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Enable RLS on providers table
ALTER TABLE providers ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for providers
CREATE POLICY "Anyone can view providers" 
ON providers FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Users can insert their own providers" 
ON providers FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own providers" 
ON providers FOR UPDATE 
TO authenticated 
USING (auth.uid() = user_id);