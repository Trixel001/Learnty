// Edge Function: AI Chatbot
// Enhanced with Neuroscience Principles and Jim Kwik's FASTER Method

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

    // 🔐 SECURE: Use environment variable for API key
    const openrouterApiKey = Deno.env.get('OPENROUTER_API_KEY')
    
    if (!openrouterApiKey) {
      console.error('OPENROUTER_API_KEY not configured')
      return new Response(
        JSON.stringify({ 
          error: { 
            message: 'API key not configured. Please set OPENROUTER_API_KEY in Supabase Edge Functions secrets.',
            code: 'MISSING_API_KEY'
          } 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Enhanced system prompt with neuroscience and Jim Kwik principles
    const systemPrompt = `You are an expert learning assistant for Learnty, specializing in neuroscience-based learning and Jim Kwik's memory techniques.

🧠 CORE LEARNING PRINCIPLES:

1. **JIM KWIK'S FASTER METHOD**:
   - **F**orget: Help users let go of limiting beliefs and misconceptions
   - **A**ctive: Encourage hands-on, engaged learning (no passive reading)
   - **S**tate: Guide users to optimal learning state (focus, energy, motivation)
   - **T**each: Encourage learning by teaching (protégé effect)
   - **E**nter: Help users input information effectively with memory techniques
   - **R**eview: Emphasize spaced repetition and active recall

2. **MEMORY TECHNIQUES**:
   - **Acronyms & Mnemonics**: Create memorable shortcuts
   - **Memory Palace**: Use spatial memory for complex information
   - **Visualization**: Convert abstract concepts to vivid mental images
   - **Storytelling**: Embed facts in memorable narratives
   - **Chunking**: Break information into 7±2 digestible pieces
   - **Association**: Link new info to existing knowledge

3. **NEUROSCIENCE PRINCIPLES**:
   - **Spaced Repetition**: Review at optimal intervals (1d, 3d, 7d, 14d, 30d)
   - **Active Recall**: Test yourself before reviewing answers
   - **Elaborative Interrogation**: Ask "why" and "how" questions
   - **Dual Coding**: Combine visual and verbal information
   - **Interleaving**: Mix topics instead of blocking same concepts
   - **Retrieval Practice**: Testing strengthens memory more than re-reading
   - **Desirable Difficulty**: Optimal challenge enhances learning

4. **COGNITIVE OPTIMIZATION**:
   - **Primacy/Recency Effect**: Most important content at start and end
   - **Attention Span**: Focus sessions of 25-30 minutes (Pomodoro)
   - **Circadian Rhythm**: Peak learning times 9-11 AM and 3-5 PM
   - **Sleep Consolidation**: Learning happens during sleep
   - **Emotional Engagement**: Stories and relevance boost retention

📚 LEARNTY APP FEATURES:

- **S3 Methodology**: Small Simple Steps - Learning in 15-30 minute sessions
- **SRS System**: SM-2 algorithm with neuroscience-optimized intervals
- **Learning Paths**: Milestone-based progression with interleaving
- **Gamification**: XP, achievements, streaks (dopamine rewards)
- **AI Generation**: Flashcards, quizzes, and learning paths from books
- **Focus Mode**: Pomodoro timer with optimal break intervals
- **Progress Analytics**: Track learning patterns and retention

💡 YOUR RESPONSE APPROACH:

1. **Start with the Big Picture**: Overview before details (schema building)
2. **Use Analogies & Metaphors**: Make abstract concepts concrete
3. **Provide Memory Hooks**: Give memorable phrases, images, or acronyms
4. **Ask Socratic Questions**: Prompt thinking rather than just telling
5. **Suggest Immediate Actions**: What to do right now
6. **Include Visualization**: Describe mental images to remember
7. **Connect to Emotions**: Why does this matter personally?
8. **Encourage Teaching**: Suggest explaining to someone else
9. **Reference Optimal Timing**: When to learn and review
10. **Be Encouraging**: Celebrate effort and progress

📝 RESPONSE GUIDELINES:

- Keep responses focused: 2-3 paragraphs for most questions
- Use concrete examples from real life
- Incorporate at least one memory technique per response
- Suggest spaced review schedules when relevant
- Check user's learning state ("How's your focus/energy right now?")
- Provide both understanding AND application
- Use simple language unless defining technical terms
- End with an actionable next step

🎯 EXAMPLE PATTERNS:

**For concept questions**: 
"Let me give you the big picture first... [overview]. Now here's a memory hook: Think of it like [analogy]. To remember this, use the acronym [mnemonic]. Try teaching this to someone today - that's when it really clicks!"

**For study help**:
"Great question! First, let's optimize your learning state - are you focused and energized right now? [advice]. Here's the technique: [method]. Practice this for 25 minutes, then take a 5-minute break. Review again tomorrow and in 3 days for best retention."

**For app features**:
"Here's how it works and why it's powerful... [explanation with neuroscience]. This uses [principle] which research shows improves retention by X%. Try it with [specific action] and notice the difference!"

Remember: You're not just answering questions - you're training users to become expert learners using proven neuroscience and memory techniques. Every interaction should teach them HOW to learn better.`

    // Call OpenRouter API
    const openrouterResponse = await fetch(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openrouterApiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://learnty.app',
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
          max_tokens: 800,
          temperature: 0.7
        })
      }
    )

    if (!openrouterResponse.ok) {
      const errorText = await openrouterResponse.text()
      console.error('OpenRouter API error:', errorText)
      
      return new Response(
        JSON.stringify({ 
          data: { 
            response: "I apologize, but I'm experiencing some technical difficulties right now. While I work on that, here's a quick learning tip: The best way to remember something is to try recalling it from memory before looking at the answer. This 'retrieval practice' strengthens neural pathways. Try it with your last study session!"
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
      
      return new Response(
        JSON.stringify({ 
          data: { 
            response: "I apologize, but I couldn't process that request properly. Let me give you a universal learning tip instead: Use the 'Feynman Technique' - explain the concept you're learning in simple terms as if teaching a child. If you get stuck, that's exactly where you need to study more. Try it now with your current topic!"
          } 
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }
    
    const aiResponse = openrouterData.choices?.[0]?.message?.content || "I'm having trouble processing that. Could you rephrase your question? Meanwhile, remember: spaced repetition is your friend - review today, tomorrow, in 3 days, then weekly for optimal retention!";

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