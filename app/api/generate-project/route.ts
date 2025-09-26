import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { TavilyService } from '../../../lib/tavily'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const systemPrompt = `You are an educational project creator for LearnCanvas, a hands-on learning platform. Your role is to create clear, step-by-step projects that beginners can complete using free online resources.

When given a learning topic, create a comprehensive project that includes:
1. A clear project title
2. Learning objectives (what the user will achieve)
3. Step-by-step instructions (numbered, detailed)
4. Free resources and tools needed (with specific links when possible)
5. Expected outcomes and next steps

IMPORTANT: You will be provided with real, verified URLs from web search. Use these URLs in your response instead of making up or guessing URLs. If you don't have specific URLs for something, suggest where users can search (e.g., "Search for 'React tutorial' on YouTube" or "Visit the official documentation").

Format the response as clean, readable text that will be displayed directly on a canvas. Use clear headings, bullet points, and numbered lists. Make it engaging and encouraging for beginners.

Focus on practical, hands-on learning that can be completed in 1-3 hours for a beginner.`

export async function POST(request: NextRequest) {
  try {
    const { topic } = await request.json()

    if (!topic) {
      return NextResponse.json({ error: 'Topic is required' }, { status: 400 })
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 })
    }

    // Initialize Tavily service (with error handling)
    let learningResources: any[] = []
    let resourcesText = ''
    
    try {
      const tavilyService = new TavilyService()
      learningResources = await tavilyService.searchForLearningResources(topic)
      
      // Format the resources for the LLM
      resourcesText = learningResources.length > 0 
        ? `\n\nHere are some verified learning resources I found:\n${learningResources.map(resource => `- ${resource.title}: ${resource.url}`).join('\n')}`
        : '\n\nNote: I couldn\'t find specific verified resources, so please suggest where users can search for tutorials and documentation.'
    } catch (tavilyError) {
      console.warn('Tavily search not available, proceeding without verified URLs:', tavilyError)
      resourcesText = '\n\nNote: Please suggest where users can search for tutorials and documentation instead of providing specific URLs.'
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Create a beginner-friendly project for learning: ${topic}${resourcesText}` }
      ],
      max_tokens: 2000,
      temperature: 0.7,
    })

    const project = completion.choices[0]?.message?.content || 'Unable to generate project'

    return NextResponse.json({ project })
  } catch (error) {
    console.error('Error generating project:', error)
    return NextResponse.json(
      { error: 'Failed to generate project' },
      { status: 500 }
    )
  }
}
