/*
  # Create contracts table

  1. New Tables:
    - `contracts` - Stores contract information
      - `id` (uuid, primary key)
      - `title` (text, required)
      - `description` (text)
      - `status` (text)
      - `type` (text)
      - `user_id` (uuid, foreign key)
      - `provider_id` (uuid, foreign key)
      - `start_date` (timestamp)
      - `end_date` (timestamp)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
  
  2. Security:
    - Enable RLS on `contracts` table
    - Create policies for viewing and inserting contracts
*/

-- Create contracts table
CREATE TABLE IF NOT EXISTS contracts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending',
  type TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  provider_id UUID REFERENCES providers(id),
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on contracts table
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for contracts
CREATE POLICY "Users can view their own contracts" 
ON contracts FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own contracts" 
ON contracts FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);