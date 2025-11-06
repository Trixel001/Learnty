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
    const { topic, description, detailLevel, estimatedHours, learningGoals, userId } = await req.json();

    if (!topic || !userId) {
      throw new Error('Topic and User ID are required');
    }

    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const openrouterApiKey = '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';

    if (!serviceRoleKey || !supabaseUrl) {
      throw new Error('Missing required environment variables');
    }

    console.log(`Starting topic-based learning path generation for: ${topic}`);

    // Determine number of milestones based on estimated hours
    const hours = estimatedHours || 2;
    const targetMilestones = Math.max(3, Math.min(15, Math.floor(hours * 2))); // 2 milestones per hour, 3-15 range

    // Generate comprehensive learning path using AI
    const learningPathPrompt = `Create a comprehensive gamified learning path for this topic using S3 (Small Simple Steps) methodology:

Topic: ${topic}
Description: ${description || 'User wants to learn this topic'}
Detail Level: ${detailLevel || 'intermediate'}
Estimated Time: ${hours} hours total
Learning Goals: ${learningGoals || 'General understanding and practical application'}

Generate ${targetMilestones} learning milestones that:
1. Follow S3 principles (15-30 minute focused sessions)
2. Progress from basics to advanced concepts
3. Include practical application and exercises
4. Build on each other logically
5. Include gamification elements (clear objectives, rewards)

Return a JSON object with:
- projectTitle: Engaging title for the learning path
- projectDescription: 2-3 sentence overview
- milestones: Array of ${targetMilestones} milestone objects, each with:
  - title: Clear, actionable title
  - description: What the learner will accomplish (2-3 sentences)
  - estimatedMinutes: 15-30 minutes
  - difficultyLevel: "beginner", "intermediate", or "advanced"
  - learningObjectives: Array of 3-5 specific, measurable objectives
  - keyConcepts: Array of 5-10 key terms/concepts for flashcards
  - contentPreview: Brief outline of what will be covered
  - practicalExercise: A hands-on activity or practice task

Return only valid JSON, no markdown formatting.`;

    console.log('Calling AI to generate learning path...');
    const aiResponse = await fetch(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openrouterApiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://z0cd8od18i80.space.minimax.io',
          'X-Title': 'Learnty Topic Learning Path Generator'
        },
        body: JSON.stringify({
          model: 'mistralai/mistral-7b-instruct:free',
          messages: [{ role: 'user', content: learningPathPrompt }],
          max_tokens: 3000,
          temperature: 0.7
        })
      }
    );

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('OpenRouter API error:', errorText);
      throw new Error('Failed to generate learning path from AI. Please try again.');
    }

    const data = await aiResponse.json();
    const aiResponseText = data.choices?.[0]?.message?.content;
    
    if (!aiResponseText) {
      throw new Error('No response from AI');
    }

    // Parse AI response
    let learningPathData;
    try {
      const cleanResponse = aiResponseText.replace(/```json\n?|\n?```/g, '').trim();
      learningPathData = JSON.parse(cleanResponse);
      console.log(`AI generated ${learningPathData.milestones?.length || 0} milestones`);
    } catch (e) {
      console.error('Failed to parse AI response:', e);
      throw new Error('Failed to parse AI-generated learning path');
    }

    // Create project in database
    const projectResponse = await fetch(`${supabaseUrl}/rest/v1/projects`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'apikey': serviceRoleKey,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        user_id: userId,
        title: learningPathData.projectTitle || `Learning Path: ${topic}`,
        description: learningPathData.projectDescription || `Custom learning path for ${topic}`,
        project_type: 'topic_learning_path',
        status: 'active',
        completion_percentage: 0,
        metadata: {
          topic,
          originalDescription: description,
          detailLevel,
          estimatedHours: hours,
          learningGoals,
          createdAt: new Date().toISOString()
        }
      })
    });

    if (!projectResponse.ok) {
      const errorText = await projectResponse.text();
      throw new Error(`Failed to create project: ${errorText}`);
    }

    const projects = await projectResponse.json();
    const projectId = projects[0].id;
    console.log(`Created project: ${projectId}`);

    // Prepare milestones for insertion
    let totalEstimatedMinutes = 0;
    const milestonesToInsert = learningPathData.milestones.map((milestone: any, index: number) => {
      const estimatedMinutes = milestone.estimatedMinutes || 20;
      totalEstimatedMinutes += estimatedMinutes;

      return {
        project_id: projectId,
        user_id: userId,
        title: milestone.title || `Milestone ${index + 1}`,
        description: milestone.description || '',
        order_index: index,
        difficulty_level: milestone.difficultyLevel || detailLevel || 'intermediate',
        estimated_minutes: estimatedMinutes,
        learning_objectives: milestone.learningObjectives || [],
        key_concepts: milestone.keyConcepts || [],
        content_preview: milestone.contentPreview || '',
        milestone_type: 'topic_learning',
        is_completed: false,
        completion_score: 0,
        xp_reward: Math.max(10, Math.floor(estimatedMinutes / 2)),
        metadata: {
          practicalExercise: milestone.practicalExercise || ''
        }
      };
    });

    console.log(`Inserting ${milestonesToInsert.length} milestones`);

    // Insert milestones
    const milestonesResponse = await fetch(`${supabaseUrl}/rest/v1/milestones`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'apikey': serviceRoleKey,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(milestonesToInsert)
    });

    if (!milestonesResponse.ok) {
      const errorText = await milestonesResponse.text();
      throw new Error(`Failed to insert milestones: ${errorText}`);
    }

    const insertedMilestones = await milestonesResponse.json();
    console.log(`Successfully inserted ${insertedMilestones.length} milestones`);

    // Create milestone dependencies (sequential progression)
    const dependencies = [];
    for (let i = 1; i < insertedMilestones.length; i++) {
      dependencies.push({
        milestone_id: insertedMilestones[i].id,
        depends_on_milestone_id: insertedMilestones[i - 1].id
      });
    }

    if (dependencies.length > 0) {
      await fetch(`${supabaseUrl}/rest/v1/milestone_dependencies`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${serviceRoleKey}`,
          'apikey': serviceRoleKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(dependencies)
      });
      console.log(`Created ${dependencies.length} milestone dependencies`);
    }

    // Generate SRS flashcards from key concepts
    let totalSRSCards = 0;
    for (const milestone of insertedMilestones) {
      if (milestone.key_concepts && milestone.key_concepts.length > 0) {
        const srsCards = milestone.key_concepts.map((concept: string) => ({
          user_id: userId,
          milestone_id: milestone.id,
          question: `Explain: ${concept}`,
          answer: `${concept} is a key concept from "${milestone.title}" in your ${topic} learning path. Review the milestone content for detailed explanation.`,
          confidence_level: 0,
          review_count: 0,
          next_review: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
          interval_days: 1,
          ease_factor: 2.5,
          card_type: 'topic_concept'
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

    console.log(`Generated ${totalSRSCards} SRS flashcards from key concepts`);

    return new Response(JSON.stringify({
      data: {
        project: projects[0],
        milestonesCreated: insertedMilestones.length,
        dependenciesCreated: dependencies.length,
        srsCardsCreated: totalSRSCards,
        totalEstimatedMinutes,
        estimatedHours: Math.round(totalEstimatedMinutes / 60 * 10) / 10,
        milestones: insertedMilestones.slice(0, 3) // Preview first 3
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Topic learning path generation error:', error);

    return new Response(JSON.stringify({
      error: {
        code: 'TOPIC_GENERATION_FAILED',
        message: error.message
      }
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
