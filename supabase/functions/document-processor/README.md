# Document Processor Edge Function

This Supabase Edge Function forwards document processing requests to a Vercel-deployed Python API that extracts text from PDF and Word documents.

## Setup

### 1. Deploy the Vercel API

First, deploy the Python API to Vercel:

1. Navigate to the `works` folder
2. Make sure you have the Vercel CLI installed:
   ```
   npm install -g vercel
   ```
3. Deploy to Vercel:
   ```
   vercel
   ```
4. Take note of the deployment URL (e.g., `https://document-processor-api.vercel.app`)

### 2. Set Environment Variables in Supabase

1. In the Supabase dashboard, go to your project
2. Navigate to Settings > API
3. Scroll down to "Project Settings"
4. Add the following environment variable:
   - `VERCEL_API_URL`: Set this to your Vercel deployment URL

### 3. Deploy the Edge Function

```bash
supabase functions deploy document-processor --no-verify-jwt
```

## How It Works

1. The Supabase Edge Function receives document uploads from the frontend
2. It encodes the file content as base64
3. It forwards the request to the Vercel-deployed Python API
4. The Python API uses PyMuPDF and python-docx to extract text
5. The response is relayed back to the frontend

This approach gives you the best of both worlds:

- The simplicity of Supabase Edge Functions for integration with your frontend
- The power of Python libraries for document processing via Vercel

## API Usage

The API accepts POST requests with `multipart/form-data` containing a file:

```javascript
const formData = new FormData();
formData.append("file", fileObject);

const response = await fetch(
  "https://pbefndabvlaebfexhhnv.supabase.co/functions/v1/document-processor",
  {
    method: "POST",
    body: formData,
  }
);

const result = await response.json();
// Result contains: { text, summary, fileName, fileType }
```
