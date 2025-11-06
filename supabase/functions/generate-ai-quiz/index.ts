Deno.serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Max-Age': '86400',
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { bookId, chapterId, contentText, questionCount = 5 } = await req.json();
    console.log(`[AI Quiz] Generating quiz for book ${bookId}`);

    if (!bookId || !contentText) {
      throw new Error('Book ID and content text are required');
    }

    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const openrouterApiKey = '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';

    if (!serviceRoleKey || !supabaseUrl) {
      throw new Error('Supabase configuration missing');
    }

    // Get user
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'apikey': serviceRoleKey
      }
    });

    if (!userResponse.ok) {
      throw new Error('Failed to authenticate user');
    }

    const userData = await userResponse.json();
    const userId = userData.id;

    // Prepare content (limit to 8000 chars)
    const contentChunk = contentText.substring(0, 8000);

    // Create quiz generation prompt
    const prompt = `Analyze this educational content and generate ${questionCount} multiple-choice quiz questions to test understanding.

Each question should have:
1. question: Clear question text
2. options: Array of 4 answer options (A, B, C, D)
3. correctAnswer: The correct option letter (A/B/C/D)
4. explanation: Brief explanation of why the answer is correct
5. difficulty: easy/medium/hard
6. topic: Main topic being tested

Content: ${contentChunk}

Return a JSON array of quiz questions. Example format:
[
  {
    "question": "What is the primary function of mitochondria?",
    "options": ["Protein synthesis", "Energy production", "DNA storage", "Cell division"],
    "correctAnswer": "B",
    "explanation": "Mitochondria are the powerhouse of the cell, producing ATP through cellular respiration",
    "difficulty": "medium",
    "topic": "Cell Biology"
  }
]

Return only valid JSON array, no markdown formatting. Generate exactly ${questionCount} questions.`;

    // Call OpenRouter API
    const startTime = Date.now();
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openrouterApiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://z0cd8od18i80.space.minimax.io',
        'X-Title': 'Learnty AI Quiz Generation'
      },
      body: JSON.stringify({
        model: 'mistralai/mistral-7b-instruct:free',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 2500,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenRouter API error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content;
    
    if (!aiResponse) {
      throw new Error('No response from AI');
    }

    // Parse quiz questions
    const cleanResponse = aiResponse.replace(/```json\n?|\n?```/g, '').trim();
    let quizQuestions;
    
    try {
      quizQuestions = JSON.parse(cleanResponse);
    } catch (e) {
      console.error('[AI Quiz] Parse error:', e);
      throw new Error('Failed to parse AI response');
    }

    if (!Array.isArray(quizQuestions)) {
      throw new Error('Invalid quiz format');
    }

    // Log AI usage
    const executionTime = Date.now() - startTime;
    const tokensUsed = data.usage?.total_tokens || Math.floor(aiResponse.length / 4);
    
    await fetch(`${supabaseUrl}/rest/v1/ai_usage_logs`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'apikey': serviceRoleKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        user_id: userId,
        operation_type: 'quiz_generation',
        model_used: 'mistralai/mistral-7b-instruct:free',
        tokens_used: tokensUsed,
        execution_time_ms: executionTime,
        success: true,
        metadata: { book_id: bookId, questions_count: quizQuestions.length }
      })
    });

    // Save quiz as AI generated content
    const aiContentResponse = await fetch(`${supabaseUrl}/rest/v1/ai_generated_content`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'apikey': serviceRoleKey,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        user_id: userId,
        book_id: bookId,
        content_type: 'quiz',
        content_data: {
          questions: quizQuestions,
          source_chapter: chapterId,
          questionCount: quizQuestions.length
        },
        quality_score: 0.85,
        is_approved: false
      })
    });

    const aiContent = await aiContentResponse.json();

    console.log(`[AI Quiz] Generated ${quizQuestions.length} questions`);

    return new Response(JSON.stringify({
      data: {
        quiz: aiContent[0],
        questions: quizQuestions,
        questionCount: quizQuestions.length,
        tokensUsed
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[AI Quiz] Error:', error);

    return new Response(JSON.stringify({
      error: {
        code: 'QUIZ_GENERATION_FAILED',
        message: error.message
      }
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
