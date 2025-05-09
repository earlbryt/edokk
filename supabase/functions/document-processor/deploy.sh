#!/bin/bash

# Deploy the document processor edge function
echo "Deploying document-processor edge function..."

# Navigate to the project root
cd "$(dirname "$0")/../.."

# Deploy the function without JWT verification (allows public access)
supabase functions deploy document-processor --no-verify-jwt

echo "Deployment complete!"
echo "IMPORTANT: Make sure to set the VERCEL_API_URL environment variable in your Supabase dashboard."
echo "This should point to your deployed Vercel API, e.g., https://your-document-processor-api.vercel.app" 