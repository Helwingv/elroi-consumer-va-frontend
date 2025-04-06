/*
  # Add approved field to user_provider_consents table
  
  1. Changes
    - Add `approved` boolean field to `user_provider_consents` table
    - Default to false for existing records
    - Set NOT NULL constraint
  
  2. Purpose
    - Track overall approval status for provider consent
    - Determines if user has explicitly approved access to their data
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_provider_consents' AND column_name = 'approved'
  ) THEN
    ALTER TABLE user_provider_consents 
    ADD COLUMN approved BOOLEAN NOT NULL DEFAULT FALSE;
  END IF;
END $$;