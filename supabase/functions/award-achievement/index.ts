Deno.serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE, PATCH',
    'Access-Control-Max-Age': '86400',
    'Access-Control-Allow-Credentials': 'false'
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { userId, achievementType } = await req.json();

    if (!userId || !achievementType) {
      throw new Error('User ID and achievement type are required');
    }

    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');

    if (!serviceRoleKey || !supabaseUrl) {
      throw new Error('Supabase configuration missing');
    }

    // Get the achievement by type
    const achievementResponse = await fetch(
      `${supabaseUrl}/rest/v1/achievements?achievement_type=eq.${achievementType}&select=*`,
      {
        headers: {
          'Authorization': `Bearer ${serviceRoleKey}`,
          'apikey': serviceRoleKey
        }
      }
    );

    if (!achievementResponse.ok) {
      throw new Error('Failed to fetch achievement');
    }

    const achievements = await achievementResponse.json();
    
    if (achievements.length === 0) {
      throw new Error('Achievement not found');
    }

    const achievement = achievements[0];

    // Check if user already has this achievement
    const checkResponse = await fetch(
      `${supabaseUrl}/rest/v1/user_achievements?user_id=eq.${userId}&achievement_id=eq.${achievement.id}&select=*`,
      {
        headers: {
          'Authorization': `Bearer ${serviceRoleKey}`,
          'apikey': serviceRoleKey
        }
      }
    );

    const existingAchievements = await checkResponse.json();

    if (existingAchievements.length > 0) {
      return new Response(JSON.stringify({
        data: {
          message: 'Achievement already awarded',
          achievement: existingAchievements[0]
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Award the achievement
    const awardResponse = await fetch(`${supabaseUrl}/rest/v1/user_achievements`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'apikey': serviceRoleKey,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        user_id: userId,
        achievement_id: achievement.id,
        earned_at: new Date().toISOString(),
        progress_value: 100
      })
    });

    if (!awardResponse.ok) {
      const errorText = await awardResponse.text();
      throw new Error(`Failed to award achievement: ${errorText}`);
    }

    const userAchievement = await awardResponse.json();

    // Update user XP and level
    const xpToAdd = achievement.xp_requirement || 50;
    
    const updateResponse = await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${userId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'apikey': serviceRoleKey,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        total_xp: xpToAdd
      })
    });

    if (!updateResponse.ok) {
      console.error('Failed to update user XP');
    }

    return new Response(JSON.stringify({
      data: {
        message: 'Achievement awarded successfully',
        achievement: userAchievement[0],
        xpAwarded: xpToAdd
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Achievement award error:', error);

    const errorResponse = {
      error: {
        code: 'ACHIEVEMENT_AWARD_FAILED',
        message: error.message
      }
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
