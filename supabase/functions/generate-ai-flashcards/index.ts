// Edge Function: Generate AI Flashcards
// Enhanced with Neuroscience Principles: Elaborative Interrogation, Dual Coding, Active Recall

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
    console.log(`[AI Flashcards] Generating ${count} neuroscience-optimized flashcards for book ${bookId}`);

    if (!bookId || !contentText) {
      throw new Error('Book ID and content text are required');
    }

    // 🔐 SECURE: Get all credentials from environment variables (matching your Supabase secret names)
    const serviceRoleKey = Deno.env.get('SERVICE_ROLE_KEY');
    const supabaseUrl = Deno.env.get('BASE_URL');
    const openrouterApiKey = Deno.env.get('OPENROUTER_API_KEY');

    if (!serviceRoleKey || !supabaseUrl) {
      throw new Error('Supabase configuration missing. Set SERVICE_ROLE_KEY and BASE_URL.');
    }

    if (!openrouterApiKey) {
      throw new Error('OPENROUTER_API_KEY not configured. Please set in Supabase Edge Functions secrets.');
    }

    // Get user authentication
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

    // Prepare content (limit to 10000 chars for better processing)
    const contentChunk = contentText.substring(0, 10000);

    // Enhanced flashcard generation prompt with neuroscience principles
    const prompt = `Generate ${count} neuroscience-optimized flashcards using advanced learning science principles.

🧠 NEUROSCIENCE PRINCIPLES TO APPLY:

1. **ELABORATIVE INTERROGATION**: 
   - Questions should ask "why" and "how" (not just "what")
   - Promote deeper processing and understanding
   - Connect to prior knowledge and real-world examples

2. **DUAL CODING THEORY**:
   - Include visual/spatial cues in answers
   - Combine verbal and imagery information
   - Use concrete analogies and metaphors

3. **ACTIVE RECALL OPTIMIZATION**:
   - Questions should trigger retrieval practice
   - Avoid recognition-only questions (no "fill in the blank")
   - Force generation of answer from memory

4. **CHUNKING STRATEGY**:
   - One clear concept per card (no compound questions)
   - Break complex ideas into digestible pieces
   - Follow 7±2 rule for information chunks

5. **EMOTIONAL ENGAGEMENT**:
   - Add relatable examples or mini-stories
   - Connect to personal relevance
   - Use surprising facts or interesting contexts

6. **SPACING-OPTIMIZED DIFFICULTY**:
   - **Easy**: Simple recall, definitions, basic facts (intervals: 1d, 3d, 7d, 14d, 30d)
   - **Medium**: Understanding, explaining, application (intervals: 1d, 4d, 10d, 21d, 45d)
   - **Hard**: Analysis, synthesis, evaluation (intervals: 1d, 5d, 15d, 35d, 70d)

✅ FLASHCARD QUALITY STANDARDS:

✓ ONE concept per card (atomic knowledge units)
✓ Clear, unambiguous questions
✓ Concise answers (1-3 sentences max)
✓ Include memory anchors (acronyms, analogies, visual cues)
✓ Add context or application examples
✓ Use active voice and direct language
✓ Avoid yes/no questions (require explanation)
✓ Front-load important words (primacy effect)

🎯 MEMORY TECHNIQUE INTEGRATION:

- **Acronyms**: Create memorable word shortcuts
- **Visualization**: "Picture this..." or "Imagine..."
- **Story**: Embed facts in mini-narratives
- **Analogy**: "It's like..." comparisons
- **Location**: Associate with familiar places
- **Emotion**: Connect to feelings or experiences

📚 CONTENT TO ANALYZE:
${contentChunk}

📝 OUTPUT FORMAT:

Return a JSON array with this enhanced structure:

[
  {
    "question": "Why does [concept] occur? Explain the mechanism.",
    "answer": "[Concise explanation]. Think of it like [analogy/visual].",
    "difficulty": "easy" | "medium" | "hard",
    "tags": ["topic1", "topic2", "concept"],
    "memory_technique": "acronym" | "visualization" | "story" | "analogy" | "association",
    "memory_hook": "Brief memorable phrase, image, or mnemonic",
    "application_example": "Real-world usage or practical application",
    "elaboration_prompt": "Follow-up 'why' question for deeper understanding"
  }
]

🎯 EXAMPLE FLASHCARD:

{
  "question": "Why does the spacing effect improve long-term retention?",
  "answer": "Spacing creates 'desirable difficulty' - your brain works harder to retrieve information, strengthening neural pathways. Think of it like muscle training: multiple short workouts beat one marathon session.",
  "difficulty": "medium",
  "tags": ["memory", "learning-science", "retention"],
  "memory_technique": "analogy",
  "memory_hook": "Muscles need rest to grow, memories need spacing to stick",
  "application_example": "Review flashcards today, tomorrow, then in 3 days instead of cramming all at once",
  "elaboration_prompt": "Why do neural pathways strengthen more with spacing?"
}

⚠️ IMPORTANT:
- Generate EXACTLY ${count} flashcards
- Return ONLY valid JSON array (no markdown, no explanations)
- Ensure every flashcard follows the quality standards
- Vary difficulty levels appropriately
- Include diverse memory techniques
- Make questions thought-provoking, not just fact recall

Generate neuroscience-optimized flashcards now:`;

    // Call OpenRouter API
    const startTime = Date.now();
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openrouterApiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://learnty.app',
        'X-Title': 'Learnty AI Flashcard Generation'
      },
      body: JSON.stringify({
        model: 'mistralai/mistral-7b-instruct:free',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 4000,
        temperature: 0.8,
        response_format: { type: 'json_object' }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[AI Flashcards] OpenRouter error:', errorText);
      throw new Error(`OpenRouter API error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content;
    
    if (!aiResponse) {
      throw new Error('No response from AI');
    }

    // Parse flashcards with robust error handling
    const cleanResponse = aiResponse.replace(/```json\n?|\n?```/g, '').trim();
    let flashcards;
    
    try {
      const parsed = JSON.parse(cleanResponse);
      flashcards = Array.isArray(parsed) ? parsed : (parsed.flashcards || []);
    } catch (e) {
      console.error('[AI Flashcards] Parse error:', e);
      console.error('[AI Flashcards] Response:', cleanResponse);
      throw new Error('Failed to parse AI response. The AI may need to retry.');
    }

    if (!Array.isArray(flashcards) || flashcards.length === 0) {
      throw new Error('No valid flashcards generated');
    }

    // Log AI usage for analytics
    const executionTime = Date.now() - startTime;
    const tokensUsed = data.usage?.total_tokens || Math.floor(aiResponse.length / 4);
    
    try {
      await fetch(`${supabaseUrl}/rest/v1/ai_usage_logs`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${serviceRoleKey}`,
          'apikey': serviceRoleKey,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          user_id: userId,
          operation_type: 'flashcard_generation',
          model_used: 'mistralai/mistral-7b-instruct:free',
          tokens_used: tokensUsed,
          execution_time_ms: executionTime,
          success: true,
          metadata: { 
            book_id: bookId, 
            flashcards_count: flashcards.length,
            neuroscience_enhanced: true
          }
        })
      });
    } catch (logError) {
      console.error('[AI Flashcards] Logging error:', logError);
    }

    // Save AI generated content metadata
    let aiGenerationId = null;
    try {
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
            count: flashcards.length,
            enhancement_version: 'neuroscience-v2',
            techniques_used: flashcards.map(f => f.memory_technique).filter(Boolean)
          },
          quality_score: 0.90
        })
      });

      if (aiContentResponse.ok) {
        const aiContent = await aiContentResponse.json();
        aiGenerationId = aiContent[0]?.id;
      }
    } catch (metaError) {
      console.error('[AI Flashcards] Metadata save error:', metaError);
    }

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
      ai_confidence: 0.90,
      easiness_factor: 2.5,
      interval: 0,
      repetitions: 0,
      metadata: {
        memory_technique: card.memory_technique,
        memory_hook: card.memory_hook,
        application_example: card.application_example,
        elaboration_prompt: card.elaboration_prompt,
        neuroscience_optimized: true
      }
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

    console.log(`[AI Flashcards] ✅ Successfully generated ${insertedCards.length} neuroscience-optimized flashcards`);

    return new Response(JSON.stringify({
      data: {
        flashcards: insertedCards,
        count: insertedCards.length,
        aiGenerationId: aiGenerationId,
        tokensUsed,
        enhancements: {
          neuroscience_principles: [
            'elaborative_interrogation',
            'dual_coding',
            'active_recall',
            'chunking',
            'emotional_engagement'
          ],
          memory_techniques_used: [...new Set(flashcards.map(f => f.memory_technique).filter(Boolean))]
        }
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[AI Flashcards] Error:', error);

    return new Response(JSON.stringify({
      error: {
        code: 'FLASHCARD_GENERATION_FAILED',
        message: error.message || 'Failed to generate flashcards',
        suggestion: 'Try with a smaller content chunk or different content section'
      }
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});