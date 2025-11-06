// Edge Function: AI Chatbot
// Provides intelligent, context-aware responses using OpenRouter

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
}

interface Message {
  role: 'user' | 'assistant'
  content: string
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders })
  }

  try {
    const { message, conversationHistory } = await req.json()

    if (!message) {
      return new Response(
        JSON.stringify({ error: { message: 'Message is required' } }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const openrouterApiKey = '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'

    // Build conversation context
    const systemPrompt = `You are an expert learning assistant for Learnty, a spaced repetition learning app that helps users master knowledge through books and structured learning paths.

Your role is to:
1. Explain concepts in simple, clear language (like a great teacher)
2. Help users understand app features (SRS review, learning paths, milestones)
3. Provide study tips and learning strategies
4. Answer questions about spaced repetition and the SM-2 algorithm
5. Be encouraging and supportive

Key features of Learnty:
- S3 Methodology (Small Simple Steps): Learning broken into 15-30 minute sessions
- Spaced Repetition System (SRS): Using SM-2 algorithm for optimal review timing
- Learning Paths: Structured progression through book content with milestones
- Gamification: XP rewards, achievements, progress tracking
- AI-powered content generation from uploaded books

Guidelines:
- Keep responses concise (2-4 sentences for simple questions, up to 3 paragraphs for complex topics)
- Use simple language, avoid jargon unless explaining it
- Be warm and encouraging, like a supportive teacher
- If unsure about app-specific features, acknowledge limitation and suggest general learning advice
- For learning questions, use educational techniques like elaboration, retrieval practice, and spaced repetition`

    // Call OpenRouter API with Llama model
    const openrouterResponse = await fetch(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openrouterApiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://z0cd8od18i80.space.minimax.io',
          'X-Title': 'Learnty AI Learning Assistant'
        },
        body: JSON.stringify({
          model: 'mistralai/mistral-7b-instruct:free',
          messages: [
            { role: 'system', content: systemPrompt },
            ...(conversationHistory || []).map((msg: { role: string, content: string }) => ({
              role: msg.role,
              content: msg.content
            })),
            { role: 'user', content: message }
          ],
          max_tokens: 500,
          temperature: 0.7
        })
      }
    )

    if (!openrouterResponse.ok) {
      const errorText = await openrouterResponse.text()
      console.error('OpenRouter API error:', errorText)
      
      // Return a helpful fallback response instead of throwing
      return new Response(
        JSON.stringify({ 
          data: { 
            response: "I apologize, but I'm experiencing some technical difficulties right now. Please try again in a moment, or feel free to ask me another question."
          } 
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    let openrouterData
    try {
      const responseText = await openrouterResponse.text()
      openrouterData = JSON.parse(responseText)
    } catch (parseError) {
      console.error('JSON parse error:', parseError)
      
      // Return fallback response
      return new Response(
        JSON.stringify({ 
          data: { 
            response: "I apologize, but I couldn't process that request properly. Could you please try asking your question again?"
          } 
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }
    
    const aiResponse = openrouterData.choices?.[0]?.message?.content || "I'm having trouble processing that. Could you rephrase your question?";

    return new Response(
      JSON.stringify({ 
        data: { 
          response: aiResponse.trim()
        } 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  } catch (error) {
    console.error('Error in ai-chatbot function:', error)
    
    return new Response(
      JSON.stringify({ 
        error: { 
          message: error.message || 'An unexpected error occurred',
          code: 'CHATBOT_ERROR'
        } 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
