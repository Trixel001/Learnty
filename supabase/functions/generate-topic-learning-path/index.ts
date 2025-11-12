// Edge Function: Generate Topic Learning Path
// Enhanced with S3 Methodology, Interleaving, and Jim Kwik Principles
import { serve } from "https://deno.land/std@0.174.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }
  try {
    const { topic, description, detailLevel, estimatedHours, learningGoals, userId } = await req.json();
    if (!topic || !userId) throw new Error('Topic and User ID are required');

    // 🛠️ Use correct environment variables
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    if (!serviceRoleKey || !supabaseUrl) throw new Error('Supabase config missing');
    if (!geminiApiKey) throw new Error('GEMINI_API_KEY not configured.');

    const hours = estimatedHours || 2;
    const targetMilestones = Math.max(4, Math.min(20, Math.floor(hours * 2.5)));

    // Enhanced neuroscience learning prompt remains unchanged, see previous file for full prompt
    const learningPathPrompt = `Create a neuroscience-optimized learning path for: "${topic}"

...[prompt omitted for brevity, use your full previous prompt here]...

Generate the optimal learning path now:`;

    // Call Gemini API (not OpenRouter!), correct endpoint/model
    const aiResponse = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${geminiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gemini-2.5-flash-lite',
          messages: [{ role: 'user', content: learningPathPrompt }],
          max_tokens: 4500,
          temperature: 0.75,
          response_format: { type: 'json_object' }
        })
      }
    );
    if (!aiResponse.ok) throw new Error(await aiResponse.text());
    const data = await aiResponse.json();
    const aiResponseText = data.choices?.[0]?.message?.content || data.choices?.[0]?.message?.content?.toString();
    if (!aiResponseText) throw new Error('No response from AI');

    // Parse response, then proceed with DB logic (unchanged)
    let learningPathData;
    try {
      learningPathData = JSON.parse(aiResponseText);
    } catch {
      throw new Error('Failed to parse AI-generated learning path');
    }
    if (!learningPathData.milestones || !Array.isArray(learningPathData.milestones)) {
      throw new Error('Invalid learning path structure');
    }
    // ... The rest of your db/project/insertion code remains unchanged ...
    // (Reuse from previously)
    return new Response(JSON.stringify({
      data: {
        milestonesCreated: learningPathData.milestones.length || 0,
        milestones: learningPathData.milestones.slice(0, 3),
        // ...other stats... (populate as before)
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      error: {
        code: 'TOPIC_GENERATION_FAILED',
        message: error.message || 'Failed to generate learning path',
      }
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
