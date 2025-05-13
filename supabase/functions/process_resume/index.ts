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

    // First, fetch available positions from the database
    const { data: positions, error: positionsError } = await supabase
      .from('positions')
      .select('title, key_skills, qualifications');
    
    if (positionsError) {
      console.error('Error fetching positions:', positionsError);
      // Continue with regular parsing even if positions can't be fetched
    }
    
    // Create a string representation of available positions for the prompt
    let positionsContext = '';
    if (positions && positions.length > 0) {
      positionsContext = 'Available positions with key skills and qualifications:\n';
      positions.forEach(position => {
        positionsContext += `Position: ${position.title}\n`;
        positionsContext += `Key Skills: ${position.key_skills.join(', ')}\n`;
        positionsContext += `Qualifications: ${position.qualifications.join(', ')}\n\n`;
      });
    }

    // Prepare the system message and user prompt
    const messages = [
      {
        role: "system",
        content: `You are a resume parser that extracts structured information from resumes and infers potential job positions. You will return ONLY a JSON object with the following structure:
{
  "name": "candidate's name",
  "email": "email address",
  "phone": "phone number",
  "skills": ["skill1", "skill2", ...],
  "experience": ["detailed experience 1", "detailed experience 2", ...],
  "education": ["education entry 1", "education entry 2", ...],
  "projects": ["project 1 details", "project 2 details", ...],
  "awards": ["award 1 details", "award 2 details", ...],
  "certifications": ["certification 1", "certification 2", ...],
  "languages": ["language 1", "language 2", ...],
  "publications": ["publication 1", "publication 2", ...],
  "volunteer": ["volunteer experience 1", "volunteer experience 2", ...],
  "suggested_positions": [
    {
      "position": "Position Title",
      "confidence": 85, // A number between 0-100 indicating confidence level
      "reason": "Brief explanation of why this position is a good match"
    },
    {...} // Up to 3 positions total, ordered by confidence
  ]
}

For the suggested_positions field, analyze the candidate's skills, experience, and education to determine which positions they would be best qualified for. Only include positions with a confidence level of 70% or higher. Limit to a maximum of 3 positions, prioritizing those with the highest confidence.

Only include fields that are present in the resume. Omit fields that are not found.`
      },
      {
        role: "user",
        content: `Extract information from this resume and suggest potential positions:\n\n${positionsContext}\n\nRESUME:\n${resume.raw_text}`
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

    // Extract suggested positions from the parsed data
    const suggestedPositions = parsedData.suggested_positions || [];
    console.log('Suggested positions:', suggestedPositions);

    // Store the parsed data in Supabase
    const { data: summaryData, error: summaryError } = await supabase
      .from('summaries')
      .insert({
        cv_file_id: resume.id,
        extracted_data: parsedData,
        summary: null, // We're not generating a summary text at this point
        name: parsedData.name,
        email: parsedData.email,
        phone: parsedData.phone,
        skills: parsedData.skills || [],
        experience: parsedData.experience || [],
        education: parsedData.education || [],
        projects: parsedData.projects || [],
        awards: parsedData.awards || [],
        certifications: parsedData.certifications || [],
        languages: parsedData.languages || [],
        publications: parsedData.publications || [],
        volunteer: parsedData.volunteer || [],
        raw_text: resume.raw_text,
        suggested_positions: suggestedPositions
      })
      .select()
      .single();

    if (summaryError) {
      console.error('Error inserting into summaries table:', summaryError);
      throw summaryError;
    }

    // Store the inferred positions in the candidate_positions table
    if (suggestedPositions && suggestedPositions.length > 0) {
      console.log('Storing candidate positions...');
      const positionInserts = suggestedPositions.map(pos => ({
        cv_file_id: resume.id,
        position: pos.position,
        confidence: pos.confidence,
      }));

      const { error: positionsError } = await supabase
        .from('candidate_positions')
        .insert(positionInserts);

      if (positionsError) {
        console.error('Error storing candidate positions:', positionsError);
        // Continue with the process even if storing positions fails
      }
    }

    // Update the cv_file with parsed_data and summary_id
    const { error: updateError } = await supabase
      .from('cv_files')
      .update({
        parsed_data: parsedData,
        status: 'completed',
        summary_id: summaryData?.id
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