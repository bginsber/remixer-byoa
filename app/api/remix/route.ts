import { NextResponse } from 'next/server'
import { getProjectAdvice } from '@/lib/project-advisor'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { text, aspects, model, projectPhase, energyLevel } = body

    // Validate input
    if (!text || !aspects || aspects.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Get advice using the project advisor
    const advice = await getProjectAdvice(
      text,
      aspects,
      { projectPhase, energyLevel }
    )

    if (!advice) {
      throw new Error('No advice generated')
    }

    return NextResponse.json({ 
      remixedText: advice,
      success: true
    })

  } catch (error) {
    console.error('Error in remix API:', error instanceof Error ? error.message : 'Unknown error')
    return NextResponse.json(
      { 
        error: 'Failed to generate advice',
        details: error instanceof Error ? error.message : 'Unknown error',
        success: false
      },
      { status: 500 }
    )
  }
}