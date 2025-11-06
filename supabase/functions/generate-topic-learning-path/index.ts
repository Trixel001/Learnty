// Edge Function: Generate Topic Learning Path
// Enhanced with S3 Methodology, Interleaving, and Jim Kwik Principles

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
    const openrouterApiKey = Deno.env.get('OPENROUTER_API_KEY') || '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';

    if (!serviceRoleKey || !supabaseUrl) {
      throw new Error('Missing required environment variables');
    }

    console.log(`[Learning Path] Generating neuroscience-optimized path for: ${topic}`);

    // Calculate optimal milestone count
    const hours = estimatedHours || 2;
    const targetMilestones = Math.max(4, Math.min(20, Math.floor(hours * 2.5))); // 2.5 milestones per hour

    // Enhanced AI prompt with neuroscience and Jim Kwik principles
    const learningPathPrompt = `Create a neuroscience-optimized learning path for: "${topic}"

🧠 LEARNING DESIGN PRINCIPLES TO APPLY:

1. **S3 METHOD (Small Simple Steps)**:
   - Each milestone: 15-30 minutes (optimal attention span)
   - Clear, single-objective focus
   - Immediate progress feedback
   - Achievable challenges (flow state)

2. **JIM KWIK'S FASTER METHOD**:
   - **F**orget: Address misconceptions first
   - **A**ctive: Hands-on practice in every milestone
   - **S**tate: Optimize for peak learning times
   - **T**each: Include explain-to-others exercises
   - **E**nter: Multiple encoding methods (visual, verbal, kinesthetic)
   - **R**eview: Built-in spaced repetition checkpoints

3. **NEUROSCIENCE-BASED STRUCTURE**:
   - **Primacy Effect**: Most important concepts at start
   - **Recency Effect**: Reinforce key ideas at end
   - **Interleaving**: Mix related topics (don't block same concepts)
   - **Spacing**: Review intervals at 1d, 3d, 7d
   - **Dual Coding**: Visual + verbal in every milestone
   - **Elaboration**: Connect to prior knowledge
   - **Generation Effect**: Create own examples
   - **Testing Effect**: Quiz after every 3 milestones

4. **COGNITIVE LOAD OPTIMIZATION**:
   - Start concrete → progress to abstract
   - 7±2 chunks per concept
   - Scaffolding: Support → gradual independence
   - Worked examples before practice

5. **EMOTIONAL ENGAGEMENT**:
   - Real-world relevance in every milestone
   - Storytelling and context
   - Personal connection prompts
   - Celebrate micro-wins (dopamine)

📚 USER CONTEXT:
- Topic: ${topic}
- Description: ${description || 'User wants comprehensive understanding'}
- Level: ${detailLevel || 'intermediate'}
- Time Available: ${hours} hours
- Goals: ${learningGoals || 'Practical mastery'}

🎯 MILESTONE STRUCTURE:

Create ${targetMilestones} milestones following this pattern:

**Milestone 1: FOUNDATION (The Big Picture)**
- Objective: Understand core concept and why it matters
- Duration: 20 minutes
- Hook: Surprising fact or compelling story
- Activities: Overview, real-world examples, emotional connection
- Memory anchor: Create mental hook/acronym
- Success: Can explain to a 5-year-old

**Milestones 2-N: PROGRESSIVE MASTERY**
- Build on previous (but interleave topics!)
- Follow: Learn → Practice → Test → Reflect cycle
- Include: Video/reading (5min) + Practice (15min) + Quiz (5min)
- Vary difficulty: Easy → Medium → Hard → Medium (wave pattern)
- Memory techniques: At least one per milestone
- Application: Real-world usage
- Checkpoint: Quiz every 3 milestones

**Final Milestone: SYNTHESIS & APPLICATION**
- Objective: Teach the complete topic (protégé effect)
- Activity: Create teaching materials or real project
- Reflection: What surprised you? What's next?
- Mastery demonstration: Apply without help

🎨 INTERLEAVING STRATEGY:
- Don't group identical topics together
- Mix foundational and advanced concepts
- Alternate between theory and practice
- Include review milestones that revisit earlier concepts

Example interleaving: Topic A → Topic B → Topic A practice → Topic C → Topic B practice

📋 OUTPUT FORMAT:

Return ONLY valid JSON (no markdown):

{
  "projectTitle": "Mastering [Topic]: A Brain-Friendly Journey",
  "projectDescription": "2-3 engaging sentences with emotional hook",
  "totalDuration": ${hours * 60},
  "difficultyProgression": "How difficulty increases",
  "interleavingStrategy": "How topics are mixed",
  "milestones": [
    {
      "title": "Clear, action-oriented title",
      "description": "What you'll learn and why it matters (2-3 sentences)",
      "estimatedMinutes": 20,
      "difficulty": "beginner" | "intermediate" | "advanced",
      "milestoneType": "foundation" | "building" | "practice" | "review" | "synthesis",
      "learningObjectives": ["Specific, measurable objective", "..."],
      "neuroscience_principles": ["Which principles this uses"],
      "memory_techniques": ["acronym", "visualization", "story"],
      "activities": [
        {
          "type": "watch" | "read" | "practice" | "quiz" | "teach" | "reflect",
          "description": "What to do",
          "duration": 5
        }
      ],
      "keyConcepts": ["concept1", "concept2"], // For flashcard generation
      "practicalExercise": "Hands-on task description",
      "memoryHook": "Memorable phrase/image/acronym",
      "realWorldExample": "Practical application",
      "interleavedWith": ["earlier_topic_reference"], // Topics to review
      "successCriteria": "Can demonstrate X without help",
      "commonPitfalls": ["What learners struggle with"],
      "reviewSchedule": [1, 3, 7] // Days to review this milestone
    }
  ],
  "reviewCheckpoints": [
    {
      "afterMilestone": 3,
      "reviewMilestones": [1, 2, 3],
      "quizQuestions": 5
    }
  ],
  "overallStrategy": "How milestones connect and build mastery",
  "gamificationElements": {
    "totalXP": 500,
    "achievements": ["achievement_name"]
  }
}

⚠️ CRITICAL REQUIREMENTS:
- Generate EXACTLY ${targetMilestones} milestones
- Include at least 2 review/practice milestones
- Vary difficulty in wave pattern (not linear)
- Every milestone has memory technique
- Every 3rd milestone is a checkpoint
- Final milestone synthesizes everything
- Return ONLY JSON (no markdown, no code blocks)

Generate the optimal learning path now:`;

    console.log('[Learning Path] Calling AI with enhanced prompt...');
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
          max_tokens: 4500,
          temperature: 0.75
        })
      }
    );

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('[Learning Path] OpenRouter API error:', errorText);
      throw new Error('Failed to generate learning path from AI. Please try again.');
    }

    const data = await aiResponse.json();
    const aiResponseText = data.choices?.[0]?.message?.content;
    
    if (!aiResponseText) {
      throw new Error('No response from AI');
    }

    // Parse AI response with robust error handling
    let learningPathData;
    try {
      const cleanResponse = aiResponseText.replace(/```json\n?|\n?```/g, '').trim();
      learningPathData = JSON.parse(cleanResponse);
      console.log(`[Learning Path] AI generated ${learningPathData.milestones?.length || 0} milestones`);
    } catch (e) {
      console.error('[Learning Path] Failed to parse AI response:', e);
      console.error('[Learning Path] Response:', aiResponseText.substring(0, 500));
      throw new Error('Failed to parse AI-generated learning path');
    }

    if (!learningPathData.milestones || !Array.isArray(learningPathData.milestones)) {
      throw new Error('Invalid learning path structure');
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
        title: learningPathData.projectTitle || `Mastering ${topic}`,
        description: learningPathData.projectDescription || `Neuroscience-optimized learning path for ${topic}`,
        project_type: 'topic_learning_path',
        status: 'active',
        completion_percentage: 0,
        metadata: {
          topic,
          originalDescription: description,
          detailLevel,
          estimatedHours: hours,
          learningGoals,
          neuroscience_optimized: true,
          interleaving_enabled: true,
          gamification: learningPathData.gamificationElements || {},
          overallStrategy: learningPathData.overallStrategy || '',
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
    console.log(`[Learning Path] Created project: ${projectId}`);

    // Prepare milestones with enhanced metadata
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
        difficulty_level: milestone.difficulty || detailLevel || 'intermediate',
        estimated_minutes: estimatedMinutes,
        learning_objectives: milestone.learningObjectives || [],
        key_concepts: milestone.keyConcepts || [],
        content_preview: milestone.practicalExercise || '',
        milestone_type: milestone.milestoneType || 'building',
        is_completed: false,
        completion_score: 0,
        xp_reward: Math.max(10, Math.floor(estimatedMinutes / 2)),
        metadata: {
          neuroscience_principles: milestone.neuroscience_principles || [],
          memory_techniques: milestone.memory_techniques || [],
          activities: milestone.activities || [],
          memory_hook: milestone.memoryHook || '',
          real_world_example: milestone.realWorldExample || '',
          interleaved_with: milestone.interleavedWith || [],
          success_criteria: milestone.successCriteria || '',
          common_pitfalls: milestone.commonPitfalls || [],
          review_schedule: milestone.reviewSchedule || [1, 3, 7],
          neuroscience_optimized: true
        }
      };
    });

    console.log(`[Learning Path] Inserting ${milestonesToInsert.length} enhanced milestones`);

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
    console.log(`[Learning Path] Successfully inserted ${insertedMilestones.length} milestones`);

    // Create milestone dependencies (with interleaving)
    const dependencies = [];
    for (let i = 1; i < insertedMilestones.length; i++) {
      // Sequential dependency
      dependencies.push({
        milestone_id: insertedMilestones[i].id,
        depends_on_milestone_id: insertedMilestones[i - 1].id
      });
      
      // Add interleaving dependencies (review earlier milestones)
      if (i >= 3 && i % 3 === 0) {
        // Every 3rd milestone reviews milestone from 2 steps back
        const reviewIndex = Math.max(0, i - 3);
        if (reviewIndex !== i - 1) {
          dependencies.push({
            milestone_id: insertedMilestones[i].id,
            depends_on_milestone_id: insertedMilestones[reviewIndex].id
          });
        }
      }
    }

    if (dependencies.length > 0) {
      await fetch(`${supabaseUrl}/rest/v1/milestone_dependencies`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${serviceRoleKey}`,
          'apikey': serviceRoleKey,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify(dependencies)
      });
      console.log(`[Learning Path] Created ${dependencies.length} milestone dependencies (with interleaving)`);
    }

    // Generate enhanced SRS flashcards from key concepts
    let totalSRSCards = 0;
    for (const milestone of insertedMilestones) {
      if (milestone.key_concepts && milestone.key_concepts.length > 0) {
        const memoryTechniques = milestone.metadata?.memory_techniques || [];
        const memoryHook = milestone.metadata?.memory_hook || '';
        
        const srsCards = milestone.key_concepts.slice(0, 5).map((concept: string, idx: number) => {
          const technique = memoryTechniques[idx % memoryTechniques.length] || 'elaboration';
          
          return {
            user_id: userId,
            milestone_id: milestone.id,
            question: `Explain the concept: ${concept}. Why is it important in ${topic}?`,
            answer: `${concept} is a key concept from "${milestone.title}". ${memoryHook ? 'Memory hook: ' + memoryHook : 'Review the milestone for detailed explanation.'}`,
            difficulty: milestone.difficulty_level || 'medium',
            tags: [topic.toLowerCase().replace(/\s+/g, '-'), 'milestone', milestone.milestone_type],
            confidence_level: 0,
            review_count: 0,
            next_review: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            interval_days: 1,
            ease_factor: 2.5,
            card_type: 'topic_concept',
            ai_generated: true,
            metadata: {
              memory_technique: technique,
              neuroscience_optimized: true
            }
          };
        });

        const srsResponse = await fetch(`${supabaseUrl}/rest/v1/srs_cards`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify(srsCards)
        });

        if (srsResponse.ok) {
          totalSRSCards += srsCards.length;
        }
      }
    }

    console.log(`[Learning Path] Generated ${totalSRSCards} enhanced SRS flashcards`);

    // Success response with comprehensive data
    return new Response(JSON.stringify({
      data: {
        project: projects[0],
        milestonesCreated: insertedMilestones.length,
        dependenciesCreated: dependencies.length,
        srsCardsCreated: totalSRSCards,
        totalEstimatedMinutes,
        estimatedHours: Math.round(totalEstimatedMinutes / 60 * 10) / 10,
        enhancements: {
          neuroscience_principles: [
            's3_methodology',
            'faster_method',
            'interleaving',
            'spaced_repetition',
            'dual_coding',
            'elaboration',
            'testing_effect'
          ],
          features: [
            'progressive_difficulty',
            'memory_hooks',
            'real_world_examples',
            'review_checkpoints',
            'gamification'
          ]
        },
        nextSteps: [
          'Start with the first milestone',
          'Complete activities in order',
          'Review flashcards daily',
          'Track your progress'
        ],
        milestones: insertedMilestones.slice(0, 3) // Preview first 3
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[Learning Path] Error:', error);

    return new Response(JSON.stringify({
      error: {
        code: 'TOPIC_GENERATION_FAILED',
        message: error.message || 'Failed to generate learning path',
        suggestion: 'Try with a more specific topic or adjust the estimated hours'
      }
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
