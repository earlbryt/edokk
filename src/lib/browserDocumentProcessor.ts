
import * as pdfjsLib from 'pdfjs-dist';
import { supabase } from '@/integrations/supabase/client';
import mammoth from 'mammoth';
import { read, utils } from 'xlsx';

// Load the PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

/**
 * Extracts text from a PDF file in the browser
 */
export async function extractTextFromPDF(file: File): Promise<string> {
  try {
    // Validate that the file is a PDF before attempting to process
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    if (!isPdf) {
      throw new Error('The specified file is not a valid PDF.');
    }
    
    // Get the file as an ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    
    // Adding extra error handling for PDF.js
    try {
      // First try to load the PDF document
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      
      let fullText = '';
      
      // Extract text from each page
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const textItems = textContent.items.map((item: any) => item.str);
        fullText += textItems.join(' ') + '\n';
      }
      
      // Check if any text was actually extracted
      if (!fullText.trim()) {
        console.warn('PDF processed successfully but no text was extracted');
      }
      
      return fullText;
    } catch (pdfError) {
      // Handle PDF.js specific errors
      console.error('PDF.js error:', pdfError);
      if (pdfError.message && pdfError.message.includes('Invalid PDF structure')) {
        throw new Error('Invalid PDF structure. The file appears to be corrupt or not a valid PDF.');
      }
      throw pdfError; // Rethrow other PDF.js errors
    }
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    throw new Error(`Failed to extract text: ${error.message}`);
  }
}

/**
 * Extracts text from a DOCX file in the browser using mammoth.js
 */
export async function extractTextFromDOCX(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value;
  } catch (error) {
    console.error('Error extracting text from DOCX:', error);
    throw new Error(`Failed to extract text from DOCX: ${error.message}`);
  }
}

/**
 * Extracts text from a DOC file in the browser
 * Note: This is more complex as DOC is a binary format
 * This implementation uses a basic approach with xlsx library which can sometimes extract text from DOC files
 */
export async function extractTextFromDOC(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = read(arrayBuffer, { type: 'array' });
    
    let fullText = '';
    
    // Try to extract text from all sheets
    workbook.SheetNames.forEach(sheetName => {
      const worksheet = workbook.Sheets[sheetName];
      const json = utils.sheet_to_json(worksheet, { header: 1 });
      json.forEach((row: any) => {
        if (Array.isArray(row)) {
          fullText += row.join(' ') + '\n';
        }
      });
    });
    
    if (!fullText.trim()) {
      throw new Error('No text could be extracted from the DOC file');
    }
    
    return fullText;
  } catch (error) {
    console.error('Error extracting text from DOC:', error);
    throw new Error(`Failed to extract text from DOC: ${error.message}`);
  }
}

/**
 * Identifies the type of document
 */
function identifyDocumentType(file: File): 'pdf' | 'docx' | 'doc' | 'unsupported' {
  // Check MIME type first
  if (file.type === 'application/pdf') {
    return 'pdf';
  } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    return 'docx';
  } else if (file.type === 'application/msword') {
    return 'doc';
  }
  
  // If MIME type is not reliable, check file extension
  const fileName = file.name.toLowerCase();
  if (fileName.endsWith('.pdf')) {
    return 'pdf';
  } else if (fileName.endsWith('.docx')) {
    return 'docx';
  } else if (fileName.endsWith('.doc')) {
    return 'doc';
  }
  
  return 'unsupported';
}

/**
 * Gets a user-friendly error message for document processing errors
 */
function getUserFriendlyErrorMessage(error: any, fileType: string): string {
  const errorMessage = error?.message || 'Unknown error occurred';
  
  // Check for specific error patterns and provide more helpful messages
  if (errorMessage.includes('invalid pdf structure') || errorMessage.includes('not a pdf file')) {
    if (fileType === 'pdf') {
      return 'The PDF file appears to be corrupt or invalid. Please try uploading a different PDF file.';
    } else {
      return `The file was detected as ${fileType.toUpperCase()} but could not be processed correctly. Please check that it's a valid ${fileType.toUpperCase()} file.`;
    }
  }
  
  if (errorMessage.includes('Failed to extract text from DOCX') || errorMessage.includes('Failed to extract text from DOC')) {
    return `Unable to extract text from your ${fileType.toUpperCase()} file. It may be corrupt or password-protected.`;
  }
  
  if (errorMessage.includes('Unsupported file type')) {
    return 'This file type is not supported. Please upload a PDF, DOCX, or DOC file.';
  }
  
  return errorMessage;
}

/**
 * Processes a document in the browser - placeholder for new implementation
 */
export async function processDocumentInBrowser(fileId: string, file: File): Promise<{success: boolean, error?: string}> {
  try {
    // Identify the file type
    const fileType = identifyDocumentType(file);

    if (fileType === 'unsupported') {
      console.log(`Unsupported file type: ${file.name}. Only PDF, DOCX, and DOC files are supported.`);
      return { success: false, error: `Unsupported file type: ${file.name}. Only PDF, DOCX, and DOC files are supported.` };
    }
    
    console.log(`Processing ${fileType} file: ${file.name}`);
    console.log('This is a placeholder for the new backend implementation');
    
    // Return a simulated successful processing
    return { 
      success: true
    };
  } catch (error) {
    console.error('Error in browser document processor:', error);
    
    // Get user-friendly error message
    const fileTypeVar = identifyDocumentType(file);
    const userFriendlyError = getUserFriendlyErrorMessage(error, fileTypeVar);
    
    return { success: false, error: userFriendlyError };
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
