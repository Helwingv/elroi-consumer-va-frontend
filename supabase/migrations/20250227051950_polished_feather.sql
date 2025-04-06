/*
  # Create user_provider_consents table

  1. New Tables:
    - `user_provider_consents` - Stores user consent information for providers
      - `user_id` (uuid, foreign key)
      - `provider_id` (uuid, foreign key)
      - `lab_results` (boolean)
      - `medications` (boolean)
      - `fitness_data` (boolean)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
      - Primary key is (user_id, provider_id)
  
  2. Security:
    - Enable RLS on `user_provider_consents` table
    - Create policies for viewing, inserting, and updating consents
*/

-- Create user_provider_consents table
CREATE TABLE IF NOT EXISTS user_provider_consents (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  provider_id UUID REFERENCES providers(id) ON DELETE CASCADE,
  lab_results BOOLEAN DEFAULT FALSE,
  medications BOOLEAN DEFAULT FALSE,
  fitness_data BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (user_id, provider_id)
);

-- Enable RLS on user_provider_consents table
ALTER TABLE user_provider_consents ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_provider_consents
CREATE POLICY "Users can view their own consents" 
ON user_provider_consents FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own consents" 
ON user_provider_consents FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own consents" 
ON user_provider_consents FOR UPDATE 
TO authenticated 
USING (auth.uid() = user_id);