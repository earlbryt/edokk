
// document-processor/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.6';
import * as pdfjsLib from 'https://esm.sh/pdfjs-dist@3.4.120/build/pdf.js';

// Initialize the PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://esm.sh/pdfjs-dist@3.4.120/build/pdf.worker.min.js';

// Define the CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Create a Supabase client
const supabaseUrl = 'https://pbefndabvlaebfexhhnv.supabase.co';
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// Constants
const STORAGE_BUCKET = 'lens';

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { fileId } = await req.json();

    if (!fileId) {
      throw new Error('File ID is required');
    }

    console.log(`Processing document with ID: ${fileId}`);

    // Fetch the file information from the database
    const { data: fileData, error: fileError } = await supabase
      .from('cv_files')
      .select('*')
      .eq('id', fileId)
      .single();

    if (fileError) {
      throw new Error(`Failed to fetch file data: ${fileError.message}`);
    }

    if (!fileData) {
      throw new Error(`No file found with ID: ${fileId}`);
    }

    console.log(`File found: ${fileData.name}, Storage path: ${fileData.storage_path}`);

    // Update status to processing
    await supabase
      .from('cv_files')
      .update({ 
        status: 'processing', 
        progress: 25,
        text_extracted: false
      })
      .eq('id', fileId);

    // Download the file from storage
    const { data: fileBuffer, error: downloadError } = await supabase
      .storage
      .from(STORAGE_BUCKET)
      .download(fileData.storage_path);

    if (downloadError) {
      throw new Error(`Failed to download file: ${downloadError.message}`);
    }

    console.log(`File downloaded successfully, size: ${fileBuffer.size} bytes`);

    // Update progress
    await supabase
      .from('cv_files')
      .update({ progress: 50 })
      .eq('id', fileId);

    // Process the PDF and extract text
    let extractedText = '';
    
    try {
      const arrayBuffer = await fileBuffer.arrayBuffer();
      
      // Load the PDF document
      const loadingTask = pdfjsLib.getDocument({ 
        data: arrayBuffer,
        useWorkerFetch: false,
        isEvalSupported: false,
        useSystemFonts: true
      });
      
      const pdfDocument = await loadingTask.promise;
      console.log(`PDF loaded, number of pages: ${pdfDocument.numPages}`);
      
      // Extract text from all pages
      const textContents = [];
      
      for (let i = 1; i <= pdfDocument.numPages; i++) {
        const page = await pdfDocument.getPage(i);
        const content = await page.getTextContent();
        const pageText = content.items
          .map((item: any) => item.str)
          .join(' ');
        
        textContents.push(pageText);
      }
      
      extractedText = textContents.join('\n\n');
      console.log(`Text extraction complete. Extracted ${extractedText.length} characters`);
      
      // Basic parsing attempt
      const parsedData = extractResumeData(extractedText);
      
      // Update the database with the extracted text and parsed data
      await supabase
        .from('cv_files')
        .update({
          status: 'completed',
          progress: 100,
          raw_text: extractedText,
          text_extracted: true,
          text_extraction_date: new Date().toISOString(),
          parsed_data: parsedData
        })
        .eq('id', fileId);
        
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Document processed successfully',
          textLength: extractedText.length,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
      
    } catch (extractionError: any) {
      console.error(`PDF extraction error: ${extractionError.message}`);
      
      // Update the database with the error
      await supabase
        .from('cv_files')
        .update({
          status: 'failed',
          extraction_error: extractionError.message,
          text_extracted: false
        })
        .eq('id', fileId);
        
      throw new Error(`Failed to extract text: ${extractionError.message}`);
    }

  } catch (error: any) {
    console.error(`Error processing document: ${error.message}`);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

/**
 * Extract structured resume data from raw text
 */
function extractResumeData(text: string): {
  name?: string;
  email?: string;
  phone?: string;
  skills: string[];
  experience: string[];
  education: string[];
} {
  // Email regex pattern
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const emails = text.match(emailRegex) || [];
  
  // Phone regex pattern (various formats)
  const phoneRegex = /(\+\d{1,3}[-\s]?)?\(?\d{3}\)?[-\s]?\d{3}[-\s]?\d{4}/g;
  const phones = text.match(phoneRegex) || [];
  
  // Naive name extraction - first capitalized words (likely to be near the top)
  const lines = text.split('\n');
  let possibleName = '';
  
  // Check first few lines for potential names
  for (let i = 0; i < Math.min(5, lines.length); i++) {
    const line = lines[i].trim();
    if (line && line === line.match(/^[A-Z][a-z]+(?: [A-Z][a-z]+){1,2}$/)?.[0]) {
      possibleName = line;
      break;
    }
  }
  
  // Extract skills (common keywords)
  const skillKeywords = [
    "JavaScript", "TypeScript", "React", "Angular", "Vue", "Node.js",
    "Python", "Java", "C++", "C#", "SQL", "NoSQL", "MongoDB", "MySQL",
    "PostgreSQL", "AWS", "Azure", "GCP", "Docker", "Kubernetes",
    "HTML", "CSS", "SASS", "LESS", "Bootstrap", "Tailwind",
    "Git", "GitHub", "CI/CD", "Jenkins", "DevOps", "Agile", "Scrum",
    "Machine Learning", "AI", "Data Science", "Big Data", "Analytics",
    "REST", "GraphQL", "API", "Microservices", "Testing", "TDD",
    "UI/UX", "Design", "Figma", "Sketch", "Photoshop", "Illustrator"
  ];
  
  const skills: string[] = [];
  for (const skill of skillKeywords) {
    if (new RegExp(`\\b${skill}\\b`, 'i').test(text)) {
      skills.push(skill);
    }
  }
  
  // Extract experience sections
  const experience: string[] = [];
  const experienceRegex = /(?:experience|work experience|employment|work history)(?:[:\s]|$)/i;
  const sections = text.split(/[\n\r]{2,}/);
  
  let inExperienceSection = false;
  for (const section of sections) {
    if (experienceRegex.test(section)) {
      inExperienceSection = true;
      continue;
    }
    
    if (inExperienceSection) {
      // Look for job title + company pattern
      if (/[A-Z][a-z]+.{1,50}(?:LLC|Inc|Ltd|Company|Corp)/i.test(section) ||
          /\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[\s,-]+\d{4}/i.test(section)) {
        experience.push(section.trim());
      }
      
      // Stop when we hit another section header
      if (/^(?:education|skills|certification|references|projects|language)/i.test(section.trim())) {
        inExperienceSection = false;
      }
    }
  }
  
  // Extract education sections
  const education: string[] = [];
  const educationRegex = /(?:education|qualification|academic|degree)(?:[:\s]|$)/i;
  
  let inEducationSection = false;
  for (const section of sections) {
    if (educationRegex.test(section)) {
      inEducationSection = true;
      continue;
    }
    
    if (inEducationSection) {
      // Look for degree/university patterns
      if (/(?:Bachelor|Master|PhD|BSc|BA|MS|MA|MBA|Diploma|Associate)/i.test(section) || 
          /(?:University|College|School|Institute)/i.test(section)) {
        education.push(section.trim());
      }
      
      // Stop when we hit another section header
      if (/^(?:experience|work|skills|certification|references|projects|language)/i.test(section.trim())) {
        inEducationSection = false;
      }
    }
  }
  
  return {
    name: possibleName || undefined,
    email: emails[0] || undefined,
    phone: phones[0] || undefined,
    skills: skills.slice(0, 10),  // Limit to top 10 skills
    experience: experience.slice(0, 5),  // Limit to top 5 experiences
    education: education.slice(0, 3)     // Limit to top 3 education entries
  };
}
