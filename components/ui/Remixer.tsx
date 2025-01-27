"use client"

import React, { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { projectAdvisor } from '@/lib/project-advisor'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { supabase } from '@/lib/supabase'
import { SavedMessages } from './SavedMessages'
import { BookmarkIcon, BookmarkPlusIcon } from 'lucide-react'

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

  return (
    <div 
      className="fixed z-50 bg-green-950 border border-green-500 rounded-md shadow-lg animate-in fade-in duration-200"
      style={{ 
        left: position.x,
        top: position.y,
        transform: 'translate(-50%, -120%)'
      }}
    >
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onSave();
        }}
        className="flex items-center gap-2 px-3 py-2 text-sm text-green-300 hover:bg-green-900 rounded-md transition-colors"
      >
        <BookmarkPlusIcon className="h-4 w-4" />
        Save Selection
      </button>
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
  const [selectedText, setSelectedText] = useState<string>('');
  const [floatingButtonPosition, setFloatingButtonPosition] = useState<{ x: number; y: number } | null>(null);

  const handleRemix = async () => {
    if (!inputText || selectedAspects.length === 0) return
    
    const userMessage: Message = {
      role: 'user',
      content: inputText,
      timestamp: new Date()
    }
    
    setMessages(prev => [...prev, userMessage])
    setIsLoading(true)
    
    try {
      const response = await fetch('/api/remix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          text: inputText, 
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
        setInputText('')
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

  const handleSaveMessage = async (message: Message) => {
    setIsSaving(true)
    try {
      const { data, error } = await supabase
        .from('saved_messages')
        .insert([{
          content: message.content,
          role: message.role,
          created_at: message.timestamp.toISOString()
        }])
        .select()

      if (error) {
        console.error('Supabase error:', error);
        // Add visual feedback for error
        alert('Failed to save message: ' + error.message);
        return { success: false, error: error.message };
      }

      // Add visual feedback for success
      alert('Message saved successfully!');
      return { success: true, data };
    } catch (error) {
      console.error('Error saving message:', error);
      alert('Error saving message');
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    } finally {
      setIsSaving(false)
    }
  }

  const onBookmarkClick = async (message: Message) => {
    console.log('Bookmark clicked for message:', message);
    await handleSaveMessage(message);
  }

  const handleTextSelection = () => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) {
      setSelectedText('');
      setFloatingButtonPosition(null);
      return;
    }

    const text = selection.toString().trim();
    if (text) {
      setSelectedText(text);
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      setFloatingButtonPosition({
        x: rect.left + (rect.width / 2),
        y: rect.top
      });
    }
  };

  const handleSaveSelection = async () => {
    if (!selectedText) return;
    
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('saved_messages')
        .insert([{
          content: selectedText,
          role: 'assistant', // Since we're saving from advisor's messages
          created_at: new Date().toISOString()
        }]);

      if (error) {
        console.error('Supabase error:', error);
        alert('Failed to save selection: ' + error.message);
      } else {
        // Clear selection after saving
        window.getSelection()?.removeAllRanges();
        setSelectedText('');
        setFloatingButtonPosition(null);
      }
    } catch (error) {
      console.error('Error saving selection:', error);
      alert('Error saving selection');
    } finally {
      setIsSaving(false);
    }
  };

  // Add event listener for text selection
  React.useEffect(() => {
    document.addEventListener('mouseup', handleTextSelection);
    document.addEventListener('keyup', handleTextSelection);
    
    return () => {
      document.removeEventListener('mouseup', handleTextSelection);
      document.removeEventListener('keyup', handleTextSelection);
    };
  }, []);

  // Hide floating button when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!e.target || !(e.target as Element).closest('.prose')) {
        setSelectedText('');
        setFloatingButtonPosition(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="flex">
      {/* Saved Messages Sidebar */}
      <div className="w-80 border-r border-green-500/30 h-[calc(100vh-12rem)] overflow-hidden">
        <SavedMessages />
      </div>

      {/* Main Content */}
      <div className="flex-1 pl-8 space-y-8">
        <div className="space-y-4">
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
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div 
                key={index}
                className={`p-4 rounded-lg ${
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
                    className="p-2 hover:bg-green-500/10 rounded-md transition-colors"
                  >
                    <BookmarkIcon className="h-5 w-5" />
                  </button>
                </div>
                <div className="prose prose-invert max-w-none">
                  <ReactMarkdown 
                    remarkPlugins={[remarkGfm]}
                    components={{
                      // Headers
                      h1: ({...props}) => (
                        <h1 className="text-2xl font-bold text-green-300 mb-4 border-b border-green-500/30 pb-2" {...props} />
                      ),
                      h2: ({...props}) => (
                        <h2 className="text-xl font-bold text-green-300 mt-6 mb-3" {...props} />
                      ),
                      h3: ({...props}) => (
                        <h3 className="text-lg font-bold text-green-300 mt-4 mb-2" {...props} />
                      ),
                      // Lists
                      ul: ({...props}) => (
                        <ul className="space-y-2 my-4 ml-4 list-disc list-outside text-green-200" {...props} />
                      ),
                      ol: ({...props}) => (
                        <ol className="space-y-2 my-4 ml-4 list-decimal list-outside text-green-200" {...props} />
                      ),
                      li: ({...props}) => (
                        <li className="text-green-200 leading-relaxed" {...props} />
                      ),
                      // Paragraphs and text
                      p: ({...props}) => (
                        <p className="text-green-200 leading-relaxed mb-4" {...props} />
                      ),
                      strong: ({...props}) => (
                        <strong className="text-green-300 font-bold" {...props} />
                      ),
                      em: ({...props}) => (
                        <em className="text-green-200 italic" {...props} />
                      ),
                      // Code blocks
                      code: (props: React.ClassAttributes<HTMLElement> & React.HTMLAttributes<HTMLElement> & { inline?: boolean }) => (
                        props.inline
                          ? <code className="bg-green-950 text-green-300 px-1 py-0.5 rounded text-sm" {...props} />
                          : <code className="block bg-green-950 text-green-300 p-4 rounded-lg my-4 text-sm overflow-x-auto" {...props} />
                      ),
                      // Blockquotes
                      blockquote: ({...props}) => (
                        <blockquote className="border-l-4 border-green-500 pl-4 my-4 italic text-green-200/80" {...props} />
                      ),
                    }}
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
            <Button 
              onClick={handleRemix}
              disabled={isLoading || !inputText || selectedAspects.length === 0}
            >
              {isLoading ? 'Processing...' : 'Get Advice'}
            </Button>
          </div>
        </div>
      </div>

      {/* Floating Save Button */}
      <FloatingSaveButton 
        onSave={handleSaveSelection}
        position={floatingButtonPosition}
      />
    </div>
  )
} 