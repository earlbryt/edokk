// @ts-ignore: Unreachable code error - This is a Deno script
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Pinecone } from 'https://esm.sh/@pinecone-database/pinecone@1.1.0';
import { corsHeaders } from '../_shared/cors.ts';

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
    .order('created_at', { ascending: true })
    .limit(limit);
  
  if (error) {
    console.error('Error fetching message history:', error);
    throw new Error('Failed to fetch message history');
  }
  
  return messages || [];
}

// Query Pinecone vector database for relevant herbal medicine information
async function queryPineconeVectorDB(query, topK = 3) {
  try {
    const PINECONE_API_KEY = Deno.env.get('PINECONE_API_KEY') || '';
    
    // Initialize Pinecone client
    const pinecone = new Pinecone({
      apiKey: PINECONE_API_KEY,
    });

    // Get the index - using the afdic index as specified
    const index = pinecone.index('afdic');
    
    // First, we need to get the vector embedding for the query
    const FIREWORKS_API_KEY = Deno.env.get('FIREWORKS_API_KEY') || '';
    const embeddingResponse = await fetch('https://api.fireworks.ai/inference/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${FIREWORKS_API_KEY}`
      },
      body: JSON.stringify({
        model: 'accounts/fireworks/models/embed-v2',
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
    
    // Query the Pinecone index with the embedding
    const queryResponse = await index.query({
      vector: embedding,
      topK,
      includeMetadata: true,
    });
    
    return queryResponse.matches;
  } catch (error) {
    console.error('Error querying Pinecone:', error);
    throw new Error('Failed to query vector database');
  }
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
      
      if (matches && matches.length > 0) {
        contextFromPinecone = matches
          .map((match, index) => {
            const metadata = match.metadata || {};
            return `${index + 1}. ${metadata.herb || 'Herb'}: ${metadata.description || 'No description'} (Conditions: ${metadata.conditions || 'Not specified'}, Preparation: ${metadata.preparation || 'Not specified'})`;
          })
          .join('\n\n');
      }
    } catch (error) {
      console.error('Error getting Pinecone context:', error);
      // Continue without Pinecone context if there's an error
    }
    
    // Add system message with Pinecone context
    apiMessages.unshift({
      role: 'system',
      content: `You are a knowledgeable herbal medicine consultant named "Nature's Wisdom". 
You provide evidence-based information on traditional herbal remedies and natural treatments.
You are NOT a licensed medical professional, and you should always clarify this and encourage users to consult healthcare professionals for serious conditions.

IMPORTANT: Base your responses PRIMARILY on the following verified herbal medicine information from our database:

${contextFromPinecone || 'No specific herbal information found for this query. Stick to well-established, scientifically supported information only.'}

If the database doesn't contain information relevant to the user's query, CLEARLY STATE that you don't have specific information on that topic rather than making up remedies. ONLY provide general, widely accepted information about herbal medicine in such cases.

Focus on traditional uses, scientific evidence when available, preparation methods, and safety considerations. 
Be respectful of traditional knowledge while maintaining scientific accuracy.
Give concise answers (usually 1-3 paragraphs) and use a warm, educational tone.`
    });
    
    const FIREWORKS_API_KEY = Deno.env.get('FIREWORKS_API_KEY') || '';
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
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Fireworks API error:', errorText);
      throw new Error('Failed to generate response');
    }
    
    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('Error generating response:', error);
    throw new Error('Failed to generate response');
  }
}

// Handle chat request
Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  
  try {
    // Initialize Supabase client
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
    const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') || '';
    
    let supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    // Check if using service role or user context
    const authHeader = req.headers.get('Authorization');
    if (authHeader) {
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
    const { user_id, message } = await req.json();
    
    if (!user_id || !message) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }), 
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
    
    // Save user's message
    await saveMessage(supabase, user_id, 'user', message);
    
    // Get previous messages for context
    const previousMessages = await getConversationHistory(supabase, user_id);
    
    // Generate AI response with Pinecone context
    const aiResponse = await generateResponse(previousMessages, user_id);
    
    // Save AI response
    await saveMessage(supabase, user_id, 'assistant', aiResponse);
    
    // Return the response
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
