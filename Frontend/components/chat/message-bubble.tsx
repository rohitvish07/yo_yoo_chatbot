'use client'

import { cn } from '@/lib/utils'
import type { Message } from '@/lib/api'
import { User, Bot, Wrench } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'

interface MessageBubbleProps {
  message: Message
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user'

  return (
    <div
      className={cn(
        'flex gap-3 px-4 py-6',
        isUser ? 'justify-end' : 'justify-start'
      )}
    >
      {!isUser && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <Bot className="h-4 w-4" />
        </div>
      )}

      <div
        className={cn(
          'max-w-[80%] rounded-2xl px-4 py-3',
          isUser
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted text-foreground'
        )}
      >
        {message.toolUsage && (
          <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
            <Wrench className="h-4 w-4 animate-pulse" />
            <span>Using {message.toolUsage}...</span>
          </div>
        )}

        {message.isStreaming && !message.content ? (
          <div className="flex gap-1">
            <span className="h-2 w-2 animate-bounce rounded-full bg-current [animation-delay:-0.3s]" />
            <span className="h-2 w-2 animate-bounce rounded-full bg-current [animation-delay:-0.15s]" />
            <span className="h-2 w-2 animate-bounce rounded-full bg-current" />
          </div>
        ) : (
          <div className="prose prose-sm dark:prose-invert max-w-none break-words">
            <ReactMarkdown
              components={{
                code({ className, children, ...props }) {
                  const match = /language-(\w+)/.exec(className || '')
                  const isInline = !match
                  return isInline ? (
                    <code
                      className="rounded bg-secondary px-1 py-0.5 font-mono text-sm"
                      {...props}
                    >
                      {children}
                    </code>
                  ) : (
                    <SyntaxHighlighter
                      style={oneDark}
                      language={match[1]}
                      PreTag="div"
                      className="rounded-lg text-sm"
                    >
                      {String(children).replace(/\n$/, '')}
                    </SyntaxHighlighter>
                  )
                },
                p({ children }) {
                  return <p className="mb-2 last:mb-0">{children}</p>
                },
                ul({ children }) {
                  return <ul className="mb-2 list-disc pl-4">{children}</ul>
                },
                ol({ children }) {
                  return <ol className="mb-2 list-decimal pl-4">{children}</ol>
                },
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>
        )}
      </div>

      {isUser && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
          <User className="h-4 w-4" />
        </div>
      )}
    </div>
  )
}
