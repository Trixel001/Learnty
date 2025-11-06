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
    const { milestoneId, userId, performanceData } = await req.json();

    if (!milestoneId || !userId) {
      throw new Error('Milestone ID and User ID are required');
    }

    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');

    if (!serviceRoleKey || !supabaseUrl) {
      throw new Error('Missing required environment variables');
    }

    console.log(`Processing milestone completion for milestone ${milestoneId}, user ${userId}`);

    // Get milestone and user performance data
    const milestoneResponse = await fetch(`${supabaseUrl}/rest/v1/milestones?id=eq.${milestoneId}&select=*`, {
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'apikey': serviceRoleKey
      }
    });

    if (!milestoneResponse.ok) {
      throw new Error('Failed to fetch milestone data');
    }

    const milestones = await milestoneResponse.json();
    if (milestones.length === 0) {
      throw new Error('Milestone not found');
    }

    const milestone = milestones[0];

    // Extract performance data with defaults
    const {
      sessionDuration = milestone.estimated_minutes || 20,
      completionPercentage = 100,
      difficultyRating = 3, // 1-5 scale (3 = just right)
      confidenceLevel = 3, // 1-5 scale  
      notesText = ''
    } = performanceData || {};

    // Calculate performance score based on multiple factors
    const timeEfficiency = Math.min(1.0, (milestone.estimated_minutes || 20) / sessionDuration);
    const difficultyFactor = difficultyRating <= 2 ? 1.2 : difficultyRating >= 4 ? 0.8 : 1.0;
    const confidenceFactor = confidenceLevel / 5.0;
    
    const performanceScore = Math.round(
      (completionPercentage / 100) * timeEfficiency * difficultyFactor * confidenceFactor * 100
    );

    // Calculate XP reward based on performance
    const baseXP = milestone.xp_reward || Math.max(10, Math.floor((milestone.estimated_minutes || 20) / 2));
    const xpMultiplier = Math.max(0.5, Math.min(2.0, performanceScore / 80)); // 50%-200% of base XP
    const xpAwarded = Math.round(baseXP * xpMultiplier);

    // Record learning session
    const sessionResponse = await fetch(`${supabaseUrl}/rest/v1/learning_sessions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'apikey': serviceRoleKey,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        user_id: userId,
        milestone_id: milestoneId,
        session_type: 'study',
        duration_minutes: sessionDuration,
        completion_percentage: completionPercentage,
        performance_score: performanceScore,
        notes: notesText,
        completed_at: new Date().toISOString()
      })
    });

    if (!sessionResponse.ok) {
      console.error('Failed to record learning session:', await sessionResponse.text());
    }

    // Update milestone completion
    const milestoneUpdateResponse = await fetch(`${supabaseUrl}/rest/v1/milestones?id=eq.${milestoneId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'apikey': serviceRoleKey,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        is_completed: true,
        completed_at: new Date().toISOString(),
        completion_score: performanceScore
      })
    });

    if (!milestoneUpdateResponse.ok) {
      throw new Error('Failed to update milestone completion');
    }

    const updatedMilestones = await milestoneUpdateResponse.json();

    // Update user profile XP
    const profileResponse = await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${userId}`, {
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'apikey': serviceRoleKey
      }
    });

    if (profileResponse.ok) {
      const profiles = await profileResponse.json();
      if (profiles.length > 0) {
        const currentXP = profiles[0].total_xp || 0;
        const newXP = currentXP + xpAwarded;

        await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${userId}`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            total_xp: newXP,
            updated_at: new Date().toISOString()
          })
        });
      }
    }

    // Get project progress and update completion percentage
    const projectResponse = await fetch(`${supabaseUrl}/rest/v1/projects?id=eq.${milestone.project_id}&select=*`, {
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'apikey': serviceRoleKey
      }
    });

    if (projectResponse.ok) {
      const projects = await projectResponse.json();
      if (projects.length > 0) {
        // Get all milestones for this project
        const allMilestonesResponse = await fetch(
          `${supabaseUrl}/rest/v1/milestones?project_id=eq.${milestone.project_id}&select=id,is_completed`,
          {
            headers: {
              'Authorization': `Bearer ${serviceRoleKey}`,
              'apikey': serviceRoleKey
            }
          }
        );

        if (allMilestonesResponse.ok) {
          const allMilestones = await allMilestonesResponse.json();
          const completedCount = allMilestones.filter(m => m.is_completed).length;
          const completionPercentage = Math.round((completedCount / allMilestones.length) * 100);

          await fetch(`${supabaseUrl}/rest/v1/projects?id=eq.${milestone.project_id}`, {
            method: 'PATCH',
            headers: {
              'Authorization': `Bearer ${serviceRoleKey}`,
              'apikey': serviceRoleKey,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              completion_percentage: completionPercentage,
              status: completionPercentage === 100 ? 'completed' : 'active',
              updated_at: new Date().toISOString()
            })
          });
        }
      }
    }

    // Adaptive difficulty adjustment for future milestones
    if (milestone.project_id) {
      await adjustFutureMilestoneDifficulty(
        supabaseUrl,
        serviceRoleKey,
        milestone.project_id,
        userId,
        performanceScore,
        difficultyRating
      );
    }

    // Unlock next milestone if dependencies are met
    const nextMilestone = await unlockNextMilestone(supabaseUrl, serviceRoleKey, milestoneId);

    // Check for milestone achievements
    const achievements = await checkMilestoneAchievements(supabaseUrl, serviceRoleKey, userId);

    return new Response(JSON.stringify({
      data: {
        milestone: updatedMilestones[0],
        performanceScore,
        xpAwarded,
        nextMilestone,
        achievements
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Milestone completion error:', error);

    return new Response(JSON.stringify({
      error: {
        code: 'MILESTONE_COMPLETION_FAILED',
        message: error.message
      }
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

// Adaptive difficulty adjustment for future milestones
async function adjustFutureMilestoneDifficulty(supabaseUrl, serviceRoleKey, projectId, userId, performanceScore, difficultyRating) {
  try {
    // Get user's recent performance on last 5 milestones in this project
    const recentSessionsResponse = await fetch(
      `${supabaseUrl}/rest/v1/learning_sessions?user_id=eq.${userId}&milestone_id.in.(select id from milestones where project_id='${projectId}')&order=created_at.desc&limit=5`,
      {
        headers: {
          'Authorization': `Bearer ${serviceRoleKey}`,
          'apikey': serviceRoleKey
        }
      }
    );

    if (!recentSessionsResponse.ok) return;

    const recentSessions = await recentSessionsResponse.json();
    if (recentSessions.length === 0) return;

    // Calculate average performance
    const avgPerformance = recentSessions.reduce((sum, session) => sum + session.performance_score, 0) / recentSessions.length;
    
    // Determine if difficulty adjustment is needed
    let adjustmentFactor = 0;
    
    if (avgPerformance > 85 && difficultyRating <= 2) {
      // User is finding it too easy, increase difficulty
      adjustmentFactor = 0.1;
    } else if (avgPerformance < 60 && difficultyRating >= 4) {
      // User is struggling, decrease difficulty
      adjustmentFactor = -0.1;
    }

    if (adjustmentFactor !== 0) {
      // Get incomplete milestones in this project
      const incompleteMilestonesResponse = await fetch(
        `${supabaseUrl}/rest/v1/milestones?project_id=eq.${projectId}&is_completed=eq.false&select=id,estimated_minutes,difficulty_level`,
        {
          headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey
          }
        }
      );

      if (incompleteMilestonesResponse.ok) {
        const incompleteMilestones = await incompleteMilestonesResponse.json();
        
        for (const milestone of incompleteMilestones) {
          const currentMinutes = milestone.estimated_minutes || 20;
          const newMinutes = Math.max(10, Math.min(45, Math.round(currentMinutes * (1 + adjustmentFactor))));
          
          // Only update if there's a meaningful change
          if (Math.abs(newMinutes - currentMinutes) >= 2) {
            await fetch(`${supabaseUrl}/rest/v1/milestones?id=eq.${milestone.id}`, {
              method: 'PATCH',
              headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                estimated_minutes: newMinutes
              })
            });
          }
        }
        
        console.log(`Adjusted difficulty for ${incompleteMilestones.length} future milestones (factor: ${adjustmentFactor})`);
      }
    }
  } catch (error) {
    console.error('Error adjusting milestone difficulty:', error);
  }
}

// Unlock next milestone if dependencies are satisfied
async function unlockNextMilestone(supabaseUrl, serviceRoleKey, completedMilestoneId) {
  try {
    // Find milestones that depend on the completed one
    const dependentMilestonesResponse = await fetch(
      `${supabaseUrl}/rest/v1/milestone_dependencies?depends_on_milestone_id=eq.${completedMilestoneId}&select=milestone_id`,
      {
        headers: {
          'Authorization': `Bearer ${serviceRoleKey}`,
          'apikey': serviceRoleKey
        }
      }
    );

    if (!dependentMilestonesResponse.ok) return null;

    const dependencies = await dependentMilestonesResponse.json();
    
    for (const dep of dependencies) {
      // Check if all dependencies for this milestone are now satisfied
      const allDepsResponse = await fetch(
        `${supabaseUrl}/rest/v1/milestone_dependencies?milestone_id=eq.${dep.milestone_id}&select=depends_on_milestone_id`,
        {
          headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey
          }
        }
      );

      if (allDepsResponse.ok) {
        const allDeps = await allDepsResponse.json();
        const depIds = allDeps.map(d => d.depends_on_milestone_id);
        
        // Check if all dependency milestones are completed
        const completedDepsResponse = await fetch(
          `${supabaseUrl}/rest/v1/milestones?id=in.(${depIds.join(',')})&is_completed=eq.true&select=id`,
          {
            headers: {
              'Authorization': `Bearer ${serviceRoleKey}`,
              'apikey': serviceRoleKey
            }
          }
        );

        if (completedDepsResponse.ok) {
          const completedDeps = await completedDepsResponse.json();
          
          if (completedDeps.length === depIds.length) {
            // All dependencies satisfied, get the milestone details
            const milestoneResponse = await fetch(
              `${supabaseUrl}/rest/v1/milestones?id=eq.${dep.milestone_id}&select=*`,
              {
                headers: {
                  'Authorization': `Bearer ${serviceRoleKey}`,
                  'apikey': serviceRoleKey
                }
              }
            );

            if (milestoneResponse.ok) {
              const milestones = await milestoneResponse.json();
              if (milestones.length > 0) {
                console.log(`Unlocked next milestone: ${milestones[0].title}`);
                return milestones[0];
              }
            }
          }
        }
      }
    }

    return null;
  } catch (error) {
    console.error('Error unlocking next milestone:', error);
    return null;
  }
}

// Check for milestone-related achievements
async function checkMilestoneAchievements(supabaseUrl, serviceRoleKey, userId) {
  try {
    const achievements = [];

    // Get user's completed milestones count
    const completedMilestonesResponse = await fetch(
      `${supabaseUrl}/rest/v1/milestones?user_id=eq.${userId}&is_completed=eq.true&select=id,created_at`,
      {
        headers: {
          'Authorization': `Bearer ${serviceRoleKey}`,
          'apikey': serviceRoleKey
        }
      }
    );

    if (completedMilestonesResponse.ok) {
      const completedMilestones = await completedMilestonesResponse.json();
      const count = completedMilestones.length;

      // Check milestone count achievements
      const milestoneAchievements = [
        { count: 1, id: 'first_milestone', name: 'First Step', description: 'Complete your first learning milestone' },
        { count: 5, id: 'milestone_explorer', name: 'Milestone Explorer', description: 'Complete 5 learning milestones' },
        { count: 10, id: 'dedicated_learner', name: 'Dedicated Learner', description: 'Complete 10 learning milestones' },
        { count: 25, id: 'milestone_master', name: 'Milestone Master', description: 'Complete 25 learning milestones' }
      ];

      for (const achievement of milestoneAchievements) {
        if (count >= achievement.count) {
          // Check if user already has this achievement
          const existingAchievementResponse = await fetch(
            `${supabaseUrl}/rest/v1/user_achievements?user_id=eq.${userId}&achievement_id=eq.${achievement.id}`,
            {
              headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey
              }
            }
          );

          if (existingAchievementResponse.ok) {
            const existingAchievements = await existingAchievementResponse.json();
            
            if (existingAchievements.length === 0) {
              // Award new achievement
              const awardResponse = await fetch(`${supabaseUrl}/functions/v1/award-achievement`, {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${serviceRoleKey}`,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  userId: userId,
                  achievementId: achievement.id,
                  achievementName: achievement.name,
                  achievementType: 'milestone'
                })
              });

              if (awardResponse.ok) {
                achievements.push(achievement);
              }
            }
          }
        }
      }
    }

    return achievements;
  } catch (error) {
    console.error('Error checking milestone achievements:', error);
    return [];
  }
}