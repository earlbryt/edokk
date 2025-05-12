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

// Cerebras API key - using the same key as the process_resume function
const CEREBRAS_API_KEY = 'csk-k29xmn65yj9d65rd8ykhykftc9n4r68xhm8e8fev96pnpvtn';

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Check for Content-Type header
    const contentType = req.headers.get('Content-Type') || '';
    if (!contentType.includes('application/json')) {
      return new Response(
        JSON.stringify({ error: 'Content-Type must be application/json' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse the request body
    const { candidate_id, project_id, filter_group_id } = await req.json();
    console.log('Received request to match candidate:', { candidate_id, project_id, filter_group_id });

    if (!candidate_id || !project_id) {
      return new Response(
        JSON.stringify({ success: false, error: 'Candidate ID and Project ID are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if we already have a rating for this candidate in this project
    const { data: existingRatings, error: ratingError } = await supabase
      .from('candidate_ratings')
      .select('*')
      .eq('cv_file_id', candidate_id)
      .eq('project_id', project_id);

    if (ratingError) {
      console.error('Error checking existing ratings:', ratingError);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Error checking existing ratings: ' + ratingError.message
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    if (existingRatings && existingRatings.length > 0) {
      const existingRating = existingRatings[0];
      console.log('Found existing rating:', existingRating);
      return new Response(
        JSON.stringify({
          success: true,
          data: existingRating
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Step 1: Get the resume text
    const { data: cvFiles, error: cvError } = await supabase
      .from('cv_files')
      .select('raw_text, project_id')
      .eq('id', candidate_id);

    if (cvError) {
      return new Response(
        JSON.stringify({
          success: false,
          error: `Error fetching CV: ${cvError.message}`
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    if (!cvFiles || cvFiles.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'CV file not found'
        }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
    
    const cvFile = cvFiles[0];

    if (!cvFile.raw_text) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'No raw text found for this candidate'
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const resumeText = cvFile.raw_text;
    console.log('Resume text length:', resumeText.length);

    // Step 2: Get the requirements
    let requirements = [];
    if (filter_group_id) {
      // Get requirements from the specified filter group
      const { data: filterGroups, error: filterGroupError } = await supabase
        .from('filter_groups')
        .select('*, filters(*)')
        .eq('id', filter_group_id)
        .eq('project_id', project_id);

      if (filterGroupError) {
        return new Response(
          JSON.stringify({
            success: false,
            error: `Error fetching filter group: ${filterGroupError.message}`
          }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }
      
      if (!filterGroups || filterGroups.length === 0) {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Filter group not found or not associated with this project'
          }),
          {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }
      
      const filterGroup = filterGroups[0];
      requirements = filterGroup.filters;
    } else {
      // Get all enabled filter groups for the project
      const { data: filterGroups, error: filterGroupsError } = await supabase
        .from('filter_groups')
        .select('*, filters(*)')
        .eq('project_id', project_id)
        .eq('enabled', true);

      if (filterGroupsError) {
        throw new Error(`Error fetching filter groups: ${filterGroupsError.message}`);
      }
      // Combine all filters from all enabled groups
      requirements = filterGroups.flatMap(group => group.filters || []);
    }

    if (requirements.length === 0) {
      throw new Error('No requirements found for this project');
    }

    console.log('Found requirements:', requirements);

    // Format requirements for the LLM
    const formattedRequirements = requirements
      .map(req => {
        return `${req.type}: ${req.value}${req.required ? ' (REQUIRED)' : ''}`;
      })
      .join('\n');

    // Prepare the system message and user prompt
    const messages = [
      {
        role: "system",
        content: `You are an expert recruiter that evaluates candidates against job requirements. You will analyze a resume and a set of job requirements to categorize the candidate into one of four categories:
        
Category A: Candidates who match all required criteria and most other criteria. These are excellent matches.
Category B: Candidates who match most required criteria and some other criteria. These are good matches.
Category C: Candidates who match some criteria but miss key requirements. These need further review.
Category D: Candidates who match few or no requirements. These are poor matches.

Respond with a JSON object in the following format:
{
  "rating": "A", // Must be exactly one of "A", "B", "C", or "D"
  "reason": "A detailed explanation of why the candidate received this rating, referencing specific requirements and how they match or don't match the resume."
}

Be objective and fair in your assessment. The rating must be based solely on how well the candidate's qualifications match the given requirements.`
      },
      {
        role: "user",
        content: `Please evaluate this candidate's resume against the following job requirements:

REQUIREMENTS:
${formattedRequirements}

RESUME:
${resumeText}`
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
        temperature: 0.2,
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

    // Validate the rating
    if (!parsedData.rating || !['A', 'B', 'C', 'D'].includes(parsedData.rating)) {
      throw new Error('Invalid rating in LLM response');
    }

    // Insert into candidate_ratings table
    const { data: rating, error: insertError } = await supabase
      .from('candidate_ratings')
      .insert({
        cv_file_id: candidate_id,
        project_id: project_id,
        filter_group_id: filter_group_id || null,
        rating: parsedData.rating,
        rating_reason: parsedData.reason
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting rating:', insertError);
      throw insertError;
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: rating
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error matching candidate:', error);
    // Ensure we always have a proper error message
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
