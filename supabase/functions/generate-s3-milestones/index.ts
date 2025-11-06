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
    const { bookId, userId } = await req.json();

    if (!bookId || !userId) {
      throw new Error('Book ID and User ID are required');
    }

    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const openrouterApiKey = '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';

    if (!serviceRoleKey || !supabaseUrl) {
      throw new Error('Missing required environment variables');
    }

    console.log(`OpenRouter S3 Gen: Starting S3 milestone generation for book ${bookId}, user ${userId}`);

    // Get book and chapters data
    const [bookResponse, chaptersResponse] = await Promise.all([
      fetch(`${supabaseUrl}/rest/v1/books?id=eq.${bookId}&select=*`, {
        headers: {
          'Authorization': `Bearer ${serviceRoleKey}`,
          'apikey': serviceRoleKey
        }
      }),
      fetch(`${supabaseUrl}/rest/v1/book_chapters?book_id=eq.${bookId}&order=chapter_number`, {
        headers: {
          'Authorization': `Bearer ${serviceRoleKey}`,
          'apikey': serviceRoleKey
        }
      })
    ]);

    if (!bookResponse.ok || !chaptersResponse.ok) {
      throw new Error('Failed to fetch book or chapters data');
    }

    const books = await bookResponse.json();
    const chapters = await chaptersResponse.json();

    if (books.length === 0) {
      throw new Error('Book not found');
    }

    const book = books[0];
    console.log(`OpenRouter S3 Gen: Processing book: ${book.title} with ${chapters.length} chapters`);

    // Create a project for this learning path
    const projectResponse = await fetch(`${supabaseUrl}/rest/v1/projects`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'apikey': serviceRoleKey,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        book_id: bookId,
        user_id: userId,
        title: `Learning Path: ${book.title}`,
        description: `S3 methodology learning path generated from "${book.title}" with structured milestones and adaptive difficulty progression.`,
        project_type: 's3_learning_path',
        status: 'active',
        completion_percentage: 0
      })
    });

    if (!projectResponse.ok) {
      throw new Error('Failed to create learning project');
    }

    const projects = await projectResponse.json();
    const projectId = projects[0].id;

    let allMilestones = [];
    let totalEstimatedMinutes = 0;

    // Process each chapter into S3 milestones
    for (let chapterIndex = 0; chapterIndex < chapters.length; chapterIndex++) {
      const chapter = chapters[chapterIndex];
      console.log(`Processing chapter ${chapter.chapter_number}: ${chapter.title}`);

      // Generate S3 breakdown for this chapter using Llama via OpenRouter
      const s3Prompt = `Break down this learning chapter into 3-5 Small Simple Steps (S3) milestones following cognitive science principles:

Chapter: ${chapter.title}
Summary: ${chapter.summary}
Learning Objectives: ${chapter.learning_objectives?.join(', ') || 'Not specified'}
Difficulty: ${chapter.difficulty_level}
Estimated Time: ${chapter.estimated_minutes} minutes

Apply S3 methodology principles:
1. Each milestone should be 15-30 minutes of focused learning
2. Break complex concepts into digestible chunks
3. Ensure logical progression and dependencies
4. Include specific, measurable learning objectives
5. Provide key concepts for spaced repetition

Return a JSON array where each milestone object has:
- title: Clear, actionable title (e.g., "Understanding Basic Concepts")
- description: 2-3 sentence description of what will be learned
- estimatedMinutes: Time needed (15-30 minutes)
- difficultyLevel: "beginner", "intermediate", or "advanced"
- learningObjectives: Array of specific objectives (3-4 items)
- keyConcepts: Array of key terms/concepts for SRS cards (5-8 items)
- contentPreview: Brief preview of main content points

Return only valid JSON array, no markdown formatting.`;

      const openrouterResponse = await fetch(
        'https://openrouter.ai/api/v1/chat/completions',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openrouterApiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://z0cd8od18i80.space.minimax.io',
            'X-Title': 'Learnty S3 Learning Path Generator'
          },
          body: JSON.stringify({
            model: 'mistralai/mistral-7b-instruct:free',
            messages: [{ role: 'user', content: s3Prompt }],
            max_tokens: 4000,
            temperature: 0.7
          })
        }
      );

      let chapterMilestones = [];
      if (openrouterResponse.ok) {
        const openrouterData = await openrouterResponse.json();
        const aiResponse = openrouterData.choices?.[0]?.message?.content;
        
        if (aiResponse) {
          try {
            const cleanText = aiResponse.replace(/```json\n?|\n?```/g, '').trim();
            chapterMilestones = JSON.parse(cleanText);
            console.log(`OpenRouter S3 Gen: Generated ${chapterMilestones.length} milestones for chapter ${chapter.chapter_number}`);
          } catch (e) {
            console.error(`OpenRouter S3 Gen: Failed to parse milestones for chapter ${chapter.chapter_number}:`, e);
            // Fallback: create default milestones
            chapterMilestones = createFallbackMilestones(chapter);
          }
        }
      } else {
        console.error(`OpenRouter S3 Gen: API failed for chapter ${chapter.chapter_number}`);
        chapterMilestones = createFallbackMilestones(chapter);
      }

      // Prepare milestone records for database insertion
      const orderOffset = allMilestones.length;
      const milestonesToInsert = chapterMilestones.map((milestone, index) => {
        const estimatedMinutes = milestone.estimatedMinutes || 20;
        totalEstimatedMinutes += estimatedMinutes;
        
        return {
          project_id: projectId,
          book_id: bookId,
          chapter_id: chapter.id,
          user_id: userId,
          title: milestone.title || `${chapter.title} - Part ${index + 1}`,
          description: milestone.description || '',
          order_index: orderOffset + index,
          difficulty_level: milestone.difficultyLevel || chapter.difficulty_level || 'intermediate',
          estimated_minutes: estimatedMinutes,
          learning_objectives: milestone.learningObjectives || [],
          key_concepts: milestone.keyConcepts || [],
          content_preview: milestone.contentPreview || '',
          milestone_type: 's3_learning',
          is_completed: false,
          completion_score: 0,
          xp_reward: Math.max(10, Math.floor(estimatedMinutes / 2))
        };
      });

      allMilestones.push(...milestonesToInsert);
    }

    console.log(`OpenRouter S3 Gen: Inserting ${allMilestones.length} total milestones`);

    // Insert all milestones
    const milestonesInsertResponse = await fetch(`${supabaseUrl}/rest/v1/milestones`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'apikey': serviceRoleKey,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(allMilestones)
    });

    if (!milestonesInsertResponse.ok) {
      const errorText = await milestonesInsertResponse.text();
      throw new Error(`Failed to insert milestones: ${errorText}`);
    }

    const insertedMilestones = await milestonesInsertResponse.json();
    console.log(`OpenRouter S3 Gen: Successfully inserted ${insertedMilestones.length} milestones`);

    // Create milestone dependencies (each milestone depends on the previous one)
    const dependencies = [];
    for (let i = 1; i < insertedMilestones.length; i++) {
      dependencies.push({
        milestone_id: insertedMilestones[i].id,
        depends_on_milestone_id: insertedMilestones[i - 1].id
      });
    }

    if (dependencies.length > 0) {
      const dependenciesResponse = await fetch(`${supabaseUrl}/rest/v1/milestone_dependencies`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${serviceRoleKey}`,
          'apikey': serviceRoleKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(dependencies)
      });

      if (!dependenciesResponse.ok) {
        console.error('Failed to create milestone dependencies:', await dependenciesResponse.text());
      } else {
        console.log(`OpenRouter S3 Gen: Created ${dependencies.length} milestone dependencies`);
      }
    }

    // Generate SRS cards from milestone key concepts
    let totalSRSCards = 0;
    for (const milestone of insertedMilestones) {
      if (milestone.key_concepts && milestone.key_concepts.length > 0) {
        const srsCards = milestone.key_concepts.map(concept => ({
          user_id: userId,
          book_id: bookId,
          milestone_id: milestone.id,
          question: `What is ${concept}?`,
          answer: `${concept} is a key concept from "${milestone.title}". Review the milestone content for detailed explanation.`,
          confidence_level: 0,
          review_count: 0,
          next_review: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
          interval_days: 1,
          ease_factor: 2.5
        }));

        const srsResponse = await fetch(`${supabaseUrl}/rest/v1/srs_cards`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(srsCards)
        });

        if (srsResponse.ok) {
          totalSRSCards += srsCards.length;
        }
      }
    }

    console.log(`OpenRouter S3 Gen: Generated ${totalSRSCards} SRS cards from milestone key concepts`);

    return new Response(JSON.stringify({
      data: {
        project: projects[0],
        milestonesCreated: insertedMilestones.length,
        dependenciesCreated: dependencies.length,
        srsCardsCreated: totalSRSCards,
        totalEstimatedMinutes,
        milestones: insertedMilestones.slice(0, 3) // Return first 3 for preview
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('OpenRouter S3 Gen: S3 milestone generation error:', error);

    return new Response(JSON.stringify({
      error: {
        code: 'S3_GENERATION_FAILED',
        message: error.message
      }
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

// Fallback milestone creation when AI fails
function createFallbackMilestones(chapter) {
  const baseMinutes = Math.max(15, Math.floor((chapter.estimated_minutes || 60) / 4));
  
  return [
    {
      title: `Introduction to ${chapter.title}`,
      description: `Get familiar with the basic concepts and overview of ${chapter.title}.`,
      estimatedMinutes: baseMinutes,
      difficultyLevel: 'beginner',
      learningObjectives: [`Understand the main concepts of ${chapter.title}`, 'Identify key terminology', 'Recognize learning goals'],
      keyConcepts: ['Introduction', 'Overview', 'Basic concepts'],
      contentPreview: `Introduction and overview of ${chapter.title}`
    },
    {
      title: `Core Concepts of ${chapter.title}`,
      description: `Deep dive into the fundamental principles and core ideas.`,
      estimatedMinutes: baseMinutes + 5,
      difficultyLevel: chapter.difficulty_level || 'intermediate',
      learningObjectives: ['Master fundamental principles', 'Apply core concepts', 'Analyze relationships'],
      keyConcepts: ['Core principles', 'Fundamental concepts', 'Key relationships'],
      contentPreview: `Core principles and fundamental concepts`
    },
    {
      title: `Application and Practice`,
      description: `Apply learned concepts through examples and practice exercises.`,
      estimatedMinutes: baseMinutes + 10,
      difficultyLevel: 'intermediate',
      learningObjectives: ['Apply concepts to real scenarios', 'Solve practice problems', 'Demonstrate understanding'],
      keyConcepts: ['Application', 'Practice', 'Problem solving'],
      contentPreview: `Practical application and exercises`
    },
    {
      title: `Mastery and Review`,
      description: `Consolidate learning and prepare for advanced topics.`,
      estimatedMinutes: baseMinutes,
      difficultyLevel: 'advanced',
      learningObjectives: ['Synthesize all concepts', 'Prepare for next chapter', 'Self-assess understanding'],
      keyConcepts: ['Mastery', 'Synthesis', 'Review'],
      contentPreview: `Review and consolidation of all concepts`
    }
  ];
}