"use client"

import React, { useEffect, useState } from 'react'
import { supabase, type SavedMessage } from '@/lib/supabase'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { ChevronDown, ChevronUp, Trash2 } from 'lucide-react'

export function SavedMessages() {
  const [savedMessages, setSavedMessages] = useState<SavedMessage[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [expandedMessages, setExpandedMessages] = useState<Set<string>>(new Set())

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('saved_messages')
        .delete()
        .eq('id', id)

      if (error) throw error
    } catch (error) {
      console.error('Error deleting message:', error)
    }
  }

  useEffect(() => {
    const fetchSavedMessages = async () => {
      try {
        const { data, error } = await supabase
          .from('saved_messages')
          .select('*')
          .order('created_at', { ascending: false })

        if (error) throw error
        setSavedMessages(data || [])
      } catch (error) {
        console.error('Error fetching saved messages:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchSavedMessages()
    
    // Subscribe to changes
    const channel = supabase
      .channel('saved_messages_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'saved_messages' },
        () => fetchSavedMessages()
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [])

  // Toggle message expansion
  const toggleMessage = (id: string) => {
    setExpandedMessages(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-green-500 animate-pulse">Loading saved messages...</div>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto space-y-4 p-4 custom-scrollbar">
      <h2 className="text-lg font-bold text-green-400 mb-4">Saved Messages</h2>
      {savedMessages.length === 0 ? (
        <div className="text-green-500/60 text-sm">
          No saved messages yet. Highlight any text in the advisor's messages and click save to add it here.
        </div>
      ) : (
        savedMessages.map((message) => (
          <div 
            key={message.id}
            className="group p-4 rounded-lg bg-green-950/30 border border-green-500/30 hover:border-green-500/50 transition-colors"
          >
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center gap-2">
                <span className="text-xs text-green-500/60">
                  {new Date(message.created_at).toLocaleString()}
                </span>
                {message.content.length > 100 && (
                  <button
                    onClick={() => toggleMessage(message.id)}
                    className="text-green-500/60 hover:text-green-400"
                  >
                    {expandedMessages.has(message.id) ? 
                      <ChevronUp className="h-4 w-4" /> : 
                      <ChevronDown className="h-4 w-4" />
                    }
                  </button>
                )}
              </div>
              <button
                onClick={() => handleDelete(message.id)}
                className="opacity-0 group-hover:opacity-100 text-green-500/60 hover:text-red-400 transition-all"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
            <div className={`prose prose-invert max-w-none ${
              !expandedMessages.has(message.id) && message.content.length > 100
                ? 'line-clamp-3'
                : ''
            }`}>
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {message.content}
              </ReactMarkdown>
            </div>
          </div>
        ))
      )}
    </div>
  )
} 