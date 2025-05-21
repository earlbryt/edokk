import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.5.0';
import { corsHeaders } from '../_shared/cors.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') || '';
const FIREWORKS_API_KEY = Deno.env.get('FIREWORKS_API_KEY') || '';

// Get or create chat session
async function getOrCreateChatSession(supabase, userId) {
  // Check if user has an active chat session
  const { data: existingSession, error: sessionError } = await supabase
    .from('chat_sessions')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1);
  
  if (sessionError) {
    console.error('Error fetching chat session:', sessionError);
    throw new Error('Failed to fetch chat session');
  }
  
  // If active session exists, return it
  if (existingSession && existingSession.length > 0) {
    return existingSession[0];
  }
  
  // Create a new session
  const { data: newSession, error: createError } = await supabase
    .from('chat_sessions')
    .insert({
      user_id: userId,
      is_active: true
    })
    .select('*')
    .single();
  
  if (createError) {
    console.error('Error creating chat session:', createError);
    throw new Error('Failed to create chat session');
  }
  
  return newSession;
}

// Get previous messages for context
async function getPreviousMessages(supabase, sessionId, limit = 10) {
  const { data: messages, error } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true })
    .limit(limit);
  
  if (error) {
    console.error('Error fetching previous messages:', error);
    throw new Error('Failed to fetch previous messages');
  }
  
  return messages || [];
}

// Save message to the database
async function saveMessage(supabase, sessionId, userId, role, content) {
  const { error } = await supabase
    .from('chat_messages')
    .insert({
      session_id: sessionId,
      user_id: userId,
      role: role,
      content: content
    });
  
  if (error) {
    console.error('Error saving message:', error);
    throw new Error('Failed to save message');
  }
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
      content: `You are a compassionate, empathetic mental health assistant designed to provide support and guidance. 
Your name is eDok Assistant. You are not a licensed therapist or medical professional, but you can offer emotional support 
and evidence-based coping strategies. Always maintain a warm, non-judgmental tone. When users express serious mental health 
concerns or thoughts of self-harm, gently encourage them to seek professional help. If you don't know something, admit it 
instead of making up information. Focus on techniques like mindfulness, cognitive reframing, and healthy coping strategies.
Be concise in your responses, usually 1-3 paragraphs maximum.`
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
    console.log('Fireworks API response:', JSON.stringify(data));
    
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
      // Using the updated approach for authenticated requests
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
    
    // Get or create user's chat session
    const session = await getOrCreateChatSession(supabase, user_id);
    
    // Save user's message
    await saveMessage(supabase, session.id, user_id, 'user', message);
    
    // Get previous messages for context
    const previousMessages = await getPreviousMessages(supabase, session.id);
    
    // Generate AI response
    const aiResponse = await generateResponse(previousMessages);
    
    // Save AI response
    await saveMessage(supabase, session.id, user_id, 'assistant', aiResponse);
    
    // Return the response
    return new Response(
      JSON.stringify({
        success: true,
        message: aiResponse,
        session_id: session.id
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
