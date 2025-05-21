import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.5.0';

// CORS headers for Edge Functions
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') || '';
const FIREWORKS_API_KEY = Deno.env.get('FIREWORKS_API_KEY') || '';

// Save message to the database - without session ID
async function saveMessage(supabase, userId, role, content) {
  const { error } = await supabase
    .from('chat_messages')
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

// Get previous messages for context - without session ID
async function getConversationHistory(supabase, userId, limit = 10) {
  const { data: messages, error } = await supabase
    .from('chat_messages')
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

// Generate response using Fireworks AI with conversation context
async function generateResponse(messages) {
  try {
    // Format messages for the API
    const apiMessages = messages.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'assistant',
      content: msg.content
    }));
    
    // Add system message for context
    apiMessages.unshift({
      role: 'system',
      content: `You are a compassionate, empathetic mental health guide called "Serene Companion". 
You provide mindful wellness support and guidance. You are not a licensed therapist or medical professional, but you can offer emotional support 
and evidence-based coping strategies. Always maintain a warm, non-judgmental, and calming tone. When users express serious mental health 
concerns or thoughts of self-harm, gently encourage them to seek professional help. If you don't know something, admit it 
instead of making up information. Focus on techniques like mindfulness, cognitive reframing, and healthy coping strategies.
Be concise in your responses, usually 1-3 paragraphs maximum.

Your responses should foster a sense of peace and presence. Use calming language and avoid clinical or technical jargon unless necessary.`
    });
    
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
    
    // Generate AI response
    const aiResponse = await generateResponse(previousMessages);
    
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
