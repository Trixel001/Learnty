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
    const { bookId, bookText } = await req.json();
    console.log(`[OpenRouter AI] Starting for book ${bookId}, text length: ${bookText?.length || 0}`);

    if (!bookId || !bookText) {
      throw new Error('Book ID and text content are required');
    }

    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const openrouterApiKey = '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';

    if (!serviceRoleKey || !supabaseUrl) {
      throw new Error('Supabase configuration missing');
    }

    // Get user from auth header
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');

    // Get user ID
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

    // Helper to log AI usage
    const logAIUsage = async (operation: string, tokensUsed: number, success: boolean, error?: string) => {
      try {
        await fetch(`${supabaseUrl}/rest/v1/ai_usage_logs`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            user_id: userId,
            operation_type: operation,
            model_used: 'mistralai/mistral-7b-instruct:free',
            tokens_used: tokensUsed,
            success,
            error_message: error,
            metadata: { book_id: bookId }
          })
        });
      } catch (e) {
        console.error('Failed to log AI usage:', e);
      }
    };

    // Helper to update book status
    const updateBookStatus = async (status: string, details?: any) => {
      console.log(`[OpenRouter AI] Updating book ${bookId} status to: ${status}`);
      try {
        const updateData: any = { processing_status: status };
        if (details) {
          updateData.processing_details = details;
        }
        
        await fetch(`${supabaseUrl}/rest/v1/books?id=eq.${bookId}`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(updateData)
        });
      } catch (error) {
        console.error(`[OpenRouter AI] Error updating status:`, error);
      }
    };

    // Helper to call OpenRouter API
    const callOpenRouterAPI = async (prompt: string, maxTokens: number, maxRetries = 3): Promise<string> => {
      const startTime = Date.now();
      
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          console.log(`[OpenRouter AI] API attempt ${attempt}/${maxRetries}`);
          
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 90000); // 90 second timeout
          
          const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${openrouterApiKey}`,
              'Content-Type': 'application/json',
              'HTTP-Referer': 'https://z0cd8od18i80.space.minimax.io',
              'X-Title': 'Learnty AI Study Platform'
            },
            body: JSON.stringify({
              model: 'mistralai/mistral-7b-instruct:free',
              messages: [
                {
                  role: 'user',
                  content: prompt
                }
              ],
              max_tokens: maxTokens,
              temperature: 0.7
            }),
            signal: controller.signal
          });

          clearTimeout(timeoutId);

          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`OpenRouter API error: ${response.status} ${errorText}`);
          }

          const data = await response.json();
          const text = data.choices?.[0]?.message?.content;
          
          if (!text) {
            throw new Error('No response from OpenRouter API');
          }

          const executionTime = Date.now() - startTime;
          const tokensUsed = data.usage?.total_tokens || Math.floor(text.length / 4);
          
          // Log successful usage
          await logAIUsage(`book_processing_attempt_${attempt}`, tokensUsed, true);

          return text;
        } catch (error) {
          console.error(`[OpenRouter AI] Attempt ${attempt} failed:`, error);
          
          if (attempt === maxRetries) {
            const executionTime = Date.now() - startTime;
            await logAIUsage('book_processing_failed', 0, false, error.message);
            throw error;
          }
          
          // Wait before retry (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        }
      }
      
      throw new Error('Max retries exceeded');
    };

    // Chunk text if too long (max 100K characters for safety)
    const maxChars = 100000;
    const textChunk = bookText.substring(0, maxChars);

    // Store extracted text in database
    const contentHash = await crypto.subtle.digest(
      'SHA-256',
      new TextEncoder().encode(textChunk)
    ).then(buffer => {
      return Array.from(new Uint8Array(buffer))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
    });

    await fetch(`${supabaseUrl}/rest/v1/books?id=eq.${bookId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'apikey': serviceRoleKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        extracted_text: textChunk,
        content_hash: contentHash
      })
    });

    // Update processing status
    await updateBookStatus('analyzing', { 
      startTime: new Date().toISOString(),
      textLength: textChunk.length 
    });

    // Create AI prompts
    const summaryPrompt = `Analyze this educational book content and provide a JSON response with:
1. title: Extracted title
2. author: Extracted author name  
3. summary: 2-3 sentence summary
4. topics: Array of main topics/subjects (max 5)
5. difficulty: Learning difficulty level (beginner/intermediate/advanced)
6. estimatedMinutes: Estimated reading time in minutes
7. learningObjectives: Array of key learning objectives (3-5 points)
8. genre: Book genre/category

Content preview: ${textChunk.substring(0, 8000)}

Return only valid JSON, no markdown formatting.`;

    const chapterPrompt = `Analyze this book and break it down into logical learning sections. Provide a JSON array where each object has:
1. chapterNumber: Sequential number
2. title: Chapter/section title
3. summary: Brief summary
4. learningObjectives: Array of objectives for this section
5. difficultyLevel: beginner/intermediate/advanced
6. estimatedMinutes: Time needed for this section

Content preview: ${textChunk.substring(0, 8000)}

Return only valid JSON array, no markdown formatting. Aim for 5-8 chapters.`;

    // Update to processing_chapters status
    await updateBookStatus('processing_chapters', { 
      stage: 'calling_ai_apis',
      timestamp: new Date().toISOString() 
    });

    // Call OpenRouter APIs with retry logic
    console.log('[OpenRouter AI] Starting parallel AI analysis...');
    const [summaryText, chapterText] = await Promise.all([
      callOpenRouterAPI(summaryPrompt, 2048),
      callOpenRouterAPI(chapterPrompt, 3072)
    ]);

    console.log('[OpenRouter AI] AI analysis complete, parsing responses...');

    // Parse responses
    let analysis;
    let chapters = [];
    
    try {
      const cleanSummaryText = summaryText.replace(/```json\n?|\n?```/g, '').trim();
      analysis = JSON.parse(cleanSummaryText);
      console.log('[OpenRouter AI] Summary parsed successfully');
    } catch (e) {
      console.error('[OpenRouter AI] Failed to parse summary:', e);
      throw new Error(`Failed to parse AI summary response: ${e.message}`);
    }

    try {
      const cleanChapterText = chapterText.replace(/```json\n?|\n?```/g, '').trim();
      chapters = JSON.parse(cleanChapterText);
      console.log(`[OpenRouter AI] Chapters parsed successfully: ${chapters.length} chapters`);
    } catch (e) {
      console.error('[OpenRouter AI] Failed to parse chapters:', e);
      chapters = [];
    }

    // Update book with AI analysis
    console.log('[OpenRouter AI] Updating book with AI analysis...');
    const updateResponse = await fetch(`${supabaseUrl}/rest/v1/books?id=eq.${bookId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'apikey': serviceRoleKey,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        title: analysis.title || 'Unknown',
        author: analysis.author || 'Unknown',
        genre: analysis.genre || 'General',
        processing_status: 'completed',
        processing_details: {
          completedAt: new Date().toISOString(),
          chaptersGenerated: chapters.length,
          aiProvider: 'OpenRouter',
          aiModel: 'mistral-7b-instruct'
        },
        ai_analysis: {
          summary: analysis.summary,
          topics: analysis.topics || [],
          difficulty: analysis.difficulty || 'intermediate',
          estimatedMinutes: analysis.estimatedMinutes || 60,
          learningObjectives: analysis.learningObjectives || [],
          processedAt: new Date().toISOString()
        },
        ai_metadata: {
          provider: 'openrouter',
          model: 'mistralai/mistral-7b-instruct:free',
          processedAt: new Date().toISOString()
        }
      })
    });

    if (!updateResponse.ok) {
      const errorText = await updateResponse.text();
      throw new Error(`Failed to update book: ${errorText}`);
    }

    const updatedBooks = await updateResponse.json();

    // Insert chapters if available
    let actualChaptersCreated = 0;
    
    if (chapters.length > 0) {
      try {
        console.log(`[OpenRouter AI] Inserting ${chapters.length} chapters...`);
        
        const chaptersToInsert = chapters.map((chapter, index) => ({
          book_id: bookId,
          user_id: userId,
          chapter_number: chapter.chapterNumber || index + 1,
          title: chapter.title || `Chapter ${index + 1}`,
          summary: chapter.summary || '',
          learning_objectives: chapter.learningObjectives || [],
          difficulty_level: chapter.difficultyLevel || 'intermediate',
          estimated_minutes: chapter.estimatedMinutes || 30
        }));

        const chaptersInsertResponse = await fetch(`${supabaseUrl}/rest/v1/book_chapters`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          },
          body: JSON.stringify(chaptersToInsert)
        });

        if (chaptersInsertResponse.ok) {
          const insertedChapters = await chaptersInsertResponse.json();
          actualChaptersCreated = insertedChapters.length;
          console.log(`[OpenRouter AI] Successfully inserted ${actualChaptersCreated} chapters`);
        }
      } catch (error) {
        console.error(`[OpenRouter AI] Chapter insertion error:`, error);
      }
    }

    console.log(`[OpenRouter AI] Process completed for book ${bookId}`);
    return new Response(JSON.stringify({
      data: {
        book: updatedBooks[0],
        analysis,
        chaptersGenerated: chapters.length,
        chaptersCreated: actualChaptersCreated,
        processingTime: new Date().toISOString()
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[OpenRouter AI] Error:', error);

    return new Response(JSON.stringify({
      error: {
        code: 'AI_PROCESSING_FAILED',
        message: error.message,
        timestamp: new Date().toISOString()
      }
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
