Deno.serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Max-Age': '86400',
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { bookId, chapterId, contentText, count = 10 } = await req.json();
    console.log(`[AI Flashcards] Generating flashcards for book ${bookId}`);

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

    // Create flashcard generation prompt
    const prompt = `Analyze this educational content and generate ${count} high-quality flashcards for spaced repetition learning.

Each flashcard should have:
1. question: A clear, focused question testing one concept
2. answer: A concise, accurate answer
3. difficulty: easy/medium/hard
4. tags: Array of relevant topic tags (2-3 tags)

Content: ${contentChunk}

Return a JSON array of flashcards. Example format:
[
  {
    "question": "What is photosynthesis?",
    "answer": "The process by which plants convert light energy into chemical energy",
    "difficulty": "easy",
    "tags": ["biology", "plants", "energy"]
  }
]

Return only valid JSON array, no markdown formatting. Generate exactly ${count} flashcards.`;

    // Call OpenRouter API
    const startTime = Date.now();
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openrouterApiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://z0cd8od18i80.space.minimax.io',
        'X-Title': 'Learnty AI Flashcard Generation'
      },
      body: JSON.stringify({
        model: 'mistralai/mistral-7b-instruct:free',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 3000,
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

    // Parse flashcards
    const cleanResponse = aiResponse.replace(/```json\n?|\n?```/g, '').trim();
    let flashcards;
    
    try {
      flashcards = JSON.parse(cleanResponse);
    } catch (e) {
      console.error('[AI Flashcards] Parse error:', e);
      throw new Error('Failed to parse AI response');
    }

    if (!Array.isArray(flashcards)) {
      throw new Error('Invalid flashcard format');
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
        operation_type: 'flashcard_generation',
        model_used: 'mistralai/mistral-7b-instruct:free',
        tokens_used: tokensUsed,
        execution_time_ms: executionTime,
        success: true,
        metadata: { book_id: bookId, flashcards_count: flashcards.length }
      })
    });

    // Save AI generated flashcards metadata
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
        content_type: 'flashcard',
        content_data: {
          flashcards: flashcards,
          source_chapter: chapterId,
          count: flashcards.length
        },
        quality_score: 0.85
      })
    });

    const aiContent = await aiContentResponse.json();
    const aiGenerationId = aiContent[0]?.id;

    // Insert flashcards into srs_cards table
    const cardsToInsert = flashcards.map((card, index) => ({
      user_id: userId,
      book_id: bookId,
      question: card.question,
      answer: card.answer,
      difficulty: card.difficulty || 'medium',
      tags: card.tags || [],
      ai_generated: true,
      ai_generation_id: aiGenerationId,
      ai_confidence: 0.85,
      easiness_factor: 2.5,
      interval: 0,
      repetitions: 0
    }));

    const cardsResponse = await fetch(`${supabaseUrl}/rest/v1/srs_cards`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'apikey': serviceRoleKey,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(cardsToInsert)
    });

    if (!cardsResponse.ok) {
      const errorText = await cardsResponse.text();
      console.error('[AI Flashcards] Card insertion failed:', errorText);
      throw new Error('Failed to save flashcards to database');
    }

    const insertedCards = await cardsResponse.json();

    console.log(`[AI Flashcards] Generated ${insertedCards.length} flashcards`);

    return new Response(JSON.stringify({
      data: {
        flashcards: insertedCards,
        count: insertedCards.length,
        aiGenerationId: aiGenerationId,
        tokensUsed
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[AI Flashcards] Error:', error);

    return new Response(JSON.stringify({
      error: {
        code: 'FLASHCARD_GENERATION_FAILED',
        message: error.message
      }
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
