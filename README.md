# Lens Document Processing System

A document processing system that extracts text from PDF, DOC, and DOCX files and generates summaries. The system is split into two parts:

1. A Python API deployed on Vercel that handles document processing using PyMuPDF and python-docx
2. A Supabase Edge Function that acts as a bridge between the frontend and the Vercel API

## Architecture

```
┌─────────────┐     ┌──────────────────┐     ┌───────────────┐
│             │     │                  │     │               │
│  Frontend   │────▶│ Supabase Edge    │────▶│  Vercel API   │
│  (React)    │     │  Function        │     │  (Python)     │
│             │     │                  │     │               │
└─────────────┘     └──────────────────┘     └───────────────┘
       │                                             │
       │                                             │
       │                                             │
       ▼                                             ▼
┌─────────────┐                             ┌───────────────┐
│             │                             │               │
│  Supabase   │                             │   PyMuPDF     │
│  Storage    │                             │   python-docx │
│             │                             │               │
└─────────────┘                             └───────────────┘
```

## Setup Instructions

### 1. Deploy the Python API to Vercel

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

### 2. Deploy the Supabase Edge Function

1. Navigate to the `supabase/functions/document-processor` folder
2. Set the `VERCEL_API_URL` environment variable in the Supabase dashboard
3. Deploy the edge function:
   ```
   supabase functions deploy document-processor --no-verify-jwt
   ```

### 3. Frontend Integration

The frontend already contains the code to call the Supabase Edge Function. No changes are needed.

## How It Works

1. The user uploads a document through the React frontend
2. The document is sent to the Supabase Edge Function
3. The Edge Function encodes the document and forwards it to the Vercel API
4. The Vercel API uses Python libraries to extract text from the document
5. The extracted text and a summary are returned to the frontend

This architecture gives you:

- Server-side document processing with powerful Python libraries
- Scalable serverless architecture with Vercel and Supabase
- Simple frontend integration

## Technologies Used

- **Frontend**: React, TailwindCSS
- **Edge Function**: Supabase, Deno
- **Backend API**: Python, Flask, Vercel
- **Document Processing**: PyMuPDF, python-docx
