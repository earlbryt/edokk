// @ts-ignore: Unreachable code error - This is a Deno script
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// CORS headers defined directly in the file
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

// Save message to the database
async function saveMessage(supabase, userId, role, content) {
  const { error } = await supabase
    .from('herbal_chat_messages')
    .insert({
      user_id: userId,
      role: role,
      content: content
    });
  
  if (error) {
    console.error('Error saving message:', error);
    throw new Error('Failed to save message');
  }
}

// Get previous messages for context
async function getConversationHistory(supabase, userId, limit = 10) {
  const { data: messages, error } = await supabase
    .from('herbal_chat_messages')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false }) // Get newest messages first
    .limit(limit);

  if (error) {
    console.error('Error fetching message history:', error);
    throw new Error('Failed to fetch message history');
  }

  // Reverse the array to return messages in chronological order (oldest to newest)
  return (messages || []).reverse();
}

// Query Pinecone vector database for relevant herbal medicine information
async function queryPineconeVectorDB(query, topK = 2) {
  try {
    const PINECONE_API_KEY = Deno.env.get('PINECONE_API_KEY') || '';
    const FIREWORKS_API_KEY = Deno.env.get('FIREWORKS_API_KEY') || '';
    
    // Generate embeddings with Fireworks API using Nomic embedding model
    const embeddingResponse = await fetch('https://api.fireworks.ai/inference/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${FIREWORKS_API_KEY}`
      },
      body: JSON.stringify({
        model: 'nomic-ai/nomic-embed-text-v1.5', // Updated to Nomic embedding model
        input: query,
      })
    });
    
    if (!embeddingResponse.ok) {
      const errorText = await embeddingResponse.text();
      console.error('Embedding API error:', errorText);
      throw new Error('Failed to generate embedding');
    }
    
    const embeddingData = await embeddingResponse.json();
    const embedding = embeddingData.data[0].embedding;
    
    // Using the exact Pinecone setup from the notebook
    const pineconeApiUrl = 'https://afdic-xlclakz.svc.aped-4627-b74a.pinecone.io';
    
    // Query Pinecone directly with the exact structure used in the notebook
    const pineconeResponse = await fetch(`${pineconeApiUrl}/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Api-Key': PINECONE_API_KEY
      },
      body: JSON.stringify({
        vector: embedding,
        topK,
        includeMetadata: true
      })
    });
    
    if (!pineconeResponse.ok) {
      const errorText = await pineconeResponse.text();
      console.error('Pinecone API error:', errorText);
      throw new Error('Failed to query Pinecone');
    }
    
    const pineconeData = await pineconeResponse.json();
    console.log('Pinecone response:', JSON.stringify(pineconeData));
    
    // Return the matches directly as received from Pinecone
    return pineconeData.matches || [];
  } catch (error) {
    console.error('Error querying Pinecone:', error);
    throw new Error('Failed to query vector database: ' + error.message);
  }
}

// Function to clean model-specific tokens from the response
function cleanModelResponse(response: string): string {
  console.log('🧹 Raw response before cleaning:', response.substring(0, 100) + '...');
  
  // Remove header/formatting tokens that shouldn't be displayed to users
  const cleaned = response
    .replace(/<\|start_header_id\|>assistant<\|end_header_id\|>/g, '')
    .replace(/<\|start_header_id\|>user<\|end_header_id\|>/g, '')
    .replace(/<\|start_header_id\|>system<\|end_header_id\|>/g, '')
    .replace(/<\|end_header_id\|>/g, '')
    .replace(/<\|start_header_id\|>/g, '')
    .trim();
    
  console.log('✨ Cleaned response:', cleaned.substring(0, 100) + '...');
  return cleaned;
}

// Generate response using Fireworks AI with conversation context and Pinecone data
async function generateResponse(messages, userId) {
  try {
    // Format messages for the API
    const apiMessages = messages.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'assistant',
      content: msg.content
    }));
    
    // Get the latest user message to query Pinecone
    const latestUserMessage = messages
      .filter(msg => msg.role === 'user')
      .pop()?.content || '';
    
    // Query Pinecone for relevant herbal medicine information
    let contextFromPinecone = '';
    try {
      const matches = await queryPineconeVectorDB(latestUserMessage);
      console.log('🌿 Pinecone returned matches count:', matches.length);
      
      if (matches && matches.length > 0) {
        contextFromPinecone = matches
          .map((match, index) => {
            const metadata = match.metadata || {};
            // Check if the data is in the 'text' field (which contains all the CSV data)
            if (metadata.text) {
              console.log(`🍃 Processing match ${index + 1} with text data`);
              return `${index + 1}. ${metadata.text}`;
            } else {
              // Fallback to the old format if 'text' is not available
              console.log(`🍃 Processing match ${index + 1} with structured data`);
              return `${index + 1}. ${metadata.herb || 'Herb'}: ${metadata.description || 'No description'} (Conditions: ${metadata.conditions || 'Not specified'}, Preparation: ${metadata.preparation || 'Not specified'})`;
            }
          })
          .join('\n\n');
      }
    } catch (error) {
      console.error('Error getting Pinecone context:', error);
      // Continue without Pinecone context if there's an error
    }
    
    // Log retrieved information for debugging
    console.log('🌿 Retrieved herbal information for prompt:', contextFromPinecone || 'No specific information found');
    
    // Add system message with Pinecone context
    apiMessages.unshift({
      role: 'system',
      content: `You are a knowledgeable herbal medicine consultant named "Nature's Wisdom" specializing in traditional Ghanaian herbal remedies. 
You provide evidence-based information on traditional herbal remedies and natural treatments used in Ghana.
You are NOT a licensed medical professional, and you should always clarify this and encourage users to consult healthcare professionals for serious conditions.

IMPORTANT: Base your responses PRIMARILY on the following verified Ghanaian herbal medicine information from our database:

${contextFromPinecone || 'No specific herbal information found for this query. Stick to well-established, scientifically supported information only.'}

When responding to user queries:
1. If the database contains information relevant to the user's query, ALWAYS incorporate specific details about the herbal remedies including local names, preparation methods, and dosage.
2. If the database doesn't contain information relevant to the user's query, clearly state that you don't have specific information on that topic in your database of Ghanaian herbal medicines.
3. Be specific about which conditions each herb treats according to traditional Ghanaian medicine.
4. EXPLICITLY MENTION the information comes from your knowledge of traditional Ghanaian herbal medicine.

Focus on traditional uses in Ghanaian medicine, scientific evidence when available, preparation methods, and safety considerations.
Be respectful of traditional knowledge while maintaining scientific accuracy.
Give concise answers (usually 1-3 paragraphs) and use a warm, educational tone.`
    });
    
    console.log('🔮 System prompt created with context length:', apiMessages[0].content.length);
    
    // Log the complete system prompt
    console.log('\n\n===== COMPLETE SYSTEM PROMPT =====');
    console.log(apiMessages[0].content);
    console.log('===== END SYSTEM PROMPT =====\n\n');
    
    // Log all conversation messages that will be sent
    console.log('\n===== CONVERSATION CONTEXT =====');
    apiMessages.slice(1).forEach((msg, i) => {
      console.log(`[${msg.role}]: ${msg.content.substring(0, 100)}${msg.content.length > 100 ? '...' : ''}`);
    });
    console.log('===== END CONVERSATION CONTEXT =====\n');
    
    // Log the full API request body for complete visibility
    const requestBody = {
      model: 'accounts/fireworks/models/llama-v3p3-70b-instruct',
      messages: apiMessages,
      temperature: 0.7,
      max_tokens: 800
    };
    
    console.log('\n===== FULL LLM REQUEST =====');
    console.log(JSON.stringify(requestBody, null, 2));
    console.log('===== END LLM REQUEST =====\n');
    
    const FIREWORKS_API_KEY = Deno.env.get('FIREWORKS_API_KEY') || '';
    // Make sure apiMessages includes a system message followed by the conversation history
    console.log('📢 Verifying API message structure. Total messages:', apiMessages.length);
    console.log('📢 First message role:', apiMessages[0].role);
    
    // Ensure we have both system prompt and at least one user message
    if (apiMessages.length < 2 || apiMessages[0].role !== 'system') {
      console.error('❌ Invalid message structure - missing system prompt or user message');
    }

    // Make the API request with proper messages structure
    const response = await fetch('https://api.fireworks.ai/inference/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${FIREWORKS_API_KEY}`
      },
      body: JSON.stringify({
        model: 'accounts/fireworks/models/llama-v3p3-70b-instruct',
        messages: apiMessages,
        temperature: 0.7,
        max_tokens: 800
      })
    });
    
    console.log('📡 API request sent with', apiMessages.length, 'messages');
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Fireworks API error:', errorText);
      throw new Error('Failed to generate response');
    }
    
    const data = await response.json();
    const rawContent = data.choices[0].message.content;
    
    // Clean up any model-specific tokens from the response
    const cleanedContent = cleanModelResponse(rawContent);
    
    return cleanedContent;
  } catch (error) {
    console.error('Error generating response:', error);
    throw new Error('Failed to generate response');
  }
}

