
import { Groq } from 'groq-sdk';
import * as pdfParse from 'pdf-parse';
import * as mammoth from 'mammoth';

// Initialize the Groq client with the API key from environment variables
const groq = new Groq({
  apiKey: import.meta.env.NEXT_PUBLIC_GROQ_API_KEY || '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',
  dangerouslyAllowBrowser: true, // Allow usage in browser environments
});

/**
 * IMPORTANT: For production use, you'll need to install libraries for document processing:
 * 
 * For PDF parsing:
 * - npm install pdf-parse
 * 
 * For DOC/DOCX parsing:
 * - npm install mammoth
 * 
 * For browser-based applications, you would need server-side processing,
 * as these libraries typically don't work directly in browsers.
 */

/**
 * Extracts text from a PDF file
 */
async function extractTextFromPDF(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const data = await pdfParse(buffer);
    return data.text;
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    throw new Error(`Failed to process PDF: ${error.message}`);
  }
}

/**
 * Extracts text from a Word document (DOC/DOCX)
 */
async function extractTextFromWord(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  } catch (error) {
    console.error('Error extracting text from Word document:', error);
    throw new Error(`Failed to process Word document: ${error.message}`);
  }
}

/**
 * Preprocesses the extracted text to improve quality
 */
function preprocessText(text: string): string {
  // Remove excessive newlines and whitespace
  let processed = text.replace(/\n{3,}/g, '\n\n').trim();
  
  // NLP preprocessing can be added here if needed
  // We're removing the problematic nlp call
  
  // You can perform additional processing here, such as:
  // - Removing headers/footers
  // - Removing page numbers
  // - Fixing common OCR errors
  
  return processed;
}

/**
 * Extracts text from a document file (PDF, DOC, DOCX)
 */
export async function extractTextFromDocument(file: File): Promise<string> {
  try {
    let text: string;
    
    // Extract text based on file type
    if (file.type === 'application/pdf') {
      text = await extractTextFromPDF(file);
    } else if (
      file.type === 'application/msword' || 
      file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ) {
      text = await extractTextFromWord(file);
    } else {
      throw new Error('Unsupported file type');
    }
    
    // Preprocess the extracted text
    const processedText = preprocessText(text);
    return processedText;
    
  } catch (error) {
    console.error('Error extracting text from document:', error);
    throw new Error(`Failed to process document: ${error.message}`);
  }
}

/**
 * Analyzes a document using Groq's LLM and returns a summary
 */
export async function analyzeDocumentWithGroq(text: string): Promise<string> {
  try {
    // Create a prompt for the LLM to analyze the document
    const prompt = `
You are an expert document analyzer. Your task is to analyze the following document text:

DOCUMENT CONTENT:
${text.substring(0, 15000)} ${text.length > 15000 ? '... [text truncated due to length]' : ''}

Please provide:
1. A concise summary of the document (2-3 paragraphs)
2. The main topics or themes covered
3. Key points and important details
4. Any notable insights or conclusions

Format your response in a clear, readable manner with appropriate sections.
    `;

    // Call the Groq API for analysis
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.3,
      max_tokens: 1000,
    });

    const summary = chatCompletion.choices[0]?.message?.content || 'Failed to generate summary';
    return summary;
    
  } catch (error) {
    console.error('Error analyzing document with Groq:', error);
    throw new Error(`Failed to analyze document with Groq: ${error.message}`);
  }
}

/**
 * Process a document: extract text and analyze with Groq
 * @param file The file to process
 * @param progressCallback Optional callback for progress updates
 */
export async function processDocument(
  file: File, 
  progressCallback?: (progress: number) => void
): Promise<{
  text: string;
  summary: string;
}> {
  try {
    // Start processing
    progressCallback?.(10);
    
    // Extract text from document
    const text = await extractTextFromDocument(file);
    progressCallback?.(50);
    
    // Analyze the text with Groq
    const summary = await analyzeDocumentWithGroq(text);
    progressCallback?.(100);
    
    return {
      text,
      summary
    };
  } catch (error) {
    console.error("Document processing failed:", error);
    throw error;
  }
} 
