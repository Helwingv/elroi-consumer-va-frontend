/*
  # Fix provider consent permissions

  1. Changes
     - Add missing RLS policy for DELETE operations on user_provider_consents
     - Ensure update policies have proper checks
  
  2. Security
     - Users can now properly delete their own consent records
     - Maintains security by enforcing user_id checks
*/

-- Add missing delete policy for user_provider_consents
CREATE POLICY "Users can delete their own consents" 
ON user_provider_consents FOR DELETE 
TO authenticated 
USING (auth.uid() = user_id);

-- Ensure update policy has proper check
DROP POLICY IF EXISTS "Users can update their own consents" ON user_provider_consents;

CREATE POLICY "Users can update their own consents" 
ON user_provider_consents FOR UPDATE 
TO authenticated 
USING (auth.uid() = user_id);

-- Add a function to handle consent changes
CREATE OR REPLACE FUNCTION update_consent_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update timestamp on consent changes
DROP TRIGGER IF EXISTS consent_update_timestamp ON user_provider_consents;

CREATE TRIGGER consent_update_timestamp
BEFORE UPDATE ON user_provider_consents
FOR EACH ROW
EXECUTE FUNCTION update_consent_timestamp();