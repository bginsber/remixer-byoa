"use client"

import React, { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { projectAdvisor } from '@/lib/project-advisor'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { supabase } from '@/lib/supabase'
import { SavedMessages } from './SavedMessages'
import { BookmarkIcon, BookmarkPlusIcon, Terminal } from 'lucide-react'
import { toast, Toaster } from 'sonner'

const aspects = projectAdvisor.aspects.map(aspect => ({
  id: aspect.id,
  name: aspect.traitName,
  description: aspect.description
}))

const models = [
  { id: 'gemini', name: 'Gemini (Free)', description: 'Google\'s AI model' },
  { id: 'claude', name: 'Claude (Premium)', description: 'Anthropic\'s AI model' },
]

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface FloatingSaveButtonProps {
  onSave: () => void;
  position: { x: number; y: number } | null;
}

const FloatingSaveButton: React.FC<FloatingSaveButtonProps> = ({ onSave, position }) => {
  if (!position) return null;

  const handleClick = async (e: React.MouseEvent) => {
    console.log('Save button clicked - starting save process');
    e.preventDefault();
    e.stopPropagation();
    try {
      await onSave();
      console.log('Save process completed');
    } catch (error) {
      console.error('Error in save button click:', error);
    }
  };

  return (
    <div 
      className="fixed z-50 bg-green-950/95 border-2 border-green-500 rounded-md shadow-lg animate-in fade-in duration-200"
      style={{ 
        position: 'absolute',
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: 'translate(-50%, -100%) translateY(-4px)',
        pointerEvents: 'auto',
        willChange: 'transform'
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        onClick={handleClick}
        className="flex items-center gap-2 px-2.5 py-1 text-sm text-green-300 hover:bg-green-900 rounded-md transition-colors"
      >
        <BookmarkPlusIcon className="h-3.5 w-3.5" />
        Save
      </button>
    </div>
  );
};

const TerminalLoader = () => {
  const [progress, setProgress] = React.useState(0);
  const [loadingText, setLoadingText] = React.useState('Initializing AI model');

  React.useEffect(() => {
    const texts = [
      'Initializing AI model',
      'Loading project context',
      'Analyzing request',
      'Generating response',
      'Formatting output'
    ];
    let currentTextIndex = 0;
    
    const textInterval = setInterval(() => {
      currentTextIndex = (currentTextIndex + 1) % texts.length;
      setLoadingText(texts[currentTextIndex]);
    }, 2000);

    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 98) return prev;
        const increment = Math.random() * 15;
        return Math.min(prev + increment, 98);
      });
    }, 300);

    return () => {
      clearInterval(interval);
      clearInterval(textInterval);
    };
  }, []);

  return (
    <div className="space-y-2 p-4 font-mono text-sm">
      <div className="flex items-center gap-2">
        <Terminal className="h-4 w-4 animate-pulse" />
        <span>{loadingText}</span>
      </div>
      <div className="h-1 w-full bg-green-950 rounded-full overflow-hidden">
        <div 
          className="h-full bg-green-500/50 transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="text-xs text-green-500/60">
        {progress.toFixed(1)}% complete
      </div>
    </div>
  );
};

