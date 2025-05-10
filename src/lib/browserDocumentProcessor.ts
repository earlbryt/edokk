
import * as pdfjsLib from 'pdfjs-dist';
import { supabase } from '@/integrations/supabase/client';

// Load the PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

/**
 * Extracts text from a PDF file in the browser
 */
export async function extractTextFromPDF(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    
    let fullText = '';
    
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const textItems = textContent.items.map((item: any) => item.str);
      fullText += textItems.join(' ') + '\n';
    }
    
    return fullText;
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    throw new Error(`Failed to extract text: ${error.message}`);
  }
}

/**
 * Processes a document in the browser and updates the database with extracted text
 */
export async function processDocumentInBrowser(fileId: string, file: File): Promise<{success: boolean, error?: string}> {
  try {
    // Update the status to processing
    await supabase
      .from('cv_files')
      .update({
        status: 'processing',
        progress: 50
      })
      .eq('id', fileId);
    
    // Extract text based on file type
    let extractedText = '';
    
    if (file.type === 'application/pdf') {
      extractedText = await extractTextFromPDF(file);
    } else if (file.name.endsWith('.doc') || file.name.endsWith('.docx')) {
      // For now, we'll just handle PDFs, but could add doc/docx support later
      throw new Error('DOC/DOCX extraction not implemented yet');
    } else {
      throw new Error(`Unsupported file type: ${file.type}`);
    }
    
    if (!extractedText) {
      throw new Error('No text could be extracted from the document');
    }
    
    // Basic parsing of the extracted text
    const parsed = parseExtractedText(extractedText);
    
    // Update the database with the extracted text and parsed data
    const { error } = await supabase
      .from('cv_files')
      .update({
        status: 'completed',
        progress: 100,
        raw_text: extractedText,
        text_extracted: true,
        text_extraction_date: new Date().toISOString(),
        parsed_data: parsed
      })
      .eq('id', fileId);
    
    if (error) throw error;
    
    return { success: true };
  } catch (error) {
    console.error('Error in browser document processor:', error);
    
    // Update the error status
    await supabase
      .from('cv_files')
      .update({
        status: 'failed',
        error: error.message || 'Unknown error processing document'
      })
      .eq('id', fileId);
    
    return { success: false, error: error.message };
  }
}

/**
 * Basic parsing of the extracted text to identify contact information and sections
 */
function parseExtractedText(text: string): {
  name?: string;
  email?: string;
  phone?: string;
  skills: string[];
  experience: string[];
  education: string[];
} {
  // This is a simplified parser that could be enhanced later
  const lines = text.split('\n').filter(line => line.trim().length > 0);
  
  // Try to extract email
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/;
  const emailMatch = text.match(emailRegex);
  const email = emailMatch ? emailMatch[0] : undefined;
  
  // Try to extract phone number - this is a simplified regex for demonstration
  const phoneRegex = /\b(\+\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/;
  const phoneMatch = text.match(phoneRegex);
  const phone = phoneMatch ? phoneMatch[0] : undefined;
  
  // Use the first line as a name (a simplistic approach)
  const name = lines.length > 0 ? lines[0] : undefined;
  
  // Extract sections - this is very simplified
  const skills: string[] = [];
  const experience: string[] = [];
  const education: string[] = [];
  
  let currentSection = '';
  
  for (const line of lines) {
    const lowercaseLine = line.toLowerCase();
    
    if (lowercaseLine.includes('skill') || lowercaseLine.includes('technologies') || lowercaseLine.includes('tools')) {
      currentSection = 'skills';
      continue;
    } else if (lowercaseLine.includes('experience') || lowercaseLine.includes('employment') || lowercaseLine.includes('work')) {
      currentSection = 'experience';
      continue;
    } else if (lowercaseLine.includes('education') || lowercaseLine.includes('degree') || lowercaseLine.includes('university')) {
      currentSection = 'education';
      continue;
    }
    
    if (currentSection === 'skills' && line.trim()) {
      // Split by commas if present
      const skillList = line.split(',').map(skill => skill.trim());
      skills.push(...skillList);
    } else if (currentSection === 'experience' && line.trim()) {
      experience.push(line.trim());
    } else if (currentSection === 'education' && line.trim()) {
      education.push(line.trim());
    }
  }
  
  return {
    name,
    email,
    phone,
    skills,
    experience,
    education
  };
}
