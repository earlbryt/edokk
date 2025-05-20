-- This SQL script will give admin users access to all consultations
-- Run this in the Supabase SQL Editor

-- First, drop any existing policies on the consultations table
DROP POLICY IF EXISTS "Users can only access their own consultations" ON consultations;
DROP POLICY IF EXISTS "Admins can access all consultations" ON consultations;
DROP POLICY IF EXISTS "Users can view their own consultations" ON consultations;
DROP POLICY IF EXISTS "Admins can view all consultations" ON consultations;

-- Create policy to allow users to view only their own consultations
CREATE POLICY "Users can view their own consultations" 
ON consultations FOR SELECT 
USING (auth.uid() = user_id);

-- Create policy to allow users to insert their own consultations
CREATE POLICY "Users can insert their own consultations" 
ON consultations FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create policy to let admins view ALL consultations (key part!)
CREATE POLICY "Admins can view all consultations" 
ON consultations FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- Create policy to let admins update ANY consultation
CREATE POLICY "Admins can update all consultations" 
ON consultations FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);
