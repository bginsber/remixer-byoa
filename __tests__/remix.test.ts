import { describe, it, expect, jest } from '@jest/globals'
import { NextRequest } from 'next/server'
import { POST } from '@/app/api/remix/route'

// Mock the AI clients with correct types
jest.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
    getGenerativeModel: jest.fn().mockReturnValue({
      generateContent: jest.fn().mockResolvedValue({
        response: {
          text: () => 'Mocked remixed content',
          promptFeedback: { blockReason: null },
          candidates: []
        }
      })
    })
  }))
}))

const testExample = `Large Language Models are transforming education, with students increasingly using AI tools like ChatGPT for homework help, essay writing, and exam preparation. While these tools can provide instant explanations and feedback, they also raise concerns about academic integrity and critical thinking skills. Some educators ban AI use entirely, while others are integrating it into their curriculum. As these models become more sophisticated, we must decide how to balance their educational potential with authentic learning.`

describe('Remix API', () => {
  it('should remix text with skeptic persona', async () => {
    const req = new NextRequest('http://localhost:3000/api/remix', {
      method: 'POST',
      body: JSON.stringify({
        text: testExample,
        persona: 'skeptic',
        model: 'gemini'
      })
    })

    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.remixedText).toBeDefined()
    expect(data.modelUsed).toBe('gemini')
    expect(data.personaUsed).toBe('The Skeptic')
  })
})