import { NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import Anthropic from '@anthropic-ai/sdk'

// Initialize both AI clients
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')
const geminiModel = genAI.getGenerativeModel({ model: 'gemini-pro' })

const anthropic = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY,
})

async function remixWithGemini(text: string, persona: string) {
  const prompt = `Remix the following text from the perspective of ${persona}. 
                 Maintain the core message but add insights and perspective 
                 typical of ${persona}:\n\n${text}`

  const result = await geminiModel.generateContent(prompt)
  const response = await result.response
  return response.text()
}

async function remixWithClaude(text: string, persona: string) {
  const message = await anthropic.messages.create({
    model: 'claude-3-sonnet-20240229',
    max_tokens: 1024,
    messages: [{
      role: 'user',
      content: `Remix the following text from the perspective of ${persona}. 
                Maintain the core message but add insights and perspective 
                typical of ${persona}:\n\n${text}`
    }],
  })
  return message.content[0].text
}

export async function POST(req: Request) {
  try {
    const { text, persona, model = 'gemini' } = await req.json()
    let remixedText: string

    if (model === 'claude' && process.env.CLAUDE_API_KEY) {
      remixedText = await remixWithClaude(text, persona)
    } else {
      // Default to Gemini if Claude is not available or not selected
      remixedText = await remixWithGemini(text, persona)
    }

    return NextResponse.json({ remixedText, modelUsed: model })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: 'Failed to remix text' },
      { status: 500 }
    )
  }
}