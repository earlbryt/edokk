// Document Processor Edge Function that calls Vercel API
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS'
}

// URL of your deployed Vercel API - replace with your actual URL after deployment
const VERCEL_API_URL = Deno.env.get('VERCEL_API_URL') || 'https://your-document-processor-api.vercel.app';

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  
  try {
    // Only allow POST requests
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }
    
    console.log('Processing document request');
    
    // Get form data with the file
    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      console.log('No file provided');
      return new Response(JSON.stringify({ error: 'No file provided' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }
    
    // Get file details
    const fileName = file.name;
    const fileType = file.type || fileName.split('.').pop() || '';
    
    console.log(`Processing file: ${fileName} (${fileType})`);
    
    // Read file content and convert to base64
    const fileBuffer = await file.arrayBuffer();
    const fileContent = btoa(String.fromCharCode(...new Uint8Array(fileBuffer)));
    
    console.log(`File content encoded, sending to Vercel API: ${VERCEL_API_URL}`);
    
    // Forward to the Vercel API
    const response = await fetch(VERCEL_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        fileName,
        fileType,
        fileContent
      })
    });
    
    // Check for API errors
    if (!response.ok) {
      console.error(`Vercel API error: ${response.status} ${response.statusText}`);
      const errorText = await response.text();
      return new Response(
        JSON.stringify({
          error: `Document processing API error: ${response.status} ${response.statusText}`,
          details: errorText
        }),
        {
          status: response.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
    
    // Get the response from the Vercel API
    const result = await response.json();
    console.log('Successfully processed document');
    
    // Return the result
    return new Response(
      JSON.stringify(result),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  } catch (error) {
    console.error('Error processing document:', error);
    
    return new Response(
      JSON.stringify({
        error: `Document processing failed: ${error instanceof Error ? error.message : String(error)}`
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
}) 