export function Remixer() {
  const [inputText, setInputText] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [selectedAspects, setSelectedAspects] = useState<string[]>([])
  const [selectedModel, setSelectedModel] = useState('gemini')
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [selectedText, setSelectedText] = useState('')
  const [floatingButtonPosition, setFloatingButtonPosition] = useState<{ x: number; y: number } | null>(null)
  const contentRef = React.useRef<HTMLDivElement>(null);

  const handleRemix = async () => {
    if (!inputText || selectedAspects.length === 0) return
    
    const textToSend = inputText
    const userMessage: Message = {
      role: 'user',
      content: textToSend,
      timestamp: new Date()
    }
    
    setMessages(prev => [...prev, userMessage])
    setInputText('')
    setIsLoading(true)
    
    try {
      const response = await fetch('/api/remix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          text: textToSend,
          aspects: selectedAspects,
          model: selectedModel,
          projectPhase: 'ideation',
          energyLevel: 'high'
        }),
      })
      
      if (!response.ok) {
        throw new Error('Failed to get response')
      }

      const data = await response.json()
      
      if (data.remixedText) {
        const assistantMessage: Message = {
          role: 'assistant',
          content: data.remixedText,
          timestamp: new Date()
        }
        
        setMessages(prev => [...prev, assistantMessage])
      }
    } catch (error) {
      console.error('Error:', error)
      // Optionally show error to user
      const errorMessage: Message = {
        role: 'assistant',
        content: 'I apologize, but I encountered an error. Please try again.',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const saveToSupabase = async (content: string, role: 'user' | 'assistant', addHighlight = false) => {
    console.log('saveToSupabase called with:', { contentLength: content.length, role, addHighlight });
    setIsSaving(true);
    try {
      // Add highlight effect if requested
      if (addHighlight) {
        console.log('Adding highlight effect');
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          const span = document.createElement('span');
          span.className = 'animate-highlight bg-green-500/20';
          range.surroundContents(span);
          
          // Remove the highlight after animation
          setTimeout(() => {
            const parent = span.parentNode;
            if (parent) {
              while (span.firstChild) {
                parent.insertBefore(span.firstChild, span);
              }
              parent.removeChild(span);
            }
          }, 1000);
        }
      }

      console.log('Making Supabase request...');
      const { data, error } = await supabase
        .from('saved_messages')
        .insert([{
          content,
          role,
          created_at: new Date().toISOString()
        }])
        .select();

      console.log('Supabase response received:', { data, error });

      if (error) {
        console.error('Supabase error:', error);
        toast.error('Failed to save', {
          description: error.message,
          duration: 3000,
        });
        return false;
      }

      toast.success('Saved successfully', {
        description: content.slice(0, 50) + (content.length > 50 ? '...' : ''),
        duration: 2000,
      });

      return true;
    } catch (error) {
      console.error('Error in saveToSupabase:', error);
      toast.error('Error saving content');
      return false;
    } finally {
      setIsSaving(false);
      console.log('saveToSupabase completed');
    }
  };

  // Selection handler
  useEffect(() => {
    const handleSelection = () => {
      console.log('Selection handler triggered')
      const selection = window.getSelection()
      const text = selection?.toString() || ''
      
      if (selection && text) {
        const range = selection.getRangeAt(0)
        const rect = range.getBoundingClientRect()
        
        // Position button 5px to the right of selection
        const newPosition = {
          x: rect.right + 5, // Reduced from 100px to 5px
          y: rect.top + (rect.height / 2) // Vertically centered
        }
        
        console.log('Selection details:', {
          text,
          position: newPosition
        })

        setSelectedText(text)
        setFloatingButtonPosition(newPosition)
      } else {
        console.log('No valid selection')
        setSelectedText('')
        setFloatingButtonPosition(null)
      }
    }

    document.addEventListener('selectionchange', handleSelection)
    return () => document.removeEventListener('selectionchange', handleSelection)
  }, [])

  const handleFloatingSave = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    console.log('Floating save button clicked')
    console.log('Attempting to save text:', selectedText)
    
    if (!selectedText) {
      console.log('No text selected to save')
      return
    }

    setIsSaving(true)
    try {
      const success = await saveToSupabase(selectedText, 'assistant', true)
      console.log('Save result:', success)
      
      if (success) {
        toast.success('Selection saved!')
        // Clear selection after successful save
        window.getSelection()?.removeAllRanges()
        setSelectedText('')
        setFloatingButtonPosition(null)
      }
    } catch (error) {
      console.error('Error in handleFloatingSave:', error)
      toast.error('Failed to save selection')
    } finally {
      setIsSaving(false)
    }
  }

  const onBookmarkClick = async (message: Message) => {
    console.log('Bookmark clicked for message:', message.content.slice(0, 50));
    if (message.role !== 'user' && message.role !== 'assistant') {
      console.error('Invalid role:', message.role);
      toast.error('Invalid message role');
      return;
    }
    await saveToSupabase(message.content, message.role, false);
  };

  return (
    <div className="flex relative">
      <Toaster 
        theme="dark" 
        position="top-right"
        toastOptions={{
          style: {
            background: 'rgba(2, 44, 34, 0.95)',
            border: '1px solid rgba(34, 197, 94, 0.2)',
            color: '#22c55e'
          }
        }}
      />
      {/* Floating Save Button */}
      {floatingButtonPosition && selectedText && (
        <div
          className="fixed z-50 animate-in fade-in duration-200"
          style={{
            position: 'absolute',
            left: `${floatingButtonPosition.x}px`,
            top: `${floatingButtonPosition.y}px`,
            transform: 'translate(0, -50%)', // Only center vertically
            pointerEvents: 'auto',
            willChange: 'transform'
          }}
        >
          <button
            onClick={handleFloatingSave}
            disabled={isSaving}
            className="bg-green-500/20 hover:bg-green-500/30 text-green-400 p-2 rounded-md flex items-center gap-2 transition-colors disabled:opacity-50"
          >
            {isSaving ? (
              <div className="animate-spin h-4 w-4 border-2 border-green-500 border-t-transparent rounded-full" />
            ) : (
              <BookmarkIcon className="h-4 w-4" />
            )}
            Save Selection
          </button>
        </div>
      )}
      
      {/* Saved Messages Sidebar */}
      <div className="w-80 border-r border-green-500/30 h-[calc(100vh-12rem)] overflow-hidden flex-shrink-0">
        <SavedMessages />
      </div>

      {/* Main Content */}
      <div className="flex-1 pl-8 space-y-8 min-w-0">
        <div className="space-y-4 overflow-x-hidden">
          <h1 className="text-2xl font-bold">Project Advisor</h1>
          
          {/* Controls Section */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="space-y-2">
              <label className="text-sm font-medium">AI Model</label>
              <Select value={selectedModel} onValueChange={setSelectedModel}>
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Select AI model" />
                </SelectTrigger>
                <SelectContent 
                  ref={(ref) => {
                    if (ref) {
                      ref.style.position = 'fixed';
                      ref.style.zIndex = '9999';
                    }
                  }}
                  position="popper" 
                  sideOffset={5}
                  className="fixed bg-background border shadow-lg rounded-md"
                >
                  {models.map((model) => (
                    <SelectItem 
                      key={model.id} 
                      value={model.id}
                      className="cursor-pointer hover:bg-gray-500/5 hover:text-foreground"
                    >
                      <div className="flex flex-col py-2">
                        <span>{model.name}</span>
                        <span className="text-xs text-gray-500">{model.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Advisor Aspect</label>
              <Select 
                value={selectedAspects[0]} 
                onValueChange={(value) => setSelectedAspects([value])}
              >
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Select advisor aspect" />
                </SelectTrigger>
                <SelectContent 
                  ref={(ref) => {
                    if (ref) {
                      ref.style.position = 'fixed';
                      ref.style.zIndex = '9999';
                    }
                  }}
                  position="popper" 
                  sideOffset={5}
                  className="fixed bg-background border shadow-lg rounded-md"
                >
                  {aspects.map((aspect) => (
                    <SelectItem 
                      key={aspect.id} 
                      value={aspect.id}
                      className="cursor-pointer hover:bg-gray-500/5 hover:text-foreground"
                    >
                      <div className="flex flex-col py-2">
                        <span>{aspect.name}</span>
                        <span className="text-xs text-gray-500">{aspect.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Message History */}
          <div className="space-y-4 overflow-x-hidden" ref={contentRef}>
            {messages.map((message, index) => (
              <div 
                key={index}
                className={`p-4 rounded-lg break-words ${
                  message.role === 'user' 
                    ? 'bg-green-500/10 ml-8 border border-green-500/20' 
                    : 'bg-green-950/30 mr-8 border border-green-500/30'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="font-semibold text-green-400">
                    {message.role === 'user' ? '> USER' : '> DR_RIVERA'}
                  </div>
                  <button
                    onClick={() => onBookmarkClick(message)}
                    disabled={isSaving}
                    className="p-2 hover:bg-green-500/10 rounded-md transition-colors flex-shrink-0"
                  >
                    <BookmarkIcon className="h-5 w-5" />
                  </button>
                </div>
                <div className="prose prose-invert max-w-none overflow-x-auto">
                  <ReactMarkdown 
                    remarkPlugins={[remarkGfm]}
                    className="whitespace-pre-wrap break-words"
                  >
                    {message.content}
                  </ReactMarkdown>
                </div>
                <div className="text-xs text-green-500/60 mt-4">
                  {message.timestamp.toLocaleTimeString()}
                </div>
              </div>
            ))}
          </div>

          {/* Input Area */}
          <div className="space-y-2">
            <Textarea 
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Describe your project situation..."
              className="min-h-[100px]"
            />
            <div className="space-y-4">
              {isLoading ? (
                <div className="border border-green-500/20 rounded-lg bg-green-950/20">
                  <TerminalLoader />
                </div>
              ) : (
                <Button 
                  onClick={handleRemix}
                  disabled={isLoading || !inputText || selectedAspects.length === 0}
                >
                  Get Advice
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 