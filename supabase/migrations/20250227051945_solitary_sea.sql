/*
  # Create data types table

  1. New Tables:
    - `data_types` - Stores different types of health data
      - `id` (uuid, primary key)
      - `name` (text, required)
      - `description` (text)
  
  2. Security:
    - Enable RLS on `data_types` table
*/

-- Create data_types table
CREATE TABLE IF NOT EXISTS data_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT
);

-- Enable RLS on data_types table
ALTER TABLE data_types ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for data_types
CREATE POLICY "Anyone can view data types" 
ON data_types FOR SELECT 
TO authenticated 
USING (true);