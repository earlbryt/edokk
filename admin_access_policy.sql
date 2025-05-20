-- Drop any existing policies on the consultations table
DROP POLICY IF EXISTS "Users can view their own consultations" ON consultations;
DROP POLICY IF EXISTS "Admins can view all consultations" ON consultations;

-- Enable Row Level Security on the consultations table
ALTER TABLE consultations ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows users to view only their own consultations
CREATE POLICY "Users can view their own consultations" 
ON consultations
FOR SELECT
USING (auth.uid() = user_id);

-- Create a policy that allows users with 'admin' role to view all consultations
CREATE POLICY "Admins can view all consultations" 
ON consultations
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- Create a policy that allows admin users to update all consultations
CREATE POLICY "Admins can update all consultations" 
ON consultations
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- Create a policy that allows regular users to insert their own consultations
CREATE POLICY "Users can insert their own consultations" 
ON consultations
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Ensure administrators have all necessary policies for consultation management
GRANT ALL ON consultations TO authenticated;
