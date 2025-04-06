/*
  # Create provider_data_types junction table

  1. New Tables:
    - `provider_data_types` - Junction table linking providers to data types
      - `provider_id` (uuid, foreign key)
      - `data_type_id` (uuid, foreign key)
      - Primary key is (provider_id, data_type_id)
  
  2. Security:
    - Enable RLS on `provider_data_types` table
*/

-- Create provider_data_types junction table
CREATE TABLE IF NOT EXISTS provider_data_types (
  provider_id UUID REFERENCES providers(id) ON DELETE CASCADE,
  data_type_id UUID REFERENCES data_types(id) ON DELETE CASCADE,
  PRIMARY KEY (provider_id, data_type_id)
);

-- Enable RLS on provider_data_types table
ALTER TABLE provider_data_types ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for provider_data_types
CREATE POLICY "Anyone can view provider data types" 
ON provider_data_types FOR SELECT 
TO authenticated 
USING (true);