"use client"

import React, { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const personas = [
  { id: 'skeptic', name: 'The Skeptic' },
  { id: 'visionary', name: 'The Visionary' },
  { id: 'academic', name: 'The Academic' },
  { id: 'pragmatist', name: 'The Pragmatist' },
  { id: 'optimist', name: 'The Optimist' },
]

const models = [
  { id: 'gemini', name: 'Gemini (Free)' },
  { id: 'claude', name: 'Claude (Premium)' },
]

export function Remixer() {
  const [inputText, setInputText] = useState('')
  const [selectedPersona, setSelectedPersona] = useState('')
  const [selectedModel, setSelectedModel] = useState('gemini')
  const [outputText, setOutputText] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleRemix = async () => {
    if (!inputText || !selectedPersona) return
    
    setIsLoading(true)
    try {
      const response = await fetch('/api/remix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          text: inputText, 
          persona: selectedPersona,
          model: selectedModel 
        }),
      })
      const data = await response.json()
      setOutputText(data.remixedText)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">AI Content Remixer</h1>
      
      <div className="space-y-4">
        <div className="flex gap-4">
          <Select value={selectedModel} onValueChange={setSelectedModel}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select AI model" />
            </SelectTrigger>
            <SelectContent>
              {models.map((model) => (
                <SelectItem key={model.id} value={model.id}>
                  {model.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedPersona} onValueChange={setSelectedPersona}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select a persona" />
            </SelectTrigger>
            <SelectContent>
              {personas.map((persona) => (
                <SelectItem key={persona.id} value={persona.id}>
                  {persona.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Textarea 
          placeholder="Enter text to remix..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          className="min-h-[200px]"
        />

        <Button 
          onClick={handleRemix} 
          disabled={isLoading || !inputText || !selectedPersona}
        >
          {isLoading ? 'Remixing...' : 'Remix Text'}
        </Button>

        {outputText && (
          <div className="p-4 border rounded-lg bg-slate-50">
            <h2 className="font-semibold mb-2">Remixed Content:</h2>
            <p className="whitespace-pre-wrap">{outputText}</p>
          </div>
        )}
      </div>
    </div>
  )
} 