// Handle chat request
Deno.serve(async (req) => {
  console.log('🔄 Edge Function received request:', { method: req.method, url: req.url });
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('✅ Handling CORS preflight request');
    return new Response('ok', { headers: corsHeaders });
  }
  
  try {
    // Initialize Supabase client
    console.log('🔧 Setting up Supabase client');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
    const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') || '';
    console.log('🔑 Environment check:', { 
      hasPineconeKey: !!Deno.env.get('PINECONE_API_KEY'), 
      hasFireworksKey: !!Deno.env.get('FIREWORKS_API_KEY'),
      hasSupabaseUrl: !!SUPABASE_URL,
      hasSupabaseAnonKey: !!SUPABASE_ANON_KEY
    });
    
    let supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    // Check if using service role or user context
    const authHeader = req.headers.get('Authorization');
    console.log('🔑 Auth header check:', { hasAuthHeader: !!authHeader });
    
    if (authHeader) {
      console.log('🔑 Using auth header for Supabase client');
      supabase = createClient(
        SUPABASE_URL,
        SUPABASE_ANON_KEY,
        {
          global: {
            headers: {
              Authorization: authHeader,
            },
          },
        }
      );
    }
    
    // Parse request body
    console.log('📦 Parsing request body...');
    const { user_id, message } = await req.json();
    console.log('📦 Request data:', { user_id, messageLength: message?.length || 0 });
    
    if (!user_id || !message) {
      console.error('❌ Missing required fields:', { user_id: !!user_id, message: !!message });
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }), 
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
    
    // Save user's message
    console.log('💾 Saving user message to database...');
    await saveMessage(supabase, user_id, 'user', message);
    console.log('✅ User message saved');
    
    // Get previous messages for context
    console.log('💬 Getting conversation history...');
    const previousMessages = await getConversationHistory(supabase, user_id);
    console.log('✅ Conversation history retrieved:', { messageCount: previousMessages.length });
    
    // Generate AI response with Pinecone context
    console.log('🤖 Generating AI response with Pinecone context...');
    const aiResponse = await generateResponse(previousMessages, user_id);
    console.log('✅ AI response generated:', { responseLength: aiResponse.length });
    
    // Save AI response
    console.log('💾 Saving AI response to database...');
    await saveMessage(supabase, user_id, 'assistant', aiResponse);
    console.log('✅ AI response saved');
    
    // Return the response
    console.log('📩 Sending response back to client');
    return new Response(
      JSON.stringify({
        success: true,
        message: aiResponse
      }), 
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Edge function error:', error);
    return new Response(
      JSON.stringify({ error: error.message }), 
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
