// @ts-ignore: Unreachable code error - This is a Deno script
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// CORS headers defined directly in the file
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

console.log('Nutrition Chat Edge Function loaded');

// Save message to the database
async function saveMessage(supabase, userId, role, content, metadata = null) {
  const { error } = await supabase
    .from('nutrition_chat_messages')
    .insert({
      user_id: userId,
      role: role,
      content: content,
      metadata: metadata
    });
  
  if (error) {
    console.error('Error saving message:', error);
    throw new Error('Failed to save message');
  }
}

// Get previous messages for context
async function getConversationHistory(supabase, userId, limit = 10) {
  const { data: messages, error } = await supabase
    .from('nutrition_chat_messages')
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

// Get user's nutrition profile if it exists
async function getUserNutritionProfile(supabase, userId) {
  const { data, error } = await supabase
    .from('nutrition_profiles')
    .select('*')
    .eq('user_id', userId)
    .single();
  
  if (error && error.code !== 'PGRST116') { // PGRST116 is not found error
    console.error('Error fetching nutrition profile:', error);
    throw new Error('Failed to fetch nutrition profile');
  }
  
  return data || null;
}

// Generate response using Fireworks AI with conversation context
async function generateResponse(messages, userId, nutritionProfile) {
  try {
    // Format messages for the API
    const apiMessages = messages.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'assistant',
      content: msg.content
    }));
    
    // Create system message with personalized context if available
    let systemContent = `You are a knowledgeable and supportive nutrition consultant named "Nutrient Sage". 
You provide evidence-based nutrition advice and meal planning guidance. 
You are NOT a licensed dietitian or medical professional, and you should always clarify this and encourage users to consult healthcare professionals for serious conditions.

Focus on providing practical, actionable nutrition advice that is sustainable and balanced. 
Avoid extreme diet recommendations and prioritize a whole-food approach.
Give concise answers (usually 1-3 paragraphs) and use a friendly, encouraging tone.`;

    // Add personalized context if nutrition profile exists
    if (nutritionProfile) {
      systemContent += `\n\nIMPORTANT USER CONTEXT:
Age: ${nutritionProfile.age || 'Unknown'}
Gender: ${nutritionProfile.gender || 'Unknown'}
Weight: ${nutritionProfile.weight ? `${nutritionProfile.weight} kg` : 'Unknown'}
Height: ${nutritionProfile.height ? `${nutritionProfile.height} cm` : 'Unknown'}
Activity Level: ${nutritionProfile.activity_level || 'Unknown'}
Health Goals: ${nutritionProfile.health_goals?.join(', ') || 'Not specified'}
Dietary Restrictions: ${nutritionProfile.dietary_restrictions?.join(', ') || 'None'}
Health Conditions: ${nutritionProfile.health_conditions?.join(', ') || 'None'}
Food Allergies: ${nutritionProfile.allergies?.join(', ') || 'None'}

Tailor your advice to this specific user profile. If they haven't provided certain information, you can gently suggest they complete their nutrition profile for more personalized guidance.`;
    } else {
      systemContent += `\n\nThe user hasn't completed their nutrition profile yet. You can suggest they fill out a nutrition assessment to receive more personalized advice.`;
    }

    // Add system message
    apiMessages.unshift({
      role: 'system',
      content: systemContent
    });
    
    // Generate response from Fireworks AI
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
    
    // Get user's nutrition profile if it exists
    const nutritionProfile = await getUserNutritionProfile(supabase, user_id);
    
    // Save user's message
    await saveMessage(supabase, user_id, 'user', message);
    
    // Get previous messages for context
    const previousMessages = await getConversationHistory(supabase, user_id);
    
    // Generate AI response with nutrition profile context
    const aiResponse = await generateResponse(previousMessages, user_id, nutritionProfile);
    
    // Save AI response
    await saveMessage(supabase, user_id, 'assistant', aiResponse);
    
    // Return the response
    return new Response(
      JSON.stringify({
        success: true,
        message: aiResponse,
        has_profile: !!nutritionProfile
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
