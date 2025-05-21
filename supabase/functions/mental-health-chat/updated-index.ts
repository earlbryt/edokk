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

// Get or create chat session
async function getOrCreateChatSession(supabase, userId, existingSessionId = null) {
  console.log('Session ID received:', existingSessionId);
  
  // If we have an existing session ID, try to fetch that specific session
  if (existingSessionId) {
    try {
      const { data: sessionData, error: sessionError } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('id', existingSessionId)
        .eq('user_id', userId)
        .single();
      
      if (!sessionError && sessionData) {
        console.log('Found existing session:', sessionData.id);
        // Make sure the session is marked as active
        if (!sessionData.is_active) {
          const { error: updateError } = await supabase
            .from('chat_sessions')
            .update({ is_active: true, updated_at: new Date() })
            .eq('id', sessionData.id);
          
          if (updateError) {
            console.error('Error updating session active status:', updateError);
          }
        }
        return sessionData;
      }
    } catch (err) {
      console.error('Error fetching specific session:', err);
      // Fall through to creating a new session
    }
  }
  
  // Check if user has an active chat session
  const { data: existingSessions, error: sessionError } = await supabase
    .from('chat_sessions')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1);
  
  if (sessionError) {
    console.error('Error fetching active sessions:', sessionError);
    throw new Error('Failed to fetch chat session');
  }
  
  // If active session exists, return it
  if (existingSessions && existingSessions.length > 0) {
    console.log('Using most recent active session:', existingSessions[0].id);
    return existingSessions[0];
  }
  
  // Create a new session
  console.log('Creating new chat session for user:', userId);
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
  
  console.log('New session created:', newSession.id);
  return newSession;
}

// Get previous messages for context
async function getPreviousMessages(supabase, sessionId, limit = 10) {
  console.log('Fetching previous messages for session:', sessionId);
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
  
  console.log(`Retrieved ${messages?.length || 0} previous messages`);
  return messages || [];
}

// Save message to the database
async function saveMessage(supabase, sessionId, userId, role, content) {
  console.log(`Saving ${role} message for session ${sessionId}`);
  const { data, error } = await supabase
    .from('chat_messages')
    .insert({
      session_id: sessionId,
      user_id: userId,
      role: role,
      content: content
    })
    .select('*')
    .single();
  
  if (error) {
    console.error('Error saving message:', error);
    throw new Error('Failed to save message');
  }
  
  console.log('Message saved successfully, id:', data.id);
  return data;
}

// Generate response using Fireworks AI with conversation context
async function generateResponse(messages) {
  try {
    console.log('Preparing messages for LLM...');
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
    
    console.log(`Sending ${apiMessages.length} messages to Fireworks API`);
    
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
      throw new Error('Failed to generate response from LLM');
    }
    
    const data = await response.json();
    console.log('Received response from Fireworks API');
    
    return data.choices[0].message.content;
  } catch (error) {
    console.error('Error in generateResponse:', error);
    throw new Error(`Failed to generate response: ${error.message}`);
  }
}

// Handle chat request
Deno.serve(async (req) => {
  console.log('Received request:', req.method, req.url);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('Handling CORS preflight request');
    return new Response('ok', { headers: corsHeaders });
  }
  
  try {
    // Initialize Supabase client
    console.log('Initializing Supabase client');
    let supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    // Check if using service role or user context
    const authHeader = req.headers.get('Authorization');
    if (authHeader) {
      console.log('Authentication header found, using authorized client');
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
    } else {
      console.log('No authentication header found, using anonymous client');
    }
    
    // Parse request body
    const requestBody = await req.json();
    console.log('Request body received:', JSON.stringify(requestBody));
    
    const { user_id, message, session_id } = requestBody;
    
    if (!user_id || !message) {
      console.error('Missing required fields in request');
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }), 
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
    
    // Get or create user's chat session
    const session = await getOrCreateChatSession(supabase, user_id, session_id);
    
    // Save user's message
    const savedUserMessage = await saveMessage(supabase, session.id, user_id, 'user', message);
    
    // Get previous messages for context
    const previousMessages = await getPreviousMessages(supabase, session.id);
    
    // Generate AI response
    console.log('Generating AI response...');
    const aiResponse = await generateResponse(previousMessages);
    
    // Save AI response
    const savedAiMessage = await saveMessage(supabase, session.id, user_id, 'assistant', aiResponse);
    
    console.log('Successfully processed chat message');
    
    // Return the response
    return new Response(
      JSON.stringify({
        success: true,
        message: aiResponse,
        session_id: session.id,
        user_message_id: savedUserMessage.id,
        assistant_message_id: savedAiMessage.id
      }), 
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Edge function error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        stack: error.stack 
      }), 
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
