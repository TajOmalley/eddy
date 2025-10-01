import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { TavilyService } from '../../../lib/tavily'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'dummy-key-for-build',
})

const systemPrompt = `You are an educational project creator for LearnCanvas, a hands-on learning platform. Your role is to create structured learning experiences with two phases: Exposure and Exercise.

Create a learning project with this EXACT structure:

# [Topic] Learning Project

## Exposure
Present the key concepts and information users need to understand before starting the exercise. Use the provided content and include source links for further reading.

## Exercise
### Project Goal
Brief description of what the user will accomplish (30-minute task).

### Arena
Link to the free tool/platform where users will complete the project. Use the provided arena URL from web search.

### Steps
Numbered, extremely detailed and methodical steps for completing the project. Each step should be:
- Specific and actionable
- Include exact commands, clicks, or actions to take
- Explain what the user should see/expect at each step
- Include troubleshooting tips for common issues
- Break down complex actions into smaller sub-steps
- Provide exact text to type, buttons to click, or code to write
- Include verification steps to confirm completion

Example format:
1. [Detailed step with exact actions]
   - Sub-step: [Specific action]
   - Sub-step: [Specific action]
   - Expected result: [What user should see]
2. [Next detailed step]
   - Sub-step: [Specific action]
   - Sub-step: [Specific action]
   - Expected result: [What user should see]

### Your Next Challenge
Another hands-on task using the same skills, to be completed independently in the same arena.

IMPORTANT RULES:
- Use ONLY the provided URLs from web search - do not create or guess URLs
- Keep the exercise to 30 minutes maximum
- Make steps extremely specific and methodical with sub-steps
- Include exact commands, button names, menu items, and code snippets
- Explain what users should see/expect at each step
- Provide troubleshooting tips for common issues
- Focus on a foundational, manageable task
- Ensure the arena is free and accessible
- The next challenge should use the same skills but be a separate project
- Each step should be so detailed that a complete beginner can follow it without confusion`

export async function POST(request: NextRequest) {
  try {
    const { topic } = await request.json()

    if (!topic) {
      return NextResponse.json({ error: 'Topic is required' }, { status: 400 })
    }

    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'dummy-key-for-build') {
      return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 })
    }

    // Initialize Tavily service (with error handling)
    let exposureContent = ''
    let exposureSources: any[] = []
    let exerciseTools: any[] = []
    let resourcesText = ''
    
    try {
      const tavilyService = new TavilyService()
      
      // Search for exposure content and exercise tools separately
      const [exposureResults, exerciseResults] = await Promise.all([
        tavilyService.searchForExposureContent(topic),
        tavilyService.searchForExerciseTools(topic)
      ])
      
      exposureContent = exposureResults.content
      exposureSources = exposureResults.sources
      exerciseTools = exerciseResults
      
      // Format the resources for the LLM
      let exposureText = ''
      let exerciseText = ''
      
      if (exposureContent && exposureSources.length > 0) {
        exposureText = `\n\nEXPOSURE CONTENT:\n${exposureContent}\n\nSources:\n${exposureSources.map(source => `- ${source.title}: ${source.url}`).join('\n')}`
      } else {
        exposureText = '\n\nEXPOSURE CONTENT: No specific content found - provide a brief introduction to the topic and suggest where users can find tutorials and articles.'
      }
      
      if (exerciseTools.length > 0) {
        exerciseText = `\n\nEXERCISE ARENA:\n${exerciseTools.map(tool => `- ${tool.title}: ${tool.url}`).join('\n')}`
      } else {
        exerciseText = '\n\nEXERCISE ARENA: No specific tools found - suggest free online editors or platforms.'
      }
      
      resourcesText = exposureText + exerciseText
      
    } catch (tavilyError) {
      console.warn('Tavily search not available, proceeding without verified URLs:', tavilyError)
      resourcesText = '\n\nNote: Please suggest where users can find learning resources and free tools instead of providing specific URLs.'
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
