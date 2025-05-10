import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.6';

// Define the CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS'
};

// Create a Supabase client
const supabaseUrl = 'https://pbefndabvlaebfexhhnv.supabase.co';
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// Cerebras API key
const CEREBRAS_API_KEY = 'csk-k29xmn65yj9d65rd8ykhykftc9n4r68xhm8e8fev96pnpvtn';

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Parse the request body
    const { resume } = await req.json();
    console.log('Received request body:', resume);

    if (!resume || !resume.id || !resume.raw_text) {
      throw new Error('Resume ID and raw text are required');
    }

    console.log(`Processing resume with ID: ${resume.id}`);
    console.log('Raw text length:', resume.raw_text.length);

    // Prepare the system message and user prompt
    const messages = [
      {
        role: "system",
        content: "You are a resume parser that extracts structured information from resumes. You will return ONLY a JSON object with the following structure:\n{\n  \"name\": \"candidate's name\",\n  \"email\": \"email address\",\n  \"phone\": \"phone number\",\n  \"skills\": [\"skill1\", \"skill2\", ...],\n  \"experience\": [\"detailed experience 1\", \"detailed experience 2\", ...],\n  \"education\": [\"education entry 1\", \"education entry 2\", ...],\n  \"projects\": [\"project 1 details\", \"project 2 details\", ...],\n  \"awards\": [\"award 1 details\", \"award 2 details\", ...],\n  \"certifications\": [\"certification 1\", \"certification 2\", ...],\n  \"languages\": [\"language 1\", \"language 2\", ...],\n  \"publications\": [\"publication 1\", \"publication 2\", ...],\n  \"volunteer\": [\"volunteer experience 1\", \"volunteer experience 2\", ...]\n}\nOnly include fields that are present in the resume. Omit fields that are not found."
      },
      {
        role: "user",
        content: `Extract information from this resume:\n\n${resume.raw_text}`
      }
    ];

    console.log('Sending request to Cerebras API...');

    // Call Cerebras API using the chat completions endpoint
    const response = await fetch('https://api.cerebras.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CEREBRAS_API_KEY}`,
        'Content-Type': 'application/json',
        'User-Agent': 'Cerebras/1.0'
      },
      body: JSON.stringify({
        messages,
        model: "llama-3.3-70b",
        temperature: 0.3,
        max_tokens: 1000
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Cerebras API error response:', errorText);
      throw new Error(`Cerebras API error: ${response.statusText}`);
    }

    const result = await response.json();
    console.log('Cerebras API response:', result);
    
    // Extract the content from the response
    if (!result.choices?.[0]?.message?.content) {
      throw new Error('Invalid response format from Cerebras API');
    }

    const content = result.choices[0].message.content;
    console.log('LLM Response content:', content);

    // Parse the LLM response as JSON
    let parsedData;
    try {
      // Extract just the JSON part from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON object found in response');
      }
      const jsonStr = jsonMatch[0].trim();
      console.log('Attempting to parse JSON:', jsonStr);
      parsedData = JSON.parse(jsonStr);
    } catch (error) {
      console.error('Error parsing LLM response:', error);
      console.error('Raw response:', content);
      throw new Error('Failed to parse LLM response as JSON');
    }

    console.log('Successfully parsed response:', parsedData);

    // Start a transaction to update both tables
    const { data: summaryData, error: summaryError } = await supabase
      .from('summaries')
      .insert({
        cv_file_id: resume.id,
        name: parsedData.name,
        email: parsedData.email,
        phone: parsedData.phone,
        skills: parsedData.skills,
        experience: parsedData.experience,
        education: parsedData.education,
        projects: parsedData.projects,
        awards: parsedData.awards,
        certifications: parsedData.certifications,
        languages: parsedData.languages,
        publications: parsedData.publications,
        volunteer: parsedData.volunteer,
        raw_text: resume.raw_text,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (summaryError) {
      console.error('Error inserting into summaries table:', summaryError);
      throw summaryError;
    }

    // Update the cv_files table
    const { error: updateError } = await supabase
      .from('cv_files')
      .update({
        parsed_data: parsedData,
        status: 'completed',
        progress: 100,
        summary_id: summaryData.id // Link to the created summary
      })
      .eq('id', resume.id);

    if (updateError) {
      console.error('Error updating cv_files table:', updateError);
      throw updateError;
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          parsed_data: parsedData,
          summary_id: summaryData.id
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error processing resume:', error);

    // Update the file status to failed
    if (error.resume?.id) {
      await supabase
        .from('cv_files')
        .update({
          status: 'failed',
          error: error.message
        })
        .eq('id', error.resume.id);
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
}); 