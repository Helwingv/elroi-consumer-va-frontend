/*
  # Add approved field to user_provider_consents table

  1. Changes
    - Add `approved` boolean field to the `user_provider_consents` table
      - This field indicates if the provider has been explicitly approved by the user
      - Set to default false

  2. Security
    - Maintain existing RLS policies
*/

-- Add approved field to user_provider_consents table
ALTER TABLE user_provider_consents 
ADD COLUMN IF NOT EXISTS approved BOOLEAN DEFAULT FALSE;