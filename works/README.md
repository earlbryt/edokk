# Document Text Extractor API

A serverless API for extracting text from PDF files and Word documents using PyMuPDF and python-docx, designed for deployment on Vercel.

## Features

- Extract text from PDF files using PyMuPDF
- Extract text from Word documents using python-docx
- Serverless deployment on Vercel
- Ready to integrate with Supabase Edge Functions

## Deployment Instructions

### Deploying to Vercel

1. Make sure you have the Vercel CLI installed:

   ```
   npm install -g vercel
   ```

2. Log in to Vercel:

   ```
   vercel login
   ```

3. Deploy the project from this directory:

   ```
   vercel
   ```

4. Follow the prompts to deploy the project.

5. Your API will be available at the URL provided by Vercel, typically something like:
   `https://your-project-name.vercel.app`

### API Usage

Send a POST request to your deployed API with the following JSON payload:

```json
{
  "fileName": "example.pdf",
  "fileType": "application/pdf",
  "fileContent": "<base64-encoded file content>"
}
```

Response format:

```json
{
  "text": "Extracted text content...",
  "summary": "Generated summary...",
  "fileName": "example.pdf",
  "fileType": "application/pdf"
}
```

## Integrating with Supabase Edge Function

After deploying this API to Vercel, you can create a Supabase Edge Function that forwards document processing requests to this API. This allows you to leverage Python libraries while keeping your front-end integration simple.

### Sample Supabase Edge Function

```typescript
// Document Processor Edge Function that calls Vercel API
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

// CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

// URL of your deployed Vercel API
const VERCEL_API_URL = "https://your-project-name.vercel.app";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Only allow POST requests
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get form data with the file
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return new Response(JSON.stringify({ error: "No file provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get file details
    const fileName = file.name;
    const fileType = file.type || fileName.split(".").pop() || "";

    // Read file content
    const fileBuffer = await file.arrayBuffer();
    const fileContent = btoa(
      String.fromCharCode(...new Uint8Array(fileBuffer))
    );

    // Forward to the Vercel API
    const response = await fetch(VERCEL_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fileName,
        fileType,
        fileContent,
      }),
    });

    // Get the response from the Vercel API
    const result = await response.json();

    // Return the result
    return new Response(JSON.stringify(result), {
      status: response.status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error processing document:", error);

    return new Response(
      JSON.stringify({
        error: `Document processing failed: ${
          error instanceof Error ? error.message : String(error)
        }`,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
```

## Technologies Used

- **Frontend**: HTML, CSS, JavaScript
- **Backend**: Flask (Python)
- **PDF Processing**: PyMuPDF (fitz)
- **Word Processing**: python-docx

## Notes

- The backend must be running for the text extraction to work
- Supported file types: PDF (.pdf), Word (.docx, .doc)
- Large files may take longer to process
