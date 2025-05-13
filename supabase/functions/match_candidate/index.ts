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
    const { candidate_id, project_id, filter_group_id, position_id } = await req.json();
    console.log('Received request to match candidate:', { candidate_id, project_id, filter_group_id, position_id });

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

    // Step 1: Get the resume text and candidate information
    const { data: cvFiles, error: cvError } = await supabase
      .from('cv_files')
      .select('id, raw_text, project_id, summary_id')
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
    
    // Get the candidate's suggested positions and parsed data
    const cvFile = cvFiles[0];
    let candidatePositions = [];
    let candidateSkills = [];
    
    // If summary_id exists, get the parsed data and skills
    if (cvFile.summary_id) {
      const { data: summaryData, error: summaryError } = await supabase
        .from('summaries')
        .select('skills, suggested_positions')
        .eq('id', cvFile.summary_id)
        .single();
        
      if (!summaryError && summaryData) {
        candidateSkills = summaryData.skills || [];
        if (summaryData.suggested_positions) {
          candidatePositions = summaryData.suggested_positions;
        }
      }
    }
    
    // Also check the candidate_positions table (which is the primary record of positions)
    if (candidatePositions.length === 0) {
      const { data: positions, error: posError } = await supabase
        .from('candidate_positions')
        .select('position, confidence')
        .eq('cv_file_id', candidate_id)
        .order('confidence', { ascending: false });
        
      if (!posError && positions && positions.length > 0) {
        candidatePositions = positions.map(p => ({
          position: p.position,
          confidence: p.confidence
        }));
      }
    }
    
    console.log('Candidate suggested positions:', candidatePositions);
    
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

    // Step 2: Determine which requirements to use based on position
    let targetPositionId = position_id;
    let targetPositionName = '';
    let requirementContext = '';
    
    // If no position_id was provided but we have suggested positions,
    // use the most relevant suggested position
    if (!targetPositionId && candidatePositions.length > 0) {
      // Find the position with highest confidence
      const topPosition = candidatePositions[0];
      targetPositionName = topPosition.position;
      
      // Try to find the position ID in the database based on title
      const { data: positionData, error: posError } = await supabase
        .from('positions')
        .select('id, title, description, key_skills, qualifications')
        .eq('title', targetPositionName)
        .eq('project_id', project_id);
      
      if (!posError && positionData && positionData.length > 0) {
        targetPositionId = positionData[0].id;
        requirementContext = `\nPosition: ${positionData[0].title}\n`;
        if (positionData[0].description) {
          requirementContext += `Description: ${positionData[0].description}\n`;
        }
        if (positionData[0].key_skills && positionData[0].key_skills.length > 0) {
          requirementContext += `Key Skills: ${positionData[0].key_skills.join(', ')}\n`;
        }
        if (positionData[0].qualifications && positionData[0].qualifications.length > 0) {
          requirementContext += `Qualifications: ${positionData[0].qualifications.join(', ')}\n`;
        }
      }
    }
    
    console.log('Target position ID:', targetPositionId);
    console.log('Target position name:', targetPositionName);

    // Step 3: Get the requirements
    let requirements = [];
    let filterGroupInfo = null;
    
    if (filter_group_id) {
      // Case 1: A specific filter group was requested
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
      
      filterGroupInfo = filterGroups[0];
      requirements = filterGroupInfo.filters || [];
    }
    else if (targetPositionId) {
      // Case 2: We have a position ID, so get position-specific filter groups
      const { data: positionFilterGroups, error: posFilterError } = await supabase
        .from('filter_groups')
        .select('*, filters(*)')
        .eq('position_id', targetPositionId)
        .eq('project_id', project_id)
        .eq('enabled', true);
      
      if (!posFilterError && positionFilterGroups && positionFilterGroups.length > 0) {
        // Use the first position-specific filter group
        filterGroupInfo = positionFilterGroups[0];
        requirements = filterGroupInfo.filters || [];
      }
      
      // If no position-specific requirements, fall back to project requirements
      if (requirements.length === 0) {
        const { data: projectFilterGroups, error: projFilterError } = await supabase
          .from('filter_groups')
          .select('*, filters(*)')
          .is('position_id', null) // Only get filter groups not tied to a position
          .eq('project_id', project_id)
          .eq('enabled', true);
        
        if (!projFilterError && projectFilterGroups && projectFilterGroups.length > 0) {
          filterGroupInfo = projectFilterGroups[0];
          requirements = filterGroupInfo.filters || [];
        }
      }
    }
    else {
      // Case 3: No specific position or filter group, use all project requirements
      const { data: filterGroups, error: filterGroupsError } = await supabase
        .from('filter_groups')
        .select('*, filters(*)')
        .eq('project_id', project_id)
        .eq('enabled', true);

      if (filterGroupsError) {
        throw new Error(`Error fetching filter groups: ${filterGroupsError.message}`);
      }
      
      if (filterGroups && filterGroups.length > 0) {
        filterGroupInfo = filterGroups[0];
        requirements = filterGroups.flatMap(group => group.filters || []);
      }
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
      
    // Add candidate skills context to help LLM
    let skillsContext = '';
    if (candidateSkills && candidateSkills.length > 0) {
      skillsContext = `\nExtracted candidate skills: ${candidateSkills.join(', ')}\n`;
    }

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

${targetPositionName ? `POSITION: ${targetPositionName}\n` : ''}
${requirementContext}
REQUIREMENTS:
${formattedRequirements}
${skillsContext}
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

    // Create a requirement_scores object to store how well the candidate matched each requirement
    const requirementScores = {};
    if (requirements && requirements.length > 0) {
      requirements.forEach(req => {
        // Default score is 0.5 (neutral match)
        requirementScores[req.id] = {
          type: req.type,
          value: req.value,
          required: req.required,
          // We don't have individual scores from the LLM, so use rating as a proxy
          score: parsedData.rating === 'A' ? 1.0 : 
                 parsedData.rating === 'B' ? 0.75 : 
                 parsedData.rating === 'C' ? 0.5 : 0.25
        };
      });
    }
    
    // Insert into candidate_ratings table
    const { data: rating, error: insertError } = await supabase
      .from('candidate_ratings')
      .insert({
        cv_file_id: candidate_id,
        project_id: project_id,
        filter_group_id: filterGroupInfo?.id || null,
        position_id: targetPositionId || null,  // Store the position this rating is for
        rating: parsedData.rating,
        rating_reason: parsedData.reason,
        requirement_scores: requirementScores  // Store detailed requirement matching
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting rating:', insertError);
      throw insertError;
    }

    // Include extra information in the response
    return new Response(
      JSON.stringify({
        success: true,
        data: rating,
        position_info: {
          position_id: targetPositionId,
          position_name: targetPositionName,
          suggested_positions: candidatePositions
        }
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
