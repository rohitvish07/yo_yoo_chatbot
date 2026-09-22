'use client'

import { useEffect, useRef } from 'react'
import { MessageBubble } from './message-bubble'
import { InputBox } from './input-box'
import type { Message } from '@/lib/api'
import { MessageSquare } from 'lucide-react'

interface ChatWindowProps {
  messages: Message[]
  onSendMessage: (message: string) => void
  isLoading: boolean
}

export function ChatWindow({
  messages,
  onSendMessage,
  isLoading,
}: ChatWindowProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth',
      })
    }
  }, [messages])

  return (
    <div className="flex h-full flex-col">
      {/* Chat messages area */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto scroll-smooth"
      >
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
              <MessageSquare className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground">
                How can I help you today?
              </h2>
              <p className="mt-2 text-muted-foreground">
                Start a conversation by typing a message below.
              </p>
            </div>
          </div>
        ) : (
          <div className="mx-auto max-w-3xl pb-4">
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
          </div>
        )}
      </div>

      {/* Input area */}
      <InputBox onSend={onSendMessage} disabled={isLoading} />
    </div>
  )
}
