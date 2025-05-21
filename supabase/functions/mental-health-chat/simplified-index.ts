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

// Generate response using Fireworks AI
async function generateResponse(userMessage) {
  try {
    // Format messages for the API - just a simple one-off conversation
    const messages = [
      {
        role: 'system',
        content: `You are a compassionate, empathetic mental health guide called "Serene Companion". 
You provide mindful wellness support and guidance. You are not a licensed therapist or medical professional, but you can offer emotional support 
and evidence-based coping strategies. Always maintain a warm, non-judgmental, and calming tone. When users express serious mental health 
concerns or thoughts of self-harm, gently encourage them to seek professional help. If you don't know something, admit it 
instead of making up information. Focus on techniques like mindfulness, cognitive reframing, and healthy coping strategies.
Be concise in your responses, usually 1-3 paragraphs maximum.

Your responses should foster a sense of peace and presence. Use calming language and avoid clinical or technical jargon unless necessary.`
      },
      {
        role: 'user',
        content: userMessage
      }
    ];
    
    const response = await fetch('https://api.fireworks.ai/inference/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${FIREWORKS_API_KEY}`
      },
      body: JSON.stringify({
        model: 'accounts/fireworks/models/llama-v3p3-70b-instruct',
        messages: messages,
        temperature: 0.7,
        max_tokens: 800
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Fireworks API error: ${errorText}`);
    }
    
    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('Error generating response:', error);
    throw error;
  }
}

// Handle chat request
Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  
  try {
    // Parse request body
    const { message } = await req.json();
    
    if (!message) {
      return new Response(
        JSON.stringify({ error: 'Missing message field' }), 
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
    
    // Generate AI response directly - no database or session management
    const aiResponse = await generateResponse(message);
    
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
