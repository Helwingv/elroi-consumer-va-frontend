/*
  # Create user_settings table

  1. New Tables:
    - `user_settings` - Stores user settings and preferences
      - `user_id` (uuid, primary key)
      - `email_notifications` (boolean)
      - `sms_notifications` (boolean)
      - `push_notifications` (boolean)
      - `theme` (text)
      - `privacy_enabled` (boolean)
      - `data_sharing` (boolean)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
  
  2. Security:
    - Enable RLS on `user_settings` table
    - Create policies for viewing, inserting, and updating user settings
*/

-- Create user_settings table
CREATE TABLE IF NOT EXISTS user_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email_notifications BOOLEAN DEFAULT TRUE,
  sms_notifications BOOLEAN DEFAULT FALSE,
  push_notifications BOOLEAN DEFAULT TRUE,
  theme TEXT DEFAULT 'light',
  privacy_enabled BOOLEAN DEFAULT TRUE,
  data_sharing BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on user_settings table
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_settings
CREATE POLICY "Users can view their own settings" 
ON user_settings FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings" 
ON user_settings FOR UPDATE 
TO authenticated 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own settings" 
ON user_settings FